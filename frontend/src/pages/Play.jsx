import { useState } from 'react'
import { getActivePlaylists, getCategories, PLATFORM_META } from '../services/storage'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'

export default function Play() {
  const playlists = getActivePlaylists()
  const categories = getCategories()
  const { currentPl, queue, selectedIndex, playPlaylist, playNext, playPrev } = usePlayer()
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = (activeCategory === 'All'
    ? playlists
    : playlists.filter(p => p.category === activeCategory)
  ).filter(p => !p.archived)

  const handleSelect = (pl, idx) => {
    playPlaylist(pl, filtered, idx)
  }

  const handlePrev = () => {
    if (queue.length && queue === filtered) {
      playPrev()
    } else {
      const cur = filtered.findIndex(p => p.id === currentPl?.id)
      const prev = cur <= 0 ? filtered.length - 1 : cur - 1
      playPlaylist(filtered[prev], filtered, prev)
    }
  }

  const handleNext = () => {
    if (queue.length && queue === filtered) {
      playNext()
    } else {
      const cur = filtered.findIndex(p => p.id === currentPl?.id)
      const next = cur === -1 || cur === filtered.length - 1 ? 0 : cur + 1
      playPlaylist(filtered[next], filtered, next)
    }
  }

  if (playlists.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Player</h1>
          <p className="text-gray-400">Pick a playlist and open it in the player below.</p>
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
  const activeIdx = filtered.findIndex(p => p.id === currentPl?.id)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6" style={{ paddingBottom: currentPl ? 432 : 24 }}>
      <div className="mb-5">
        <h1 className="text-3xl font-bold mb-1">Player</h1>
        <p className="text-gray-400">Select a playlist to load it in the player. You can browse other pages while it plays.</p>
      </div>

      {categoriesInUse.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {['All', ...categoriesInUse].map(cat => (
            <button key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeCategory === cat ? 'bg-green-600 border-green-600 text-white' : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Now playing bar */}
      {currentPl && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 px-4 py-3 flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Now Playing</p>
            <p className="text-white font-semibold truncate">{currentPl.name}</p>
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
                <span className="hidden sm:inline">Open in {meta.label}</span>
                <span className="sm:hidden">{meta.label}</span>
              </a>
            )
          })()}
        </div>
      )}

      {/* Playlist list */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-300">
            {activeCategory === 'All' ? 'All Playlists' : activeCategory}
            <span className="text-gray-500 font-normal ml-1.5">({filtered.length})</span>
          </p>
        </div>
        <div className="divide-y divide-gray-700/50 max-h-[50vh] overflow-y-auto">
          {filtered.map((pl, i) => {
            const isActive = pl.id === currentPl?.id
            const meta = PLATFORM_META[pl.platform || 'spotify'] || PLATFORM_META.spotify
            return (
              <button key={pl.id} onClick={() => handleSelect(pl, i)}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                  isActive ? 'bg-green-900/30 border-l-2 border-green-500' : 'hover:bg-gray-700/40 border-l-2 border-transparent'
                }`}>
                <span className="text-base flex-shrink-0">{meta.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-white'}`}>{pl.name}</p>
                  {pl.category && <p className="text-gray-500 text-xs truncate mt-0.5">{pl.category}</p>}
                </div>
                {isActive && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Prev / Next */}
      {filtered.length > 1 && (
        <div className="flex items-center gap-3">
          <button onClick={handlePrev}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Previous
          </button>
          <span className="text-gray-500 text-xs flex-shrink-0">
            {activeIdx >= 0 ? `${activeIdx + 1} / ${filtered.length}` : `— / ${filtered.length}`}
          </span>
          <button onClick={handleNext}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {!currentPl && (
        <p className="text-gray-500 text-xs text-center mt-3">Tap a playlist above to start playing.</p>
      )}
    </div>
  )
}
