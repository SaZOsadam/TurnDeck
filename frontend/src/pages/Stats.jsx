import { useState } from 'react'
import { getTopSongs, getTopPlaylists, getStats, clearStats, DAILY_STREAM_LIMITS, todayKey, PLATFORM_META } from '../services/storage'

const CHART_PLATFORMS = [
  { key: 'spotify',      label: 'Spotify',       icon: '🎵', note: null },
  { key: 'apple_music', label: 'Apple Music',    icon: '🍎', note: null },
  { key: 'pandora',     label: 'Pandora',        icon: '🎧', note: 'US/PR only' },
  { key: 'youtube_music', label: 'YouTube Music',icon: '▶️', note: null },
  { key: 'youtube',     label: 'YouTube',        icon: '▶️', note: null },
  { key: 'facebook_mv', label: 'Facebook MV',    icon: '📘', note: 'US/PR only' },
  { key: 'amazon_music',label: 'Amazon Music',   icon: '📦', note: null },
  { key: 'deezer',      label: 'Deezer',         icon: '🎶', note: null },
  { key: 'qobuz',       label: 'Qobuz',          icon: '🎼', note: null },
  { key: 'tidal',       label: 'Tidal',          icon: '🌊', note: null },
]

export default function Stats() {
  const [topSongs, setTopSongs] = useState(() => getTopSongs(50))
  const [topPlaylists, setTopPlaylists] = useState(() => getTopPlaylists(50))
  const [tab, setTab] = useState('songs')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [showChartRef, setShowChartRef] = useState(false)
  const stats = getStats()
  const totalSongPlays = Object.values(stats.songs).reduce((sum, s) => sum + s.count, 0)
  const totalPlaylistPlays = Object.values(stats.playlists).reduce((sum, p) => sum + p.count, 0)

  const today = todayKey()

  const getStreamStatus = (song) => {
    const platform = song.platform || 'spotify'
    const limits = DAILY_STREAM_LIMITS[platform] || DAILY_STREAM_LIMITS.spotify
    const count = (song.dailyCounts || {})[today] || 0
    if (count >= limits.limit) return { status: 'over', count, limit: limits.limit, color: 'text-red-400', bg: 'border-red-500/40' }
    if (count >= limits.warn) return { status: 'warn', count, limit: limits.limit, color: 'text-yellow-400', bg: 'border-yellow-500/40' }
    return { status: 'ok', count, limit: limits.limit, color: 'text-green-400', bg: '' }
  }

  const filteredSongs = platformFilter === 'all'
    ? topSongs
    : topSongs.filter(s => (s.platform || 'spotify') === platformFilter)

  const handleClear = () => {
    if (window.confirm('Clear all play stats? This cannot be undone.')) {
      clearStats()
      setTopSongs([])
      setTopPlaylists([])
    }
  }

  const formatDate = (iso) => {
    if (!iso) return 'Never'
    const d = new Date(iso)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Play Stats</h1>
            <p className="text-gray-400 text-sm sm:text-base">Track plays across chart-eligible platforms.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0 self-start sm:self-auto">
            <button onClick={() => setShowChartRef(v => !v)}
              className="text-gray-400 hover:text-white text-sm px-3 py-2 rounded border border-gray-600 hover:bg-gray-700 transition-colors">
              {showChartRef ? 'Hide' : 'Chart Platforms'}
            </button>
            <button onClick={handleClear}
              className="text-red-400 hover:text-red-300 text-sm px-3 py-2 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors">
              Clear
            </button>
          </div>
        </div>

        {/* Chart Platform Reference */}
        {showChartRef && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Chart-Eligible Streaming Platforms</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHART_PLATFORMS.map(p => {
                const limits = DAILY_STREAM_LIMITS[p.key] || DAILY_STREAM_LIMITS.spotify
                return (
                  <div key={p.key} className="flex items-center justify-between bg-gray-700/40 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.icon}</span>
                      <div>
                        <p className="text-white text-xs font-medium">{p.label}</p>
                        {p.note && <p className="text-yellow-400 text-xs">{p.note}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">limit <span className="text-white font-mono">{limits.limit}</span>/day</p>
                      <p className="text-gray-500 text-xs">warn at {limits.warn}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-gray-600 text-xs mt-3">Daily limits are conservative estimates. Streams above the limit may not count toward chart calculations.</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-400">{totalSongPlays}</p>
            <p className="text-gray-400 text-xs mt-1">Total Song Plays</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-400">{totalPlaylistPlays}</p>
            <p className="text-gray-400 text-xs mt-1">Total Playlist Plays</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 text-center">
            <p className="text-xl sm:text-2xl font-bold text-purple-400">{Object.keys(stats.songs).length}</p>
            <p className="text-gray-400 text-xs mt-1">Unique Songs</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 text-center">
            <p className="text-xl sm:text-2xl font-bold text-yellow-400">{Object.keys(stats.playlists).length}</p>
            <p className="text-gray-400 text-xs mt-1">Unique Playlists</p>
          </div>
        </div>

        {/* Platform filter */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          <button onClick={() => setPlatformFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              platformFilter === 'all' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-600 text-gray-400 hover:text-white'
            }`}>All</button>
          {CHART_PLATFORMS.filter(p => topSongs.some(s => (s.platform || 'spotify') === p.key)).map(p => (
            <button key={p.key} onClick={() => setPlatformFilter(p.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                platformFilter === p.key ? 'bg-green-600 border-green-600 text-white' : 'border-gray-600 text-gray-400 hover:text-white'
              }`}>{p.icon} {p.label}</button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setTab('songs')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tab === 'songs' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Top Songs
          </button>
          <button
            onClick={() => setTab('playlists')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tab === 'playlists' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Top Playlists
          </button>
        </div>

        {/* Song List */}
        {tab === 'songs' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            {filteredSongs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-base mb-1">{topSongs.length === 0 ? 'No song data yet' : 'No songs for this platform'}</p>
                <p className="text-sm">{topSongs.length === 0 ? 'Play some music to see stats here.' : 'Try a different platform filter.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredSongs.map((song, i) => {
                  const stream = getStreamStatus(song)
                  const meta = PLATFORM_META[song.platform || 'spotify'] || PLATFORM_META.spotify
                  return (
                    <div key={song.uri} className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 hover:bg-gray-700/50 transition-colors ${stream.status !== 'ok' ? 'border-l-2 ' + stream.bg : ''}`}>
                      <span className={`w-6 sm:w-8 text-right text-xs sm:text-sm font-mono flex-shrink-0 ${
                        i < 3 ? 'text-yellow-400 font-bold' : 'text-gray-500'
                      }`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate text-sm sm:text-base">{song.name || 'Unknown Track'}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <p className="text-gray-400 text-xs truncate">{song.artist || 'Unknown Artist'}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ color: meta.color, backgroundColor: meta.color + '20' }}>
                            {meta.icon} {meta.label}
                            {meta.chartNote && <span className="text-yellow-400 ml-1">({meta.chartNote})</span>}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <p className="text-green-400 font-semibold text-sm">{song.count}x</p>
                        {stream.count > 0 && (
                          <p className={`text-xs font-medium ${stream.color}`}>
                            {stream.count}/{stream.limit} today
                            {stream.status === 'over' && ' 🔴'}
                            {stream.status === 'warn' && ' 🟡'}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs hidden sm:block">{formatDate(song.lastPlayed)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Playlist List */}
        {tab === 'playlists' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            {topPlaylists.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-1">No playlist data yet</p>
                <p className="text-sm">Start a rotation to see playlist play counts here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {topPlaylists.map((pl, i) => (
                  <div key={pl.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 hover:bg-gray-700/50 transition-colors">
                    <span className={`w-6 sm:w-8 text-right text-xs sm:text-sm font-mono flex-shrink-0 ${
                      i < 3 ? 'text-yellow-400 font-bold' : 'text-gray-500'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate text-sm sm:text-base">{pl.name || 'Unknown Playlist'}</p>
                      <a
                        href={`https://open.spotify.com/playlist/${pl.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 text-xs hover:underline"
                      >
                        Open in Spotify
                      </a>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-blue-400 font-semibold text-sm">{pl.count}x</p>
                      <p className="text-gray-500 text-xs hidden sm:block">{formatDate(pl.lastPlayed)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
  )
}
