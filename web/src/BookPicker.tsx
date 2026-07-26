import { useCallback, useEffect, useRef, useState } from 'react'
import './BookPicker.css'

export interface BookHit {
  slug: string
  title: string
  current?: boolean
}

interface Props {
  currentSlug: string
  disabled?: boolean
  onOpen: (slug: string) => void
}

const LIMIT = 20
const DEBOUNCE_MS = 200

/**
 * Search-as-you-type book opener. Never renders the full catalog into the DOM —
 * asks {@code GET /api/books?q=&limit=} and shows ≤ LIMIT hits.
 */
export default function BookPicker({ currentSlug, disabled, onOpen }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<BookHit[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)

  const search = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(LIMIT) })
      if (query.trim()) params.set('q', query.trim())
      const r = await fetch(`/api/books?${params}`)
      if (!r.ok) return
      const j = (await r.json()) as { books?: BookHit[]; total?: number }
      setHits(j.books ?? [])
      setTotal(j.total ?? 0)
    } catch {
      // API down
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void search(q)
    }, DEBOUNCE_MS)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [q, open, search])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const currentTitle =
    hits.find((h) => h.slug === currentSlug)?.title ??
    currentSlug.replace(/-/g, ' ')

  return (
    <div className="book-picker" ref={wrapRef}>
      <span className="book-picker-label">Bài</span>
      <button
        type="button"
        className="book-picker-current"
        disabled={disabled}
        title={currentSlug}
        onClick={() => {
          setOpen((v) => !v)
          if (!open) void search(q)
        }}
      >
        <strong>{currentTitle || '— chọn bài —'}</strong>
        <span className="book-picker-chevron">▾</span>
      </button>

      {open && (
        <div className="book-picker-panel">
          <input
            type="search"
            autoFocus
            placeholder="Tìm theo tên / slug…"
            value={q}
            disabled={disabled}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false)
              if (e.key === 'Enter' && hits[0]) {
                onOpen(hits[0].slug)
                setOpen(false)
              }
            }}
          />
          <div className="book-picker-meta">
            {loading
              ? 'Đang tìm…'
              : total > hits.length
                ? `${hits.length}/${total} (gõ để thu hẹp)`
                : `${hits.length} kết quả`}
          </div>
          <ul className="book-picker-hits">
            {hits.map((h) => (
              <li key={h.slug}>
                <button
                  type="button"
                  className={h.slug === currentSlug ? 'active' : ''}
                  disabled={disabled || h.slug === currentSlug}
                  onClick={() => {
                    onOpen(h.slug)
                    setOpen(false)
                  }}
                >
                  <strong>{h.title}</strong>
                  <span>{h.slug}</span>
                </button>
              </li>
            ))}
            {!loading && hits.length === 0 && (
              <li className="book-picker-empty">Không khớp “{q}”.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
