import { useEffect, useMemo, useState } from 'react'
import './Library.css'

interface LibraryPart {
  name: string
  url: string
}

interface LibraryScore {
  slug: string
  title: string
  status: string
  pages: number | null
  warnings: number
  omr: boolean
  parts: LibraryPart[]
}

interface LibraryIndex {
  generated: string
  count: number
  scores: LibraryScore[]
}

interface Props {
  /** Open a playable part in the Player mode. */
  onOpen: (url: string, title: string) => void
  /** Open the .omr of this score in OMR Viewer. */
  onEditOmr?: (slug: string, title: string) => void
}

const STATUS_LABEL: Record<string, string> = {
  done: 'Xong',
  pending: 'Chờ OMR',
  processing: 'Đang OMR',
  failed: 'Lỗi',
}

export default function Library({ onOpen, onEditOmr }: Props) {
  const [index, setIndex] = useState<LibraryIndex | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/library/index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<LibraryIndex>
      })
      .then((d) => {
        if (!cancelled) setIndex(d)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => {
    const scores = index?.scores ?? []
    const q = search.trim().toLowerCase()
    if (!q) return scores
    return scores.filter(
      (s) => s.title.toLowerCase().includes(q) || s.slug.includes(q),
    )
  }, [index, search])

  if (error) {
    return (
      <div className="lib lib-empty">
        <div>
          <strong>Không nạp được catalog</strong>
          <p>{error}</p>
          <pre>python3 tools/library.py export-index</pre>
        </div>
      </div>
    )
  }

  if (!index) {
    return (
      <div className="lib lib-empty">
        <div>Đang nạp thư viện…</div>
      </div>
    )
  }

  return (
    <div className="lib">
      <div className="lib-toolbar">
        <input
          type="search"
          placeholder="Tìm theo tên…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="lib-count">
          {visible.length}/{index.count} bản nhạc · cập nhật{' '}
          {new Date(index.generated).toLocaleString('vi-VN')}
        </span>
      </div>

      <div className="lib-body">
        <table className="lib-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Trạng thái</th>
              <th>Trang</th>
              <th>Phát</th>
              <th>OMR</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.slug}>
                <td>
                  <strong>{s.title}</strong>
                  <div className="lib-slug">{s.slug}</div>
                </td>
                <td>
                  <span className={`lib-status ${s.status}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </td>
                <td>{s.pages ?? '—'}</td>
                <td>
                  <div className="lib-parts">
                    {s.parts.map((p) => (
                      <button
                        type="button"
                        key={p.url}
                        onClick={() =>
                          onOpen(
                            p.url,
                            s.parts.length > 1 ? `${s.title} (${p.name})` : s.title,
                          )
                        }
                      >
                        ▶ {p.name}
                      </button>
                    ))}
                    {s.parts.length === 0 && <em>chưa có MusicXML</em>}
                  </div>
                </td>
                <td>
                  {s.omr && onEditOmr ? (
                    <button
                      type="button"
                      className="lib-omr"
                      onClick={() => onEditOmr(s.slug, s.title)}
                    >
                      Sửa OMR
                    </button>
                  ) : (
                    <em className="lib-none-inline">—</em>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="lib-none">Không có bản nhạc khớp "{search}".</p>
        )}
      </div>
    </div>
  )
}
