import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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

/** Prefer live JVM API; fall back to static extract of the first known book. */
const STATIC_DIR = '/omr/yeu-xa-sheet-nhac'
const STATIC_FILE = 'sheet-1.json'

interface LibraryBook {
  slug: string
  title: string
  omr: string
  current: boolean
}

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

const TEXT_ROLES = [
  'UnknownRole',
  'Lyrics',
  'ChordName',
  'Title',
  'Direction',
  'Number',
  'PartName',
  'Creator',
  'CreatorArranger',
  'CreatorComposer',
  'CreatorLyricist',
  'Rights',
  'EndingNumber',
  'EndingText',
  'Rehearsal',
  'Metronome',
] as const

type Layer = 'all' | 'music' | 'text' | 'lyrics' | 'chords' | 'title' | 'direction'

/** Curated shapes for manual add (P6). Names must match Audiveris {@code Shape} enum. */
const ADD_SHAPES: { group: string; shapes: string[] }[] = [
  { group: 'Nốt', shapes: ['NOTEHEAD_BLACK', 'NOTEHEAD_VOID', 'WHOLE_NOTE', 'BREVE'] },
  { group: 'Thân / Đuôi', shapes: ['STEM', 'FLAG_1', 'FLAG_2', 'FLAG_3'] },
  { group: 'Dấu chấm', shapes: ['AUGMENTATION_DOT'] },
  {
    group: 'Dấu lặng',
    shapes: ['WHOLE_REST', 'HALF_REST', 'QUARTER_REST', 'EIGHTH_REST', 'ONE_16TH_REST'],
  },
  { group: 'Hóa biểu', shapes: ['SHARP', 'FLAT', 'NATURAL', 'DOUBLE_SHARP', 'DOUBLE_FLAT'] },
  { group: 'Khóa nhạc', shapes: ['G_CLEF', 'F_CLEF', 'C_CLEF'] },
  {
    group: 'Số chỉ nhịp',
    shapes: ['COMMON_TIME', 'CUT_TIME', 'TIME_FOUR_FOUR', 'TIME_THREE_FOUR', 'TIME_SIX_EIGHT'],
  },
  { group: 'Vạch nhịp', shapes: ['THIN_BARLINE', 'THICK_BARLINE', 'FINAL_BARLINE'] },
  {
    group: 'Diễn tấu',
    shapes: ['STACCATO', 'ACCENT', 'TENUTO', 'FERMATA', 'TUPLET_THREE'],
  },
]

interface EditStatus {
  canUndo: boolean
  canRedo: boolean
  dirty: boolean
  message: string | null
}

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

async function loadSheet(sheetNum: number): Promise<SheetData> {
  const apiBase = `/api/sheet/${sheetNum}`
  try {
    const r = await fetch(`${apiBase}/data`)
    if (r.ok) {
      const d = (await r.json()) as SheetData
      return { ...d, image: `${apiBase}/image` }
    }
  } catch {
    // API not up — use static extract.
  }
  const r = await fetch(`${STATIC_DIR}/${STATIC_FILE}`)
  if (!r.ok) {
    throw new Error(
      `HTTP ${r.status} — chạy tools/omr_extract.py hoặc start OmrApiServer`,
    )
  }
  const d = (await r.json()) as SheetData
  return { ...d, image: `${STATIC_DIR}/${d.image}` }
}

interface OmrViewerProps {
  /** When set (from Library "Sửa OMR"), open that slug via the API. */
  requestedSlug?: string | null
  onSlugHandled?: () => void
}

export default function OmrViewer({ requestedSlug, onSlugHandled }: OmrViewerProps) {
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
  const [addShape, setAddShape] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [sheetNum, setSheetNum] = useState(1)
  const [sheetCount, setSheetCount] = useState(1)
  const [currentSlug, setCurrentSlug] = useState<string>('')
  const [edit, setEdit] = useState<EditStatus>({
    canUndo: false,
    canRedo: false,
    dirty: false,
    message: null,
  })

  const refreshBooks = useCallback(async () => {
    try {
      const r = await fetch('/api/books')
      if (!r.ok) return
      const j = (await r.json()) as { books?: LibraryBook[]; current?: string }
      setBooks(j.books ?? [])
      if (j.current) setCurrentSlug(j.current)
    } catch {
      // API offline
    }
  }, [])

  const refreshMeta = useCallback(async () => {
    try {
      const r = await fetch('/api/book')
      if (!r.ok) return
      const j = (await r.json()) as {
        book?: string
        slug?: string
        sheets?: { sheet: number }[]
        canUndo?: boolean
        canRedo?: boolean
        dirty?: boolean
      }
      const sheets = j.sheets ?? []
      setSheetCount(Math.max(1, sheets.length))
      if (j.slug || j.book) setCurrentSlug(j.slug || j.book || '')
      setEdit((e) => ({
        ...e,
        canUndo: Boolean(j.canUndo),
        canRedo: Boolean(j.canRedo),
        dirty: Boolean(j.dirty),
      }))
      // If current sheet num is out of range after book switch, reset to 1
      if (sheets.length > 0 && !sheets.some((s) => s.sheet === sheetNum)) {
        setSheetNum(sheets[0].sheet)
      }
    } catch {
      // ignore
    }
  }, [sheetNum])

  const refreshStatus = useCallback(async () => {
    if (source !== 'api') return
    try {
      const r = await fetch('/api/health')
      if (!r.ok) return
      const j = (await r.json()) as {
        canUndo?: boolean
        canRedo?: boolean
        dirty?: boolean
        book?: string
      }
      setEdit((e) => ({
        ...e,
        canUndo: Boolean(j.canUndo),
        canRedo: Boolean(j.canRedo),
        dirty: Boolean(j.dirty),
      }))
      if (j.book) setCurrentSlug(j.book)
    } catch {
      // ignore
    }
  }, [source])

  const reload = useCallback(
    async (keepSelection = true) => {
      const d = await loadSheet(sheetNum)
      setData(d)
      setSource(d.image.startsWith('/api/') ? 'api' : 'static')
      if (!keepSelection) setSelectedId(null)
    },
    [sheetNum],
  )

  const openSlug = useCallback(
    async (slug: string) => {
      if (edit.dirty) {
        const ok = window.confirm(
          `Bài "${currentSlug}" đang có thay đổi chưa lưu. Đổi bài sẽ bỏ các sửa đó. Tiếp tục?`,
        )
        if (!ok) return
      }
      setBusy(true)
      setError(null)
      try {
        const r = await fetch('/api/book/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, force: true }),
        })
        const j = (await r.json()) as {
          error?: string
          book?: string
          sheets?: { sheet: number }[]
          dirty?: boolean
        }
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
        const sheets = j.sheets ?? [{ sheet: 1 }]
        setSheetCount(sheets.length)
        setSheetNum(sheets[0].sheet)
        setCurrentSlug(j.book || slug)
        setSelectedId(null)
        setEdit((e) => ({
          ...e,
          canUndo: false,
          canRedo: false,
          dirty: Boolean(j.dirty),
          message: `Đã mở: ${j.book || slug}`,
        }))
        await refreshBooks()
        // loadSheet uses sheetNum state — setSheetNum is async; load sheet 1 explicitly
        const d = await loadSheet(sheets[0].sheet)
        setData(d)
        setSource(d.image.startsWith('/api/') ? 'api' : 'static')
      } catch (err) {
        setEdit((e) => ({
          ...e,
          message: err instanceof Error ? err.message : String(err),
        }))
      } finally {
        setBusy(false)
      }
    },
    [refreshBooks, edit.dirty, currentSlug],
  )

  const mutate = useCallback(
    async (label: string, run: () => Promise<Response>) => {
      if (source !== 'api') {
        setEdit((e) => ({
          ...e,
          message: 'Cần OmrApiServer (P2) để sửa — đang dùng snapshot tĩnh',
        }))
        return
      }
      setBusy(true)
      try {
        const r = await run()
        const j = (await r.json()) as {
          error?: string
          canUndo?: boolean
          canRedo?: boolean
          dirty?: boolean
          action?: string
          detail?: string
        }
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
        await reload(true)
        setEdit({
          canUndo: Boolean(j.canUndo),
          canRedo: Boolean(j.canRedo),
          dirty: Boolean(j.dirty),
          message: `${label}: ${j.detail ?? j.action ?? 'ok'}`,
        })
      } catch (err) {
        setEdit((e) => ({
          ...e,
          message: err instanceof Error ? err.message : String(err),
        }))
      } finally {
        setBusy(false)
      }
    },
    [source, reload],
  )

  const deleteSelected = useCallback(() => {
    if (selectedId === null) return
    if (!window.confirm(`Xóa Inter #${selectedId}?`)) return
    const id = selectedId
    void mutate('Xóa', () =>
      fetch(`/api/sheet/${sheetNum}/inter/${id}`, { method: 'DELETE' }),
    ).then(() => setSelectedId(null))
  }, [selectedId, mutate, sheetNum])

  const changeRole = useCallback(
    (role: string) => {
      if (selectedId === null) return
      void mutate('Đổi role', () =>
        fetch(`/api/sheet/${sheetNum}/inter/${selectedId}/role`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        }),
      )
    },
    [selectedId, mutate, sheetNum],
  )

  const addInterAt = useCallback(
    (sheetX: number, sheetY: number) => {
      if (!addShape) return
      void mutate(`Thêm ${addShape}`, () =>
        fetch(`/api/sheet/${sheetNum}/inter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shape: addShape,
            x: Math.round(sheetX),
            y: Math.round(sheetY),
          }),
        }),
      )
    },
    [addShape, mutate, sheetNum],
  )

  const onStageClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!addShape) return
      const rect = e.currentTarget.getBoundingClientRect()
      const sheetX = (e.clientX - rect.left) / zoom
      const sheetY = (e.clientY - rect.top) / zoom
      addInterAt(sheetX, sheetY)
    },
    [addShape, zoom, addInterAt],
  )

  const undo = useCallback(() => {
    void mutate('Undo', () => fetch('/api/book/undo', { method: 'POST' }))
  }, [mutate])

  const redo = useCallback(() => {
    void mutate('Redo', () => fetch('/api/book/redo', { method: 'POST' }))
  }, [mutate])

  const save = useCallback(() => {
    void mutate('Save', () => fetch('/api/book/save', { method: 'POST' }))
  }, [mutate])

  useEffect(() => {
    let cancelled = false
    void refreshBooks()
    void refreshMeta()
    loadSheet(sheetNum)
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
    // initial mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload when sheet number changes (after initial)
  useEffect(() => {
    if (!source) return
    let cancelled = false
    setBusy(true)
    loadSheet(sheetNum)
      .then((d) => {
        if (cancelled) return
        setData(d)
        setSource(d.image.startsWith('/api/') ? 'api' : 'static')
        setSelectedId(null)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [sheetNum]) // eslint-disable-line react-hooks/exhaustive-deps

  // Open slug requested from Library tab
  useEffect(() => {
    if (!requestedSlug) return
    if (requestedSlug === currentSlug) {
      onSlugHandled?.()
      return
    }
    void openSlug(requestedSlug).then(() => onSlugHandled?.())
  }, [requestedSlug, currentSlug, openSlug, onSlugHandled])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus, data])

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
        {source === 'api' && books.length > 0 && (
          <label className="omr-select omr-book">
            Bài
            <select
              disabled={busy}
              value={currentSlug}
              onChange={(e) => {
                const slug = e.target.value
                if (slug && slug !== currentSlug) void openSlug(slug)
              }}
            >
              {books.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.title}
                </option>
              ))}
            </select>
          </label>
        )}

        {source === 'api' && sheetCount > 1 && (
          <label className="omr-select">
            Trang
            <select
              disabled={busy}
              value={sheetNum}
              onChange={(e) => setSheetNum(Number(e.target.value))}
            >
              {Array.from({ length: sheetCount }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}/{sheetCount}
                </option>
              ))}
            </select>
          </label>
        )}

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
          {edit.dirty ? ' · dirty' : ''}
        </div>

        {source === 'api' && (
          <label className="omr-select omr-add">
            + Thêm
            <select value={addShape} onChange={(e) => setAddShape(e.target.value)}>
              <option value="">— tắt —</option>
              {ADD_SHAPES.map(({ group, shapes }) => (
                <optgroup key={group} label={group}>
                  {shapes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}

        {source === 'api' && (
          <div className="omr-edit">
            <button type="button" disabled={busy || !edit.canUndo} onClick={undo}>
              Undo
            </button>
            <button type="button" disabled={busy || !edit.canRedo} onClick={redo}>
              Redo
            </button>
            <button type="button" disabled={busy || !edit.dirty} onClick={save}>
              Save .omr
            </button>
          </div>
        )}
      </div>
      {addShape && (
        <div className="omr-toast omr-adding-hint">
          Chế độ thêm: bấm lên bản nhạc để đặt <strong>{addShape}</strong> (auto gắn staff gần
          nhất). Chọn “— tắt —” để thoát.
        </div>
      )}
      {edit.message && <div className="omr-toast">{edit.message}</div>}

      <div className="omr-body">
        <div className="omr-canvas" ref={canvasRef}>
          <div
            className={`omr-stage${addShape ? ' adding' : ''}`}
            style={{ width: data.width * zoom, height: data.height * zoom }}
            onClick={onStageClick}
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
                {selected.role !== undefined &&
                  (selected.type === 'sentence' ||
                    selected.type === 'lyric-line' ||
                    selected.type === 'chord-sentence') && (
                  <>
                    <dt>Role</dt>
                    <dd>
                      <select
                        className="omr-role"
                        disabled={busy || source !== 'api'}
                        value={selected.role ?? 'UnknownRole'}
                        onChange={(e) => changeRole(e.target.value)}
                      >
                        {TEXT_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </dd>
                  </>
                )}
                {selected.role &&
                  selected.type !== 'sentence' &&
                  selected.type !== 'lyric-line' &&
                  selected.type !== 'chord-sentence' && (
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
              <div className="omr-actions">
                <button
                  type="button"
                  className="danger"
                  disabled={busy || source !== 'api'}
                  onClick={deleteSelected}
                >
                  Xóa Inter
                </button>
              </div>
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
