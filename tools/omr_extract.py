#!/usr/bin/env python3
"""Extract sheet image + Inter/Relation data from an Audiveris .omr project.

An .omr file is a zip holding book.xml plus, per sheet, sheet#N/sheet#N.xml
(JAXB) and sheet#N/BINARY.png. This dumps, per sheet, the PNG plus a JSON of
every Inter (bounds in image pixel coordinates) so a web viewer can draw an
overlay on top of the image.

Usage:
    python3 tools/omr_extract.py <book.omr> <output-dir>
"""

from __future__ import annotations

import json
import re
import struct
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

SHEET_XML = re.compile(r"^sheet#(\d+)/sheet#\1\.xml$")


def png_size(data: bytes) -> tuple[int, int]:
    """Width/height from the IHDR chunk of a PNG."""
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    width, height = struct.unpack(">II", data[16:24])
    return width, height


def parse_sheet(xml_bytes: bytes) -> dict:
    root = ET.fromstring(xml_bytes)
    inters: list[dict] = []
    relations: list[dict] = []

    for system in root.iter("system"):
        system_id = int(system.get("id", "0"))
        for sig in system.iter("sig"):
            for container in sig.findall("inters"):
                for el in container:
                    bounds = el.find("bounds")
                    if bounds is None or "id" not in el.attrib:
                        continue
                    grade = el.get("grade")
                    ctx = el.get("ctx-grade")
                    staff = el.get("staff")
                    inters.append(
                        {
                            "id": int(el.get("id")),
                            "type": el.tag,
                            "shape": el.get("shape"),
                            "grade": float(grade) if grade else None,
                            "ctxGrade": float(ctx) if ctx else None,
                            "staff": int(staff) if staff else None,
                            "system": system_id,
                            "x": int(bounds.get("x")),
                            "y": int(bounds.get("y")),
                            "w": int(bounds.get("w")),
                            "h": int(bounds.get("h")),
                        }
                    )
            for container in sig.findall("relations"):
                for el in container.findall("relation"):
                    kind = next((c.tag for c in el), "unknown")
                    relations.append(
                        {
                            "source": int(el.get("source")),
                            "target": int(el.get("target")),
                            "type": kind,
                        }
                    )

    return {"inters": inters, "relations": relations}


def extract(omr_path: Path, out_dir: Path) -> dict:
    book_name = omr_path.stem
    book_dir = out_dir / book_name
    book_dir.mkdir(parents=True, exist_ok=True)
    sheets: list[dict] = []

    with zipfile.ZipFile(omr_path) as zf:
        numbers = sorted(
            int(m.group(1))
            for m in (SHEET_XML.match(n) for n in zf.namelist())
            if m
        )
        for number in numbers:
            image_name = f"sheet-{number}.png"
            png = zf.read(f"sheet#{number}/BINARY.png")
            (book_dir / image_name).write_bytes(png)
            width, height = png_size(png)

            data = parse_sheet(zf.read(f"sheet#{number}/sheet#{number}.xml"))
            sheet = {
                "book": book_name,
                "sheet": number,
                "image": image_name,
                "width": width,
                "height": height,
                **data,
            }
            (book_dir / f"sheet-{number}.json").write_text(
                json.dumps(sheet), encoding="utf-8"
            )
            sheets.append(
                {
                    "sheet": number,
                    "image": image_name,
                    "data": f"sheet-{number}.json",
                    "width": width,
                    "height": height,
                    "interCount": len(data["inters"]),
                    "relationCount": len(data["relations"]),
                }
            )

    manifest = {"book": book_name, "sheets": sheets}
    (book_dir / "index.json").write_text(json.dumps(manifest), encoding="utf-8")
    return manifest


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        return 2
    omr_path = Path(sys.argv[1]).resolve()
    out_dir = Path(sys.argv[2]).resolve()
    if not omr_path.is_file():
        print(f"no such .omr: {omr_path}", file=sys.stderr)
        return 1

    manifest = extract(omr_path, out_dir)
    for sheet in manifest["sheets"]:
        print(
            f"sheet {sheet['sheet']}: {sheet['width']}x{sheet['height']}px, "
            f"{sheet['interCount']} inters, {sheet['relationCount']} relations"
        )
    print(f"-> {out_dir / manifest['book']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
