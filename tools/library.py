#!/usr/bin/env python3
"""
Catalog + batch-OMR pipeline for a large sheet-music library (~20k PDFs).

Layout:
    library/catalog.db          SQLite catalog (single source of truth)
    library/pdfs/<slug>.pdf     original PDFs (deduped by sha256)
    library/works/<slug>/       OMR artifacts: .omr, .mxl (mvt*), logs
    web/public/library/         export-index output for the web player

Commands:
    ingest <pdf|dir>...             register PDFs (copy + dedupe)
    adopt <slug> --from <dir>       take pre-existing artifacts, mark done
    process [--limit N] [--batch-size K] [--dry-run]
                                    run Audiveris batch OMR on pending rows
    status                          counts by status
    list [--search TEXT]            browse catalog
    export-index                    write web/public/library/index.json + mxl

Run from the repo root:  python3 tools/library.py <command> ...
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sqlite3
import subprocess
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LIB = REPO / "library"
PDF_DIR = LIB / "pdfs"
WORKS_DIR = LIB / "works"
DB_PATH = LIB / "catalog.db"
WEB_LIB = REPO / "web" / "public" / "library"

SCHEMA = """
CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT,
    pdf_path TEXT,
    sha256 TEXT UNIQUE,
    pages INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    omr_path TEXT,
    mxl_paths TEXT,
    error TEXT,
    warnings INTEGER DEFAULT 0,
    duration_s REAL,
    created_at TEXT,
    processed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_scores_status ON scores(status);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def db() -> sqlite3.Connection:
    LIB.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def slugify(name: str) -> str:
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode()
    name = re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-").lower()
    return name or "untitled"


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def pdf_pages(path: Path) -> int | None:
    try:
        from pypdf import PdfReader  # type: ignore

        return len(PdfReader(str(path)).pages)
    except Exception:
        # Cheap fallback: count /Type /Page markers
        try:
            data = path.read_bytes()
            n = len(re.findall(rb"/Type\s*/Page[^s]", data))
            return n or None
        except Exception:
            return None


def title_from_slug(slug: str) -> str:
    return slug.replace("-", " ").title()


# ---------------------------------------------------------------- ingest


def cmd_ingest(args: argparse.Namespace) -> None:
    pdfs: list[Path] = []
    for raw in args.paths:
        p = Path(raw).expanduser().resolve()
        if p.is_dir():
            pdfs.extend(sorted(p.rglob("*.pdf")))
        elif p.suffix.lower() == ".pdf":
            pdfs.append(p)
        else:
            print(f"skip (not pdf): {p}")
    if not pdfs:
        print("no PDFs found")
        return

    PDF_DIR.mkdir(parents=True, exist_ok=True)
    conn = db()
    added = dup = 0
    for pdf in pdfs:
        digest = sha256_of(pdf)
        row = conn.execute("SELECT slug FROM scores WHERE sha256=?", (digest,)).fetchone()
        if row:
            print(f"dup (same sha256 as '{row['slug']}'): {pdf.name}")
            dup += 1
            continue
        slug = slugify(pdf.stem)
        # slug collision with different content -> suffix by short hash
        if conn.execute("SELECT 1 FROM scores WHERE slug=?", (slug,)).fetchone():
            slug = f"{slug}-{digest[:8]}"
        dest = PDF_DIR / f"{slug}.pdf"
        if pdf != dest:
            shutil.copy2(pdf, dest)
        conn.execute(
            "INSERT INTO scores (slug, title, pdf_path, sha256, pages, status, created_at)"
            " VALUES (?,?,?,?,?, 'pending', ?)",
            (slug, title_from_slug(slug), str(dest.relative_to(REPO)), digest,
             pdf_pages(dest), now()),
        )
        added += 1
        print(f"ingested: {slug}")
    conn.commit()
    print(f"-- added {added}, duplicates {dup}, total "
          f"{conn.execute('SELECT COUNT(*) c FROM scores').fetchone()['c']}")


# ---------------------------------------------------------------- adopt


def register_artifacts(conn: sqlite3.Connection, slug: str, work: Path) -> tuple[str | None, list[str]]:
    omr = next(iter(sorted(work.glob("*.omr"))), None)
    mxls = sorted(work.glob("*.mxl"))
    conn.execute(
        "UPDATE scores SET status='done', omr_path=?, mxl_paths=?, processed_at=? WHERE slug=?",
        (str(omr.relative_to(REPO)) if omr else None,
         json.dumps([str(m.relative_to(REPO)) for m in mxls]),
         now(), slug),
    )
    return (str(omr) if omr else None, [str(m) for m in mxls])


def cmd_adopt(args: argparse.Namespace) -> None:
    conn = db()
    slug = args.slug
    row = conn.execute("SELECT * FROM scores WHERE slug=?", (slug,)).fetchone()
    if not row:
        sys.exit(f"slug '{slug}' not in catalog — ingest the PDF first")
    src = Path(args.src).expanduser().resolve()
    found = sorted(src.glob(f"{slug}*.omr")) + sorted(src.glob(f"{slug}*.mxl"))
    if not found:
        sys.exit(f"no '{slug}*.omr/.mxl' in {src}")
    work = WORKS_DIR / slug
    work.mkdir(parents=True, exist_ok=True)
    for f in found:
        shutil.copy2(f, work / f.name)
        print(f"adopted: {f.name}")
    omr, mxls = register_artifacts(conn, slug, work)
    conn.commit()
    print(f"-- {slug}: done ({len(mxls)} mxl, omr={'yes' if omr else 'no'})")


# ---------------------------------------------------------------- process


# indentations=false: don't treat an indented first system as a new movement.
# Most songs here are one continuous piece; the default (true) over-splits into
# many tiny .mxl. Pass --split-movements to keep Audiveris' default behaviour.
NO_SPLIT_CONST = "org.audiveris.omr.sheet.ProcessingSwitches.indentations=false"


def cmd_process(args: argparse.Namespace) -> None:
    conn = db()
    rows = conn.execute(
        "SELECT * FROM scores WHERE status='pending' ORDER BY id LIMIT ?",
        (args.limit,),
    ).fetchall()
    if not rows:
        print("nothing pending")
        return

    batches = [rows[i : i + args.batch_size] for i in range(0, len(rows), args.batch_size)]
    print(f"{len(rows)} pending -> {len(batches)} batch(es) of <= {args.batch_size}")

    for bi, batch in enumerate(batches, 1):
        tmp_out = LIB / "tmp-out"
        pdf_args = ",".join(str(REPO / r["pdf_path"]) for r in batch)
        parts = ["-batch", "-transcribe", "-export"]
        if not args.split_movements:
            parts += ["-constant", NO_SPLIT_CONST]
        parts += ["-output", str(tmp_out), pdf_args]
        cmdline = ",".join(parts)
        cmd = ["./gradlew", ":app:run", "--no-daemon", "--console=plain",
               f"-PcmdLineArgs={cmdline}"]
        print(f"[batch {bi}/{len(batches)}] {' '.join(cmd)}")
        if args.dry_run:
            continue

        tmp_out.mkdir(parents=True, exist_ok=True)
        slugs = [r["slug"] for r in batch]
        conn.execute(
            f"UPDATE scores SET status='processing' WHERE slug IN ({','.join('?' * len(slugs))})",
            slugs,
        )
        conn.commit()
        t0 = datetime.now()
        proc = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True)
        dt = (datetime.now() - t0).total_seconds()
        log_tail = (proc.stdout + proc.stderr)[-4000:]

        for r in batch:
            slug = r["slug"]
            produced = sorted(tmp_out.glob(f"{slug}*"))
            work = WORKS_DIR / slug
            work.mkdir(parents=True, exist_ok=True)
            for f in produced:
                shutil.move(str(f), work / f.name)
            if any(work.glob("*.mxl")):
                register_artifacts(conn, slug, work)
                conn.execute(
                    "UPDATE scores SET duration_s=?, warnings=? WHERE slug=?",
                    (dt / len(batch),
                     log_tail.count("WARN"), slug),
                )
                print(f"  done: {slug}")
            else:
                conn.execute(
                    "UPDATE scores SET status='failed', error=?, processed_at=? WHERE slug=?",
                    (f"exit={proc.returncode}; no .mxl produced", now(), slug),
                )
                print(f"  FAILED: {slug} (exit {proc.returncode})")
        conn.commit()


# ---------------------------------------------------------------- status / list


def cmd_status(_: argparse.Namespace) -> None:
    conn = db()
    total = conn.execute("SELECT COUNT(*) c FROM scores").fetchone()["c"]
    print(f"total: {total}")
    for row in conn.execute(
        "SELECT status, COUNT(*) c FROM scores GROUP BY status ORDER BY c DESC"
    ):
        print(f"  {row['status']}: {row['c']}")


def cmd_list(args: argparse.Namespace) -> None:
    conn = db()
    q = "SELECT slug, title, status, pages, mxl_paths FROM scores"
    params: tuple = ()
    if args.search:
        q += " WHERE slug LIKE ? OR title LIKE ?"
        like = f"%{args.search}%"
        params = (like, like)
    q += " ORDER BY slug"
    for row in conn.execute(q, params):
        n_mxl = len(json.loads(row["mxl_paths"])) if row["mxl_paths"] else 0
        print(f"{row['status']:10} {row['slug']:50} pages={row['pages']} mxl={n_mxl}")


# ---------------------------------------------------------------- export-index


def cmd_export_index(_: argparse.Namespace) -> None:
    conn = db()
    WEB_LIB.mkdir(parents=True, exist_ok=True)
    entries = []
    for row in conn.execute("SELECT * FROM scores ORDER BY title"):
        parts = []
        if row["mxl_paths"]:
            dest_dir = WEB_LIB / row["slug"]
            dest_dir.mkdir(exist_ok=True)
            for rel in json.loads(row["mxl_paths"]):
                src = REPO / rel
                if not src.exists():
                    continue
                shutil.copy2(src, dest_dir / src.name)
                parts.append({
                    "name": src.stem.replace(row["slug"], "").strip(".") or "full",
                    "url": f"/library/{row['slug']}/{src.name}",
                })
        entries.append({
            "slug": row["slug"],
            "title": row["title"],
            "status": row["status"],
            "pages": row["pages"],
            "warnings": row["warnings"],
            "parts": parts,
        })
    index = {"generated": now(), "count": len(entries), "scores": entries}
    out = WEB_LIB / "index.json"
    out.write_text(json.dumps(index, ensure_ascii=False, indent=2), "utf-8")
    print(f"wrote {out.relative_to(REPO)} ({len(entries)} scores)")


# ---------------------------------------------------------------- main


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("ingest", help="register PDFs into the catalog")
    p.add_argument("paths", nargs="+")
    p.set_defaults(fn=cmd_ingest)

    p = sub.add_parser("adopt", help="take pre-existing artifacts for a slug")
    p.add_argument("slug")
    p.add_argument("--from", dest="src", required=True)
    p.set_defaults(fn=cmd_adopt)

    p = sub.add_parser("process", help="run Audiveris batch OMR on pending rows")
    p.add_argument("--limit", type=int, default=10)
    p.add_argument("--batch-size", type=int, default=10)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--split-movements", action="store_true",
                   help="keep Audiveris' indentation-based movement split (default: off)")
    p.set_defaults(fn=cmd_process)

    p = sub.add_parser("status")
    p.set_defaults(fn=cmd_status)

    p = sub.add_parser("list")
    p.add_argument("--search")
    p.set_defaults(fn=cmd_list)

    p = sub.add_parser("export-index", help="write web/public/library/index.json")
    p.set_defaults(fn=cmd_export_index)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
