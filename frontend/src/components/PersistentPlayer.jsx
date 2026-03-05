import { useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { getEmbedUrl, PLATFORM_META, recordSongPlay } from '../services/storage'

export default function PersistentPlayer() {
  const { currentPl, queue, selectedIndex, playNext, playPrev, stop } = usePlayer()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isOnPlayPage = pathname === '/play'

  const embedElRef = useRef(null)
  const controllerRef = useRef(null)
  const apiReadyRef = useRef(null)
  const pendingUriRef = useRef(null)
  const currentPlIdRef = useRef(null)

  const isSpotify = !currentPl?.platform || currentPl?.platform === 'spotify'

  useEffect(() => {
    if (document.getElementById('spotify-iframe-api')) return
    const script = document.createElement('script')
    script.id = 'spotify-iframe-api'
    script.src = 'https://open.spotify.com/embed/iframe-api/v1'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const createPlayer = useCallback((IFrameAPI, spotifyUri) => {
    const element = embedElRef.current
    if (!element) return
    const options = { uri: spotifyUri, width: '100%', height: 352 }
    IFrameAPI.createController(element, options, (EmbedController) => {
      controllerRef.current = EmbedController
      currentPlIdRef.current = spotifyUri
      let lastTrackUri = null
      EmbedController.addListener('playback_update', (e) => {
        const data = e?.data || e
        const trackUri = data.trackUri || data.track_uri || null
        const trackName = data.trackName || data.track_name || null
        const artistName = data.artistName || data.artist_name || null
        const position = data.position ?? 0
        if (trackUri && trackUri !== lastTrackUri && !data.isPaused && position < 5000) {
          lastTrackUri = trackUri
          recordSongPlay(trackUri, trackName, artistName, currentPlIdRef.current)
        }
      })
    })
  }, [])

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
  }, [createPlayer])

  useEffect(() => {
    if (!currentPl || !isSpotify) return
    const pid = currentPl.playlist_id
    const kind = currentPl.type === 'album' ? 'album' : 'playlist'
    const uri = `spotify:${kind}:${pid}`
    if (currentPlIdRef.current === uri) return
    if (controllerRef.current) {
      currentPlIdRef.current = uri
      controllerRef.current.loadUri(uri)
    } else if (apiReadyRef.current && embedElRef.current) {
      createPlayer(apiReadyRef.current, uri)
    } else {
      pendingUriRef.current = uri
    }
  }, [currentPl?.playlist_id, currentPl?.type, isSpotify, createPlayer])

  if (!currentPl) return null

  const meta = PLATFORM_META[currentPl.platform || 'spotify'] || PLATFORM_META.spotify
  const embedUrl = !isSpotify ? getEmbedUrl(currentPl) : null

  return (
    <>
      {/* Embed container — always in DOM so audio keeps playing.
          On /play: visible above the mini bar.
          Elsewhere: pushed below the viewport (top: 100vh) so audio never stops. */}
      <div
        className="fixed left-0 lg:left-64 right-0 z-40 bg-gray-800 border-t border-gray-700"
        style={
          isOnPlayPage
            ? { bottom: 56, height: 352 }
            : { top: '100vh', height: 352 }
        }
      >
        {isSpotify ? (
          <div ref={embedElRef} className="w-full h-full [&>iframe]:!w-full [&>iframe]:!max-w-full" />
        ) : embedUrl ? (
          <iframe
            key={currentPl.id}
            src={embedUrl}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="border-0 block w-full h-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <span className="text-4xl mb-3">{meta.icon}</span>
            <p className="text-gray-400 text-sm mb-3">Embed not available for {meta.label}</p>
            <a href={currentPl.url || '#'} target="_blank" rel="noopener noreferrer"
              className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
              Open in {meta.label}
            </a>
          </div>
        )}
      </div>

      {/* Mini bar — always visible at bottom when something is playing */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            <span className="text-lg flex-shrink-0">{meta.icon}</span>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight">{currentPl.name}</p>
              <p className="text-gray-500 text-xs">{meta.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {queue.length > 1 && (
              <>
                <button onClick={playPrev} className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors" title="Previous">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <span className="text-gray-600 text-xs">{selectedIndex + 1}/{queue.length}</span>
                <button onClick={playNext} className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors" title="Next">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
            {!isOnPlayPage && (
              <button onClick={() => navigate('/play')}
                className="text-xs text-green-400 hover:text-green-300 px-2.5 py-1.5 rounded-lg border border-green-700/50 transition-colors ml-1">
                Player
              </button>
            )}
            <button onClick={stop} className="text-gray-600 hover:text-red-400 p-2 rounded-lg transition-colors ml-1" title="Stop">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
