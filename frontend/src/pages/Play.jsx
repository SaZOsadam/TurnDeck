import { useState, useEffect, useRef, useCallback } from 'react'
import { getActivePlaylists, recordSongPlay, getCategories, getEmbedUrl, PLATFORM_META } from '../services/storage'
import { Link } from 'react-router-dom'

export default function Play() {
  const playlists = getActivePlaylists()
  const categories = getCategories()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [playerReady, setPlayerReady] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')

  const controllerRef = useRef(null)
  const embedElRef = useRef(null)
  const apiReadyRef = useRef(false)
  const pendingUriRef = useRef(null)
  const currentPlIdRef = useRef(null)

  const filtered = (activeCategory === 'All'
    ? playlists
    : playlists.filter(p => p.category === activeCategory)
  ).filter(p => !p.archived)

  const currentPl = filtered[selectedIndex] || null

  // Load Spotify IFrame API script once
  useEffect(() => {
    if (document.getElementById('spotify-iframe-api')) return
    const script = document.createElement('script')
    script.id = 'spotify-iframe-api'
    script.src = 'https://open.spotify.com/embed/iframe-api/v1'
    script.async = true
    document.body.appendChild(script)
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

  // Load the current playlist into the player (Spotify only)
  useEffect(() => {
    if (!currentPl || (currentPl.platform && currentPl.platform !== 'spotify')) return
    const pid = currentPl.playlist_id
    if (controllerRef.current) {
      currentPlIdRef.current = pid
      controllerRef.current.loadUri(`spotify:playlist:${pid}`)
    } else if (apiReadyRef.current && embedElRef.current) {
      createPlayer(apiReadyRef.current, pid)
    } else {
      pendingUriRef.current = pid
    }
  }, [currentPl?.playlist_id, currentPl?.platform, createPlayer])

  const handleSelect = (index) => {
    setSelectedIndex(index)
    setPlayerReady(false)
  }

  const handlePrev = () => {
    setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length)
    setPlayerReady(false)
  }

  const handleNext = () => {
    setSelectedIndex(i => (i + 1) % filtered.length)
    setPlayerReady(false)
  }

  if (playlists.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Player</h1>
          <p className="text-gray-400">Pick a playlist and open it in the Spotify embed.</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-10 text-center">
          <p className="text-gray-400 mb-4">No playlists bookmarked yet.</p>
          <Link to="/playlists" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            + Bookmark a Playlist
          </Link>
        </div>
      </div>
    )
  }

  const categoriesInUse = categories.filter(cat => playlists.some(p => p.category === cat))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-5">
        <h1 className="text-3xl font-bold mb-1">Player</h1>
        <p className="text-gray-400">Pick a playlist and press play. Log in to Spotify in your browser for full songs.</p>
      </div>

      {/* Category filter */}
      {categoriesInUse.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {['All', ...categoriesInUse].map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSelectedIndex(0); setPlayerReady(false) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeCategory === cat
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Playlist list */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-sm font-semibold text-gray-300">
              {activeCategory === 'All' ? 'All Playlists' : activeCategory}
              <span className="text-gray-500 font-normal ml-1.5">({filtered.length})</span>
            </p>
          </div>
          <div className="divide-y divide-gray-700/50 max-h-[400px] overflow-y-auto">
            {filtered.map((pl, i) => (
              <button
                key={pl.id}
                onClick={() => handleSelect(i)}
                className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 ${
                  i === selectedIndex
                    ? 'bg-green-900/30 border-l-2 border-green-500'
                    : 'hover:bg-gray-700/40 border-l-2 border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${i === selectedIndex ? 'text-green-400' : 'text-white'}`}>
                    {pl.name}
                  </p>
                  {pl.category && (
                    <p className="text-gray-500 text-xs truncate mt-0.5">{pl.category}</p>
                  )}
                  {pl.notes && (
                    <p className="text-gray-600 text-xs truncate mt-0.5">{pl.notes}</p>
                  )}
                </div>
                {i === selectedIndex && (
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Player panel */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {currentPl && (
            <>
              {/* Now playing header */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Now Playing</p>
                  <p className="text-white font-semibold truncate">{currentPl.name}</p>
                  {currentPl.notes && <p className="text-gray-500 text-xs truncate mt-0.5">{currentPl.notes}</p>}
                </div>
                {(() => {
                  const meta = PLATFORM_META[currentPl.platform || 'spotify'] || PLATFORM_META.spotify
                  const openUrl = currentPl.platform === 'spotify' || !currentPl.platform
                    ? `https://open.spotify.com/playlist/${currentPl.playlist_id}`
                    : (currentPl.url || '#')
                  return (
                    <a href={openUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: meta.color }}>
                      <span>{meta.icon}</span>
                      Open in {meta.label}
                    </a>
                  )
                })()}
              </div>

              {/* Embed */}
              <div className="rounded-xl overflow-hidden bg-gray-800 border border-gray-700 w-full" style={{ minHeight: 152 }}>
                {(!currentPl.platform || currentPl.platform === 'spotify') ? (
                  <div ref={embedElRef} className="w-full [&>iframe]:!w-full [&>iframe]:!max-w-full"></div>
                ) : getEmbedUrl(currentPl) ? (
                  <iframe
                    key={currentPl.id}
                    src={getEmbedUrl(currentPl)}
                    width="100%"
                    height="352"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="border-0"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                    <span className="text-4xl mb-3">{PLATFORM_META[currentPl.platform]?.icon}</span>
                    <p className="text-gray-400 text-sm mb-3">Embed not available for {PLATFORM_META[currentPl.platform]?.label}</p>
                    <a href={currentPl.url || '#'} target="_blank" rel="noopener noreferrer"
                      className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                      Open in {PLATFORM_META[currentPl.platform]?.label}
                    </a>
                  </div>
                )}
              </div>

              {/* Prev / Next */}
              {filtered.length > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrev}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Previous
                  </button>
                  <span className="text-gray-500 text-xs flex-shrink-0">{selectedIndex + 1} / {filtered.length}</span>
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-gray-600 text-xs text-center">
                Logged into Spotify in your browser? You'll hear full songs. Otherwise, tap "Open in Spotify".
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
