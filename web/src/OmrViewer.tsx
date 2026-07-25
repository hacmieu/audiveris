import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './OmrViewer.css'

/** One Audiveris Inter, bounds in sheet image pixel coordinates. */
export interface Inter {
  id: number
  type: string
  shape: string | null
  grade: number | null
  ctxGrade: number | null
  staff: number | null
  system: number
  x: number
  y: number
  w: number
  h: number
}

export interface Relation {
  source: number
  target: number
  type: string
}

export interface SheetData {
  book: string
  sheet: number
  image: string
  width: number
  height: number
  inters: Inter[]
  relations: Relation[]
}

const BOOK_DIR = '/omr/yeu-xa-sheet-nhac'
const SHEET_FILE = 'sheet-1.json'

const LOW_GRADE = 0.5
const MID_GRADE = 0.7

function gradeClass(grade: number | null): string {
  if (grade === null) return 'g-none'
  if (grade < LOW_GRADE) return 'g-low'
  if (grade < MID_GRADE) return 'g-mid'
  return 'g-high'
}

export default function OmrViewer() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<SheetData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.3)
  const [showOverlay, setShowOverlay] = useState(true)
  const [typeFilter, setTypeFilter] = useState('*')
  const [maxGrade, setMaxGrade] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${BOOK_DIR}/${SHEET_FILE}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} — chưa chạy tools/omr_extract.py?`)
        return r.json() as Promise<SheetData>
      })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const byId = useMemo(() => {
    const map = new Map<number, Inter>()
    for (const inter of data?.inters ?? []) map.set(inter.id, inter)
    return map
  }, [data])

  const types = useMemo(() => {
    const counts = new Map<string, number>()
    for (const inter of data?.inters ?? []) {
      counts.set(inter.type, (counts.get(inter.type) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [data])

  const visible = useMemo(() => {
    return (data?.inters ?? []).filter(
      (inter) =>
        (typeFilter === '*' || inter.type === typeFilter) &&
        (inter.grade === null || inter.grade <= maxGrade),
    )
  }, [data, typeFilter, maxGrade])

  const selected = selectedId === null ? null : (byId.get(selectedId) ?? null)

  const selectedRelations = useMemo(() => {
    if (selectedId === null) return []
    return (data?.relations ?? [])
      .filter((rel) => rel.source === selectedId || rel.target === selectedId)
      .map((rel) => {
        const otherId = rel.source === selectedId ? rel.target : rel.source
        return {
          ...rel,
          direction: rel.source === selectedId ? 'out' : 'in',
          other: byId.get(otherId) ?? null,
          otherId,
        }
      })
  }, [data, selectedId, byId])

  const fitWidth = useCallback(() => {
    if (!data || !canvasRef.current) return
    const available = canvasRef.current.clientWidth - 32
    setZoom(Math.max(0.05, available / data.width))
  }, [data])

  useEffect(() => {
    if (data) fitWidth()
  }, [data, fitWidth])

  if (error) {
    return (
      <div className="omr omr-empty">
        <div>
          <strong>Không nạp được dữ liệu OMR</strong>
          <p>{error}</p>
          <pre>python3 tools/omr_extract.py output/yeu-xa-sheet-nhac.omr web/public/omr</pre>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="omr omr-empty">
        <div>Đang nạp dữ liệu OMR…</div>
      </div>
    )
  }

  return (
    <div className="omr">
      <div className="omr-toolbar">
        <div className="omr-zoom">
          <button type="button" onClick={() => setZoom((z) => Math.max(0.05, z - 0.1))}>
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(4, z + 0.1))}>
            +
          </button>
          <button type="button" onClick={fitWidth}>
            Vừa khung
          </button>
          <button type="button" onClick={() => setZoom(1)}>
            100%
          </button>
        </div>

        <label className="omr-check">
          <input
            type="checkbox"
            checked={showOverlay}
            onChange={(e) => setShowOverlay(e.target.checked)}
          />
          Overlay
        </label>

        <label className="omr-select">
          Loại
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="*">Tất cả ({data.inters.length})</option>
            {types.map(([type, count]) => (
              <option key={type} value={type}>
                {type} ({count})
              </option>
            ))}
          </select>
        </label>

        <label className="omr-range">
          Grade ≤ {maxGrade.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={maxGrade}
            onChange={(e) => setMaxGrade(Number(e.target.value))}
          />
        </label>

        <div className="omr-legend">
          <span className="g-low">&lt;0.5</span>
          <span className="g-mid">&lt;0.7</span>
          <span className="g-high">≥0.7</span>
        </div>

        <div className="omr-count">
          {visible.length} / {data.inters.length} inter · {data.relations.length} relation
        </div>
      </div>

      <div className="omr-body">
        <div className="omr-canvas" ref={canvasRef}>
          <div
            className="omr-stage"
            style={{ width: data.width * zoom, height: data.height * zoom }}
          >
            <img
              src={`${BOOK_DIR}/${data.image}`}
              alt={`Sheet ${data.sheet}`}
              width={data.width * zoom}
              height={data.height * zoom}
              draggable={false}
            />
            {showOverlay &&
              visible.map((inter) => (
                <button
                  type="button"
                  key={inter.id}
                  className={`omr-box ${gradeClass(inter.grade)} ${
                    inter.id === selectedId ? 'selected' : ''
                  }`}
                  style={{
                    left: inter.x * zoom,
                    top: inter.y * zoom,
                    width: Math.max(2, inter.w * zoom),
                    height: Math.max(2, inter.h * zoom),
                  }}
                  title={`${inter.type} ${inter.shape ?? ''} · grade ${inter.grade ?? '—'}`}
                  onClick={() => setSelectedId(inter.id)}
                />
              ))}
          </div>
        </div>

        <aside className="omr-info">
          {selected ? (
            <>
              <h3>
                {selected.type}
                <span className="omr-id">#{selected.id}</span>
              </h3>
              <dl>
                <dt>Shape</dt>
                <dd>{selected.shape ?? '—'}</dd>
                <dt>Grade</dt>
                <dd className={gradeClass(selected.grade)}>
                  {selected.grade?.toFixed(2) ?? '—'}
                </dd>
                <dt>Ctx-grade</dt>
                <dd>{selected.ctxGrade?.toFixed(2) ?? '—'}</dd>
                <dt>System / Staff</dt>
                <dd>
                  {selected.system} / {selected.staff ?? '—'}
                </dd>
                <dt>Bounds</dt>
                <dd>
                  x{selected.x} y{selected.y} · {selected.w}×{selected.h}
                </dd>
              </dl>
              <h4>Relations ({selectedRelations.length})</h4>
              <ul className="omr-rels">
                {selectedRelations.map((rel, i) => (
                  <li key={`${rel.source}-${rel.target}-${i}`}>
                    <span className={`omr-dir ${rel.direction}`}>
                      {rel.direction === 'out' ? '→' : '←'}
                    </span>
                    <button type="button" onClick={() => setSelectedId(rel.otherId)}>
                      {rel.other?.type ?? '?'} #{rel.otherId}
                    </button>
                    <em>{rel.type}</em>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="omr-hint">
              Bấm vào một ô trên bản nhạc để xem Inter mà Audiveris đã nhận dạng.
              Ô đỏ = độ tin cậy thấp, dễ sai.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
