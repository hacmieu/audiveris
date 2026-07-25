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
import './App.css'

type Score = model.Score
type Track = model.Track
const PlayerState = synth.PlayerState

const DEFAULT_SCORE = '/scores/yeu-xa-sheet-nhac.mxl'

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mainRef.current || !viewportRef.current) return

    const api = new AlphaTabApi(mainRef.current, {
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
        soundFont: '/soundfont/sonivox.sf2',
        scrollElement: viewportRef.current,
      },
    } as json.SettingsJson)

    apiRef.current = api

    const onRenderStarted = () => setRendering(true)
    const onRenderFinished = () => setRendering(false)
    const onScoreLoaded = (score: Score) => {
      setTitle(score.title || 'Không tiêu đề')
      setArtist(score.artist || '')
      setTracks([...score.tracks])
      setActiveTrackIndexes(score.tracks.map((t) => t.index))
      setMuteMap({})
      setSoloMap({})
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
      setPosition(`${formatDuration(e.currentTime)} / ${formatDuration(e.endTime)}`)
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

    return () => {
      api.destroy()
      apiRef.current = null
    }
  }, [])

  const playPause = useCallback(() => apiRef.current?.playPause(), [])
  const stop = useCallback(() => apiRef.current?.stop(), [])

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
        <div className="topbar-actions">
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
        </div>
      </header>

      <div className="stage">
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
            Nguồn mặc định: MusicXML từ Audiveris (
            <code>yeu-xa-sheet-nhac.mxl</code>). Hỗ trợ thêm Guitar Pro.
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

      <footer className="transport">
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
            <span className="time">{position}</span>
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
