import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getSettings, getPlaylists, getRotationState, saveRotationState,
  buildRotationStatus, skipToNext, recordPlaylistPlay, recordSongPlay,
  saveTimerTarget, getTimerTarget,
} from '../services/storage'

function openInSpotify(playlistId) {
  const webUrl = `https://open.spotify.com/playlist/${playlistId}`
  window.open(webUrl, '_blank')
}

// Play a short alert tone using Web Audio API
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const playTone = (freq, start, dur) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    playTone(880, 0, 0.15)
    playTone(1100, 0.18, 0.15)
    playTone(1320, 0.36, 0.25)
  } catch { /* silent fail if audio not supported */ }
}

export default function Rotation() {
  const [status, setStatus] = useState(() => buildRotationStatus())
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [switchCountdown, setSwitchCountdown] = useState(null)
  const [playlistEnded, setPlaylistEnded] = useState(false)
  const switchCountdownRef = useRef(null)
  const targetTimeRef = useRef(null)
  const timerRef = useRef(null)
  const skippingRef = useRef(false)
  const enabledRef = useRef(false)
  const controllerRef = useRef(null)
  const embedElRef = useRef(null)
  const currentPlIdRef = useRef(null)
  const apiReadyRef = useRef(false)
  const pendingUriRef = useRef(null)
  // Playlist-end detection refs
  const wasPlayingRef = useRef(false)
  const endCheckTimerRef = useRef(null)
  const doSkipRef = useRef(null)
  const modeRef = useRef('playlist_end')

  // Load the Spotify IFrame API script once
  useEffect(() => {
    if (document.getElementById('spotify-iframe-api')) return
    const script = document.createElement('script')
    script.id = 'spotify-iframe-api'
    script.src = 'https://open.spotify.com/embed/iframe-api/v1'
    script.async = true
    document.body.appendChild(script)
  }, [])

  // Set up the global callback for when the API is ready
  useEffect(() => {
    if (window.SpotifyIframeApi && !apiReadyRef.current) {
      apiReadyRef.current = window.SpotifyIframeApi
    }
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      apiReadyRef.current = IFrameAPI
      window.SpotifyIframeApi = IFrameAPI
      if (pendingUriRef.current && embedElRef.current) {
        createPlayer(IFrameAPI, pendingUriRef.current)
        pendingUriRef.current = null
      }
    }
    return () => { window.onSpotifyIframeApiReady = undefined }
  }, [])

  const createPlayer = useCallback((IFrameAPI, playlistId) => {
    const element = embedElRef.current
    if (!element) return
    const options = {
      uri: `spotify:playlist:${playlistId}`,
      width: '100%',
      height: 352,
    }
    IFrameAPI.createController(element, options, (EmbedController) => {
      controllerRef.current = EmbedController
      currentPlIdRef.current = playlistId
      setPlayerReady(true)
      EmbedController.addListener('ready', () => {})
      let lastPosition = 0
      let lastTrackUri = null
      EmbedController.addListener('playback_update', (e) => {
        const data = e?.data || e
        const isPaused = data.isPaused
        const position = data.position ?? 0
        const duration = data.duration ?? 0

        // Track song plays — detect when a new track starts
        const trackUri = data.trackUri || data.track_uri || null
        const trackName = data.trackName || data.track_name || null
        const artistName = data.artistName || data.artist_name || null
        if (trackUri && trackUri !== lastTrackUri && !isPaused && position < 5000) {
          lastTrackUri = trackUri
          recordSongPlay(trackUri, trackName, artistName, currentPlIdRef.current)
        }

        if (!isPaused) {
          lastPosition = position
          wasPlayingRef.current = true
          setPlaylistEnded(false)
          if (endCheckTimerRef.current) {
            clearInterval(endCheckTimerRef.current)
            endCheckTimerRef.current = null
            if (!switchCountdownRef.current) {
              setSwitching(false)
              setSwitchCountdown(null)
            }
          }
        } else if (wasPlayingRef.current && isPaused) {
          const isNearEnd = duration > 0 && (duration - position) < 3000
          const isEndReset = position === 0 && lastPosition > 5000
          const isTrackDone = duration > 0 && position >= duration - 500

          if (isNearEnd || isEndReset || isTrackDone) {
            if (!endCheckTimerRef.current) {
              // Playlist ended — play alert sound & show alert banner
              playAlertSound()
              setPlaylistEnded(true)
              setSwitching(true)
              setSwitchCountdown(3)
              let count = 3
              endCheckTimerRef.current = setInterval(() => {
                count -= 1
                if (count > 0) {
                  setSwitchCountdown(count)
                } else {
                  clearInterval(endCheckTimerRef.current)
                  endCheckTimerRef.current = null
                  setSwitching(false)
                  setSwitchCountdown(null)
                  if (enabledRef.current) {
                    doSkipRef.current?.()
                  }
                }
              }, 1000)
            }
          }
        }
      })
    })
  }, [])

  const switchPlaylist = useCallback((playlistId) => {
    if (!playlistId) return
    setPlaylistEnded(false)
    if (controllerRef.current) {
      currentPlIdRef.current = playlistId
      controllerRef.current.loadUri(`spotify:playlist:${playlistId}`)
      setTimeout(() => {
        controllerRef.current?.play()
      }, 1000)
    } else if (apiReadyRef.current && embedElRef.current) {
      createPlayer(apiReadyRef.current, playlistId)
    } else {
      pendingUriRef.current = playlistId
    }
  }, [createPlayer])

  // Refresh status from localStorage
  const refreshStatus = useCallback(() => {
    const data = buildRotationStatus()
    setStatus(data)
    enabledRef.current = data.enabled
    modeRef.current = data.rotation_mode || 'playlist_end'
    return data
  }, [])

  const doSkip = useCallback(() => {
    if (skippingRef.current) return
    skippingRef.current = true
    wasPlayingRef.current = false
    setPlaylistEnded(false)
    if (endCheckTimerRef.current) {
      clearInterval(endCheckTimerRef.current)
      endCheckTimerRef.current = null
    }
    if (switchCountdownRef.current) {
      clearInterval(switchCountdownRef.current)
      switchCountdownRef.current = null
    }
    const result = skipToNext()
    if (result?.current_playlist?.playlist_id) {
      recordPlaylistPlay(result.current_playlist.playlist_id, result.current_playlist.name)
      currentPlIdRef.current = null
      switchPlaylist(result.current_playlist.playlist_id)
    }
    const data = refreshStatus()
    const settings = getSettings()
    if (settings.rotation_mode === 'interval') {
      const secs = (settings.interval_minutes || 1) * 60
      const target = Date.now() + secs * 1000
      targetTimeRef.current = target
      saveTimerTarget(target)
      setCountdown(secs)
    } else {
      setCountdown(null)
      targetTimeRef.current = null
      saveTimerTarget(null)
    }
    skippingRef.current = false
  }, [switchPlaylist, refreshStatus])

  // Keep doSkipRef in sync
  useEffect(() => { doSkipRef.current = doSkip }, [doSkip])

  // Restore timer on page load if rotation was active
  useEffect(() => {
    const data = refreshStatus()
    if (data.enabled && data.rotation_mode === 'interval') {
      const saved = getTimerTarget()
      if (saved) {
        targetTimeRef.current = saved
        const remaining = Math.max(0, Math.round((saved - Date.now()) / 1000))
        setCountdown(remaining)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Single timer: ticks every second, updates countdown, triggers skip at 0
  useEffect(() => {
    refreshStatus()
    timerRef.current = setInterval(() => {
      if (!targetTimeRef.current || !enabledRef.current) return
      const remaining = Math.max(0, Math.round((targetTimeRef.current - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining <= 0 && !switchCountdownRef.current) {
        targetTimeRef.current = null
        playAlertSound()
        setSwitching(true)
        setSwitchCountdown(3)
        let count = 3
        switchCountdownRef.current = setInterval(() => {
          count -= 1
          if (count > 0) {
            setSwitchCountdown(count)
          } else {
            clearInterval(switchCountdownRef.current)
            switchCountdownRef.current = null
            setSwitching(false)
            setSwitchCountdown(null)
            doSkipRef.current?.()
          }
        }, 1000)
      }
    }, 1000)
    return () => {
      clearInterval(timerRef.current)
      if (switchCountdownRef.current) {
        clearInterval(switchCountdownRef.current)
        switchCountdownRef.current = null
      }
    }
  }, [refreshStatus])

  // Initialize the Spotify player when rotation is enabled and we have a playlist
  useEffect(() => {
    if (!status?.enabled || !status?.current_playlist?.playlist_id) return
    const pid = status.current_playlist.playlist_id
    if (controllerRef.current && currentPlIdRef.current === pid) return
    if (controllerRef.current) {
      switchPlaylist(pid)
      return
    }
    if (apiReadyRef.current && embedElRef.current) {
      createPlayer(apiReadyRef.current, pid)
    } else {
      pendingUriRef.current = pid
    }
  }, [status?.enabled, status?.current_playlist?.playlist_id, createPlayer, switchPlaylist])

  const formatTime = (secs) => {
    if (secs == null) return '--:--'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setError('')
    setSuccessMsg('')
    setPlaylistEnded(false)
    const playlists = getPlaylists()
    if (playlists.length < 2) {
      setError('You need at least 2 playlists to start rotation.')
      return
    }
    const rotation = getRotationState()
    const settings = getSettings()
    saveRotationState({ ...rotation, enabled: true })
    const data = refreshStatus()
    if (data.current_playlist) {
      recordPlaylistPlay(data.current_playlist.playlist_id, data.current_playlist.name)
    }
    if (settings.rotation_mode === 'interval') {
      const secs = (settings.interval_minutes || 1) * 60
      const target = Date.now() + secs * 1000
      targetTimeRef.current = target
      saveTimerTarget(target)
      setCountdown(secs)
    }
    setSuccessMsg('Rotation started! Press play on the player below. Log in to Spotify in your browser for full songs.')
  }

  const handleStop = () => {
    setError('')
    setSuccessMsg('')
    wasPlayingRef.current = false
    setPlaylistEnded(false)
    setSwitching(false)
    setSwitchCountdown(null)
    if (switchCountdownRef.current) { clearInterval(switchCountdownRef.current); switchCountdownRef.current = null }
    if (endCheckTimerRef.current) { clearInterval(endCheckTimerRef.current); endCheckTimerRef.current = null }
    const rotation = getRotationState()
    saveRotationState({ ...rotation, enabled: false })
    setCountdown(null)
    targetTimeRef.current = null
    saveTimerTarget(null)
    enabledRef.current = false
    if (controllerRef.current) {
      controllerRef.current.pause()
    }
    refreshStatus()
  }

  const handleSkip = () => {
    setError('')
    setSuccessMsg('')
    wasPlayingRef.current = false
    setPlaylistEnded(false)
    setSwitching(false)
    setSwitchCountdown(null)
    if (switchCountdownRef.current) { clearInterval(switchCountdownRef.current); switchCountdownRef.current = null }
    if (endCheckTimerRef.current) { clearInterval(endCheckTimerRef.current); endCheckTimerRef.current = null }
    const result = skipToNext()
    if (!result) {
      setError('No playlists to skip to.')
      return
    }
    setSuccessMsg('Skipped!')
    if (result.current_playlist?.playlist_id) {
      recordPlaylistPlay(result.current_playlist.playlist_id, result.current_playlist.name)
      switchPlaylist(result.current_playlist.playlist_id)
    }
    const data = refreshStatus()
    const settings = getSettings()
    if (settings.rotation_mode === 'interval') {
      const secs = (settings.interval_minutes || 1) * 60
      const target = Date.now() + secs * 1000
      targetTimeRef.current = target
      saveTimerTarget(target)
      setCountdown(secs)
    } else {
      setCountdown(null)
      targetTimeRef.current = null
      saveTimerTarget(null)
    }
  }

  const handleOpenCurrent = () => {
    if (currentPl?.playlist_id) {
      openInSpotify(currentPl.playlist_id)
    }
  }

  const handleDismissAlert = () => {
    setPlaylistEnded(false)
  }

  const currentPl = status?.current_playlist
  const nextPl = status?.next_playlist

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Rotation</h1>
          <p className="text-gray-400">Press play once, AutoDJ handles the rest. Log in to Spotify for full songs.</p>
        </div>

        {successMsg && <p className="bg-green-900/30 border border-green-700 text-green-400 rounded-lg px-4 py-3 mb-4">{successMsg}</p>}
        {error && <p className="bg-red-900/30 border border-red-700 text-red-400 rounded-lg px-4 py-3 mb-4">{error}</p>}

        {/* Playlist Ended Alert */}
        {playlistEnded && !switching && (
          <div className="bg-orange-900/30 border border-orange-500 rounded-lg p-3 sm:p-4 mb-4 flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xl sm:text-2xl flex-shrink-0">&#128276;</span>
              <div className="min-w-0">
                <p className="text-orange-400 font-semibold text-sm sm:text-base">Playlist finished!</p>
                <p className="text-gray-400 text-xs sm:text-sm">AutoDJ is switching to the next one.</p>
              </div>
            </div>
            <button onClick={handleDismissAlert} className="text-gray-500 hover:text-white text-xl px-2 flex-shrink-0">&times;</button>
          </div>
        )}

        {/* Spotify Embed Player + Controls */}
        <div style={{ display: status?.enabled && currentPl ? 'block' : 'none' }} className="mb-6">
          {status?.enabled && currentPl && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0"></span>
                <span className="text-green-400 font-semibold truncate">Now Playing: {currentPl.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleOpenCurrent}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  Open in Spotify
                </button>
                <button
                  onClick={handleSkip}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  Skip &raquo;
                </button>
              </div>
            </div>
          )}
          <div className="rounded-xl overflow-hidden bg-gray-800 w-full" style={{ minHeight: 152 }}>
            <div ref={embedElRef} className="w-full [&>iframe]:!w-full [&>iframe]:!max-w-full"></div>
          </div>
          {status?.enabled && currentPl && (
            <p className="text-gray-500 text-xs mt-2 text-center">
              Logged into Spotify in your browser? You'll hear full songs above. Otherwise, tap "Open in Spotify" for the full experience.
            </p>
          )}
        </div>

        {/* Countdown Timer — interval mode only */}
        {status?.enabled && status?.rotation_mode === 'interval' && countdown != null && (
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 mb-6 text-center">
            <p className="text-gray-400 text-xs sm:text-sm mb-2">Next playlist switch in</p>
            <p className="text-3xl sm:text-5xl font-mono font-bold text-green-400">{formatTime(countdown)}</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">Every {status.interval_minutes} minutes</p>
          </div>
        )}
        {/* Playlist End mode — auto-detect indicator */}
        {status?.enabled && status?.rotation_mode === 'playlist_end' && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
              <p className="text-gray-300 text-sm">
                <span className="text-blue-400 font-medium">Auto-detect mode</span> — AutoDJ will switch to the next playlist when this one finishes. You'll hear an alert sound.
              </p>
            </div>
          </div>
        )}

        {/* Switching overlay */}
        {switching && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 mb-6 text-center">
            <p className="text-red-400 font-mono font-bold text-3xl mb-2">Switching in {switchCountdown ?? 0}...</p>
            <p className="text-gray-400 text-sm">Next playlist loading automatically</p>
          </div>
        )}

        {/* Next Up */}
        {status?.enabled && nextPl && !switching && (
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
              <div className="min-w-0">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Up Next</p>
                <h3 className="text-base sm:text-lg font-semibold truncate">{nextPl.name}</h3>
              </div>
              <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">
                {status?.rotation_mode === 'interval' ? 'Auto-switches when timer ends' : 'Auto-switches when playlist ends'}
              </span>
            </div>
          </div>
        )}

        {/* Rotation Queue */}
        {status?.enabled && status?.playlists?.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Rotation Queue ({status.total_playlists} playlists)</h2>
            <div className="space-y-2">
              {status.playlists.map((pl, i) => (
                <div
                  key={pl.id}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg gap-2 ${
                    i === status.current_playlist_index
                      ? 'bg-green-900/30 border border-green-700/50'
                      : 'bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-gray-500 text-xs sm:text-sm w-5 sm:w-6 text-right flex-shrink-0">{i + 1}</span>
                    <span className={`truncate text-sm sm:text-base ${i === status.current_playlist_index ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                      {pl.name}
                    </span>
                    {i === status.current_playlist_index && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">Now</span>
                    )}
                  </div>
                  <a
                    href={`https://open.spotify.com/playlist/${pl.playlist_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 text-xs flex-shrink-0"
                  >
                    Open
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Controls</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleStart}
              disabled={status && status.enabled}
              className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 sm:py-3 rounded-lg transition-colors text-base sm:text-lg"
            >
              Start Rotation
            </button>
            <button
              onClick={handleStop}
              disabled={status && !status.enabled}
              className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 sm:py-3 rounded-lg transition-colors text-base sm:text-lg"
            >
              Stop Rotation
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-3 text-center">
            {status?.enabled
              ? 'Press play once on the player above. AutoDJ will switch playlists and keep playing automatically.'
              : 'Press Start to begin. A Spotify player will appear — just hit play once.'}
          </p>
        </div>

        {/* Not started state */}
        {!status?.enabled && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 text-center">
            <h3 className="text-base sm:text-lg font-semibold mb-2">How it works</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <div className="p-3">
                <p className="text-2xl mb-2">1</p>
                <p>Hit <span className="text-green-400">Start Rotation</span></p>
              </div>
              <div className="p-3">
                <p className="text-2xl mb-2">2</p>
                <p>Press <span className="text-green-400">play once</span> on the Spotify player</p>
              </div>
              <div className="p-3">
                <p className="text-2xl mb-2">3</p>
                <p>AutoDJ <span className="text-green-400">auto-switches & plays</span> on schedule</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
              <p className="text-green-400 text-sm">Log in to Spotify in your browser for full songs that count as real streams</p>
            </div>
          </div>
        )}
      </div>
  )
}
