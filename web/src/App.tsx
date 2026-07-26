import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {
  AlphaTabApi,
  LayoutMode,
  model,
  synth,
  type json,
} from '@coderline/alphatab'
import OmrViewer from './OmrViewer'
import Library from './Library'
import './App.css'

type Mode = 'player' | 'omr' | 'library'
type Score = model.Score
type Track = model.Track
const PlayerState = synth.PlayerState

// Audiveris export (music21-merged files crash alphaTab's MusicXML importer).
const DEFAULT_SCORE = '/library/yeu-xa-sheet-nhac/yeu-xa-sheet-nhac.mxl'

// Better-sounding GM soundfont (gitignored, see README); sonivox ships with alphaTab.
const SOUNDFONT_HQ = '/soundfont/MuseScore_General.sf3'
const SOUNDFONT_DEFAULT = '/soundfont/sonivox.sf2'

// Standard guitar tuning, top tablature line first (E4 B3 G3 D3 A2 E2).
const GUITAR_TUNING = [64, 59, 55, 50, 45, 40]
const MAX_FRET = 24

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * OMR MusicXML has no string/fret data. Assign a standard guitar tuning and
 * compute a playable fret per note so alphaTab can engrave a tab staff.
 * Fret math must stay exact (midi - openString) so playback pitch is unchanged.
 */
function generateTabData(score: Score): void {
  for (const track of score.tracks) {
    for (const staff of track.staves) {
      if (staff.isPercussion) continue
      staff.stringTuning.tunings = [...GUITAR_TUNING]
      staff.stringTuning.finish()
      const stringCount = GUITAR_TUNING.length
      for (const bar of staff.bars) {
        for (const voice of bar.voices) {
          for (const beat of voice.beats) {
            for (const note of beat.notes) {
              const midi = note.realValue
              let bestString = -1
              let bestFret = Number.MAX_SAFE_INTEGER
              // tunings[0] is the top tab line; note.string 1 = lowest string.
              for (let line = 0; line < stringCount; line++) {
                const fret = midi - GUITAR_TUNING[line]
                if (fret >= 0 && fret <= MAX_FRET && fret < bestFret) {
                  bestFret = fret
                  bestString = stringCount - line
                }
              }
              if (bestString !== -1) {
                note.string = bestString
                note.fret = bestFret
              }
            }
          }
        }
      }
    }
  }
}

export default function App() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<AlphaTabApi | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [ready, setReady] = useState(false)
  const [rendering, setRendering] = useState(true)
  const [sfProgress, setSfProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [title, setTitle] = useState('Đang tải…')
  const [artist, setArtist] = useState('')
  const [position, setPosition] = useState('00:00 / 00:00')
  const [speed, setSpeed] = useState(1)
  const [loop, setLoop] = useState(false)
  const [metronome, setMetronome] = useState(false)
  const [countIn, setCountIn] = useState(false)
  const [tracks, setTracks] = useState<Track[]>([])
  const [activeTrackIndexes, setActiveTrackIndexes] = useState<number[]>([])
  const [muteMap, setMuteMap] = useState<Record<number, boolean>>({})
  const [soloMap, setSoloMap] = useState<Record<number, boolean>>({})
  const [showTab, setShowTab] = useState(false)
  const [soundFontName, setSoundFontName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('player')
  const [omrSlug, setOmrSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!mainRef.current || !viewportRef.current) return

    let cancelled = false
    let api: AlphaTabApi | null = null

    const start = async () => {
      // Prefer HQ soundfont as the *initial* SF when available — never reload
      // after playerReady (that re-triggers ready and loops forever).
      let soundFont = SOUNDFONT_DEFAULT
      let soundFontLabel = 'SONiVOX GM'
      try {
        const head = await fetch(SOUNDFONT_HQ, { method: 'HEAD' })
        if (head.ok && !cancelled) {
          soundFont = SOUNDFONT_HQ
          soundFontLabel = 'MuseScore General'
        }
      } catch {
        // keep default
      }
      if (cancelled || !mainRef.current || !viewportRef.current) return

      api = new AlphaTabApi(mainRef.current, {
        core: {
          file: DEFAULT_SCORE,
          fontDirectory: '/font/',
        },
        display: {
          layoutMode: LayoutMode.Page,
          scale: 1,
        },
        player: {
          enablePlayer: true,
          enableCursor: true,
          enableUserInteraction: true,
          soundFont,
          scrollElement: viewportRef.current,
        },
      } as json.SettingsJson)

      apiRef.current = api
      setSoundFontName(soundFontLabel)

      const onRenderStarted = () => setRendering(true)
      const onRenderFinished = () => setRendering(false)
      const onScoreLoaded = (score: Score) => {
        generateTabData(score)
        setTitle(score.title || 'Không tiêu đề')
        setArtist(score.artist || '')
        setTracks([...score.tracks])
        setActiveTrackIndexes(score.tracks.map((t) => t.index))
        setMuteMap({})
        setSoloMap({})
        setShowTab(false)
        setError(null)
      }
      const onSoundFontLoad = (e: { loaded: number; total: number }) => {
        setSfProgress(Math.floor((e.loaded / e.total) * 100))
      }
      const onPlayerReady = () => {
        setReady(true)
        setSfProgress(100)
      }
      const onPlayerState = (e: { state: synth.PlayerState }) => {
        setPlaying(e.state === PlayerState.Playing)
      }
      let prevSec = -1
      const onPosition = (e: { currentTime: number; endTime: number }) => {
        const sec = Math.floor(e.currentTime / 1000)
        if (sec === prevSec) return
        prevSec = sec
        setPosition(
          `${formatDuration(e.currentTime)} / ${formatDuration(e.endTime)}`,
        )
      }
      const onError = (e: Error) => {
        console.error(e)
        setError(e.message || String(e))
        setRendering(false)
      }

      api.renderStarted.on(onRenderStarted)
      api.renderFinished.on(onRenderFinished)
      api.scoreLoaded.on(onScoreLoaded)
      api.soundFontLoad.on(onSoundFontLoad)
      api.playerReady.on(onPlayerReady)
      api.playerStateChanged.on(onPlayerState)
      api.playerPositionChanged.on(onPosition)
      api.error.on(onError)
    }

    void start()

    return () => {
      cancelled = true
      api?.destroy()
      if (apiRef.current === api) apiRef.current = null
    }
  }, [])

  const playPause = useCallback(() => {
    const api = apiRef.current
    if (!api) return
    if (!api.isReadyForPlayback) {
      setError('Player chưa sẵn sàng — đợi SoundFont nạp xong rồi thử lại')
      return
    }
    api.playPause()
  }, [])
  const stop = useCallback(() => apiRef.current?.stop(), [])

  const toggleTab = useCallback(() => {
    setShowTab((v) => {
      const next = !v
      const api = apiRef.current
      if (api?.score) {
        for (const track of api.score.tracks) {
          for (const staff of track.staves) {
            if (staff.isPercussion) continue
            staff.showTablature = next
            staff.showStandardNotation = true
          }
        }
        api.render()
      }
      return next
    })
  }, [])

  const toggleLoop = useCallback(() => {
    setLoop((v) => {
      const next = !v
      if (apiRef.current) apiRef.current.isLooping = next
      return next
    })
  }, [])

  const toggleMetronome = useCallback(() => {
    setMetronome((v) => {
      const next = !v
      if (apiRef.current) apiRef.current.metronomeVolume = next ? 1 : 0
      return next
    })
  }, [])

  const toggleCountIn = useCallback(() => {
    setCountIn((v) => {
      const next = !v
      if (apiRef.current) apiRef.current.countInVolume = next ? 1 : 0
      return next
    })
  }, [])

  const onSpeedChange = useCallback((value: number) => {
    setSpeed(value)
    if (apiRef.current) apiRef.current.playbackSpeed = value
  }, [])

  const renderTrack = useCallback((track: Track) => {
    apiRef.current?.renderTracks([track])
    setActiveTrackIndexes([track.index])
  }, [])

  const renderAllTracks = useCallback(() => {
    if (!apiRef.current?.score) return
    apiRef.current.renderTracks(apiRef.current.score.tracks)
    setActiveTrackIndexes(apiRef.current.score.tracks.map((t) => t.index))
  }, [])

  const applyMuteSolo = useCallback(
    (nextMute: Record<number, boolean>, nextSolo: Record<number, boolean>) => {
      const api = apiRef.current
      if (!api?.score) return
      const anySolo = Object.values(nextSolo).some(Boolean)
      for (const track of api.score.tracks) {
        const muted = anySolo
          ? !nextSolo[track.index]
          : Boolean(nextMute[track.index])
        api.changeTrackMute([track], muted)
      }
    },
    [],
  )

  const toggleMute = useCallback(
    (index: number) => {
      setMuteMap((prev) => {
        const next = { ...prev, [index]: !prev[index] }
        applyMuteSolo(next, soloMap)
        return next
      })
    },
    [applyMuteSolo, soloMap],
  )

  const toggleSolo = useCallback(
    (index: number) => {
      setSoloMap((prev) => {
        const next = { ...prev, [index]: !prev[index] }
        applyMuteSolo(muteMap, next)
        return next
      })
    },
    [applyMuteSolo, muteMap],
  )

  const loadFile = useCallback(async (file: File) => {
    const api = apiRef.current
    if (!api) return
    setReady(false)
    setRendering(true)
    setError(null)
    try {
      const buf = await file.arrayBuffer()
      api.load(new Uint8Array(buf))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setRendering(false)
    }
  }, [])

  const onPickFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void loadFile(file)
      e.target.value = ''
    },
    [loadFile],
  )

  const reloadDefault = useCallback(() => {
    apiRef.current?.load(DEFAULT_SCORE)
  }, [])

  const openFromLibrary = useCallback((url: string, _title: string) => {
    const api = apiRef.current
    if (!api) return
    setMode('player')
    setRendering(true)
    setError(null)
    api.load(url)
  }, [])

  const editOmrFromLibrary = useCallback((slug: string, _title: string) => {
    setOmrSlug(slug)
    setMode('omr')
  }, [])

  return (
    <div className="app" ref={wrapRef}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">♪</span>
          <div>
            <h1>Audiveris Player</h1>
            <p>alphaTab · kiểu Guitar Pro</p>
          </div>
        </div>
        <nav className="modes">
          <button
            type="button"
            className={`chip ${mode === 'player' ? 'active' : ''}`}
            onClick={() => setMode('player')}
          >
            Player
          </button>
          <button
            type="button"
            className={`chip ${mode === 'omr' ? 'active' : ''}`}
            onClick={() => setMode('omr')}
          >
            OMR Viewer
          </button>
          <button
            type="button"
            className={`chip ${mode === 'library' ? 'active' : ''}`}
            onClick={() => setMode('library')}
          >
            Thư viện
          </button>
        </nav>

        <div className="topbar-actions">
          {mode === 'player' && (
            <>
              <button type="button" className="ghost" onClick={reloadDefault}>
                Yêu Xa (OMR)
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => fileInputRef.current?.click()}
              >
                Mở file…
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mxl,.xml,.musicxml,.gp,.gpx,.gp3,.gp4,.gp5,.tex"
                hidden
                onChange={onPickFile}
              />
            </>
          )}
        </div>
      </header>

      {mode === 'omr' && (
        <OmrViewer
          requestedSlug={omrSlug}
          onSlugHandled={() => setOmrSlug(null)}
        />
      )}
      {mode === 'library' && (
        <Library onOpen={openFromLibrary} onEditOmr={editOmrFromLibrary} />
      )}

      <div className="stage" hidden={mode !== 'player'}>
        <aside className="sidebar">
          <h2>Tracks</h2>
          <button type="button" className="ghost block" onClick={renderAllTracks}>
            Hiện tất cả
          </button>
          <ul className="track-list">
            {tracks.map((track) => {
              const active = activeTrackIndexes.includes(track.index)
              return (
                <li key={track.index} className={active ? 'active' : ''}>
                  <button
                    type="button"
                    className="track-name"
                    onClick={() => renderTrack(track)}
                  >
                    {track.name || `Track ${track.index + 1}`}
                  </button>
                  <div className="track-mix">
                    <button
                      type="button"
                      className={muteMap[track.index] ? 'on' : ''}
                      title="Mute"
                      onClick={() => toggleMute(track.index)}
                    >
                      M
                    </button>
                    <button
                      type="button"
                      className={soloMap[track.index] ? 'on' : ''}
                      title="Solo"
                      onClick={() => toggleSolo(track.index)}
                    >
                      S
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="hint">
            Chọn bài từ tab <strong>Thư viện</strong> hoặc "Mở file…". Nguồn mặc
            định: <code>yeu-xa-sheet-nhac.mxl</code> (Audiveris). Hỗ trợ thêm Guitar
            Pro.
          </p>
          <p className="license">
            Powered by{' '}
            <a href="https://alphatab.net/" target="_blank" rel="noreferrer">
              alphaTab
            </a>{' '}
            (MPL-2.0)
          </p>
        </aside>

        <section className="sheet">
          {(rendering || !ready) && (
            <div className="overlay">
              <div className="overlay-card">
                {error ? (
                  <>
                    <strong>Lỗi tải bản nhạc</strong>
                    <p>{error}</p>
                  </>
                ) : (
                  <>
                    <strong>
                      {rendering ? 'Đang render bản nhạc…' : 'Đang nạp SoundFont…'}
                    </strong>
                    <p>{sfProgress < 100 ? `SoundFont ${sfProgress}%` : 'Sẵn sàng sắp xong'}</p>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="viewport" ref={viewportRef}>
            <div className="main" ref={mainRef} />
          </div>
        </section>
      </div>

      <footer className="transport" hidden={mode !== 'player'}>
        <div className="transport-left">
          <button type="button" className="icon" disabled={!ready} onClick={stop} title="Stop">
            ⏹
          </button>
          <button
            type="button"
            className="icon play"
            disabled={!ready}
            onClick={playPause}
            title="Play / Pause"
          >
            {playing ? '⏸' : '▶'}
          </button>
          <div className="meta">
            <strong>{title}</strong>
            <span>{artist || '—'}</span>
            <span className="time">
              {position}
              {soundFontName ? ` · ${soundFontName}` : ''}
            </span>
          </div>
        </div>

        <div className="transport-right">
          <label className="tempo">
            Tempo
            <input
              type="range"
              min={25}
              max={200}
              step={5}
              value={Math.round(speed * 100)}
              disabled={!ready}
              onChange={(e) => onSpeedChange(Number(e.target.value) / 100)}
            />
            <span>{Math.round(speed * 100)}%</span>
          </label>
          <button
            type="button"
            className={`chip ${showTab ? 'active' : ''}`}
            onClick={toggleTab}
            title="Hiện/ẩn tablature (guitar chuẩn EADGBE)"
          >
            Tab
          </button>
          <button
            type="button"
            className={`chip ${countIn ? 'active' : ''}`}
            disabled={!ready}
            onClick={toggleCountIn}
          >
            Count-in
          </button>
          <button
            type="button"
            className={`chip ${metronome ? 'active' : ''}`}
            disabled={!ready}
            onClick={toggleMetronome}
          >
            Metronome
          </button>
          <button
            type="button"
            className={`chip ${loop ? 'active' : ''}`}
            disabled={!ready}
            onClick={toggleLoop}
          >
            Loop
          </button>
        </div>
      </footer>
    </div>
  )
}
