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
  /** Capella-like TextRole on sentences (Title, Lyrics, ChordName, Direction…). */
  role: string | null
  /** OCR / chord / lyric string when present. */
  value: string | null
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

/** Prefer live JVM API (P2); fall back to static extract from P1. */
const API_SHEET = '/api/sheet/1'
const STATIC_DIR = '/omr/yeu-xa-sheet-nhac'
const STATIC_FILE = 'sheet-1.json'

const LOW_GRADE = 0.5
const MID_GRADE = 0.7

/** Inter types that are text (OCR), not notation symbols — Capella "text layer". */
const TEXT_TYPES = new Set([
  'word',
  'sentence',
  'lyric-item',
  'lyric-line',
  'chord-name',
  'chord-sentence',
])

type Layer = 'all' | 'music' | 'text' | 'lyrics' | 'chords' | 'title' | 'direction'

function gradeClass(grade: number | null): string {
  if (grade === null) return 'g-none'
  if (grade < LOW_GRADE) return 'g-low'
  if (grade < MID_GRADE) return 'g-mid'
  return 'g-high'
}

function matchesLayer(inter: Inter, layer: Layer): boolean {
  switch (layer) {
    case 'all':
      return true
    case 'music':
      return !TEXT_TYPES.has(inter.type)
    case 'text':
      return TEXT_TYPES.has(inter.type)
    case 'lyrics':
      return (
        inter.type === 'lyric-item' ||
        inter.type === 'lyric-line' ||
        inter.role === 'Lyrics'
      )
    case 'chords':
      return inter.type === 'chord-name' || inter.role === 'ChordName'
    case 'title':
      return inter.role === 'Title'
    case 'direction':
      return inter.role === 'Direction'
  }
}

async function loadSheet(): Promise<SheetData> {
  try {
    const r = await fetch(`${API_SHEET}/data`)
    if (r.ok) {
      const d = (await r.json()) as SheetData
      // Live API serves PNG at /api/sheet/n/image — rewrite for <img>.
      return { ...d, image: `${API_SHEET}/image` }
    }
  } catch {
    // API not up — use static extract.
  }
  const r = await fetch(`${STATIC_DIR}/${STATIC_FILE}`)
  if (!r.ok) {
    throw new Error(
      `HTTP ${r.status} — chạy tools/omr_extract.py hoặc start OmrApiServer (P2)`,
    )
  }
  const d = (await r.json()) as SheetData
  return { ...d, image: `${STATIC_DIR}/${d.image}` }
}

export default function OmrViewer() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<SheetData | null>(null)
  const [source, setSource] = useState<'api' | 'static' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.3)
  const [showOverlay, setShowOverlay] = useState(true)
  const [layer, setLayer] = useState<Layer>('all')
  const [typeFilter, setTypeFilter] = useState('*')
  const [maxGrade, setMaxGrade] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    loadSheet()
      .then((d) => {
        if (cancelled) return
        setData(d)
        setSource(d.image.startsWith('/api/') ? 'api' : 'static')
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
      if (!matchesLayer(inter, layer)) continue
      counts.set(inter.type, (counts.get(inter.type) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [data, layer])

  const layerCounts = useMemo(() => {
    const all = data?.inters ?? []
    const count = (l: Layer) => all.filter((i) => matchesLayer(i, l)).length
    return {
      all: all.length,
      music: count('music'),
      text: count('text'),
      lyrics: count('lyrics'),
      chords: count('chords'),
      title: count('title'),
      direction: count('direction'),
    }
  }, [data])

  const visible = useMemo(() => {
    return (data?.inters ?? []).filter(
      (inter) =>
        matchesLayer(inter, layer) &&
        (typeFilter === '*' || inter.type === typeFilter) &&
        (inter.grade === null || inter.grade <= maxGrade),
    )
  }, [data, layer, typeFilter, maxGrade])

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

  useEffect(() => {
    setTypeFilter('*')
  }, [layer])

  if (error) {
    return (
      <div className="omr omr-empty">
        <div>
          <strong>Không nạp được dữ liệu OMR</strong>
          <p>{error}</p>
          <pre>
            {`python3 tools/omr_extract.py output/yeu-xa-sheet-nhac.omr web/public/omr
# hoặc start P2:
./gradlew :app:run --no-daemon -PcmdLineArgs="-batch,-run,org.audiveris.omr.web.OmrApiServer,/ABS/output/yeu-xa-sheet-nhac.omr"`}
          </pre>
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
          Lớp
          <select
            value={layer}
            onChange={(e) => setLayer(e.target.value as Layer)}
            title="Capella-like: tách ký hiệu nhạc vs text"
          >
            <option value="all">Tất cả ({layerCounts.all})</option>
            <option value="music">Nhạc / ký hiệu ({layerCounts.music})</option>
            <option value="text">Text (OCR) ({layerCounts.text})</option>
            <option value="lyrics">Lời (Lyrics) ({layerCounts.lyrics})</option>
            <option value="chords">Hợp âm ({layerCounts.chords})</option>
            <option value="title">Tiêu đề ({layerCounts.title})</option>
            <option value="direction">Direction ({layerCounts.direction})</option>
          </select>
        </label>

        <label className="omr-select">
          Loại
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="*">Tất cả trong lớp</option>
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
          {visible.length} hiển thị · {data.relations.length} relation
          {source ? ` · ${source}` : ''}
        </div>
      </div>

      <div className="omr-body">
        <div className="omr-canvas" ref={canvasRef}>
          <div
            className="omr-stage"
            style={{ width: data.width * zoom, height: data.height * zoom }}
          >
            <img
              src={data.image}
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
                  } ${TEXT_TYPES.has(inter.type) ? 'textish' : 'musicish'}`}
                  style={{
                    left: inter.x * zoom,
                    top: inter.y * zoom,
                    width: Math.max(2, inter.w * zoom),
                    height: Math.max(2, inter.h * zoom),
                  }}
                  title={`${inter.type}${inter.role ? ` [${inter.role}]` : ''} ${
                    inter.value ?? inter.shape ?? ''
                  } · grade ${inter.grade ?? '—'}`}
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
                {selected.value && (
                  <>
                    <dt>Value</dt>
                    <dd className="omr-value">{selected.value}</dd>
                  </>
                )}
                {selected.role && (
                  <>
                    <dt>Role</dt>
                    <dd>{selected.role}</dd>
                  </>
                )}
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
                <dt>Lớp</dt>
                <dd>{TEXT_TYPES.has(selected.type) ? 'Text' : 'Nhạc'}</dd>
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
              Giống Capella Scan: chọn lớp <strong>Nhạc</strong> / <strong>Text</strong> /
              Lời / Hợp âm / Tiêu đề. Bấm ô để xem Inter. Sentence có{' '}
              <code>TextRole</code> (Title, Lyrics, ChordName, Direction…). Ô đỏ = độ tin
              cậy thấp.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
