import { useState } from 'react'
import { getTopSongs, getTopPlaylists, getStats, clearStats, DAILY_STREAM_LIMITS, todayKey, PLATFORM_META, getChartEntries, addChartEntry, logChartPosition, removeChartEntry } from '../services/storage'

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

const CHART_LINKS = {
  spotify:      (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`,
  apple_music:  (q) => `https://music.apple.com/search?term=${encodeURIComponent(q)}`,
  youtube_music:(q) => `https://music.youtube.com/search?q=${encodeURIComponent(q)}`,
  youtube:      (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  tidal:        (q) => `https://tidal.com/search?q=${encodeURIComponent(q)}`,
  pandora:      (q) => `https://www.pandora.com/search/${encodeURIComponent(q)}/all`,
  amazon_music: (q) => `https://music.amazon.com/search/${encodeURIComponent(q)}`,
  deezer:       (q) => `https://www.deezer.com/search/${encodeURIComponent(q)}`,
  qobuz:        (q) => `https://www.qobuz.com/search?q=${encodeURIComponent(q)}`,
  facebook_mv:  (q) => `https://www.facebook.com/search/videos?q=${encodeURIComponent(q)}`,
}

export default function Stats() {
  const [topSongs, setTopSongs] = useState(() => getTopSongs(50))
  const [topPlaylists, setTopPlaylists] = useState(() => getTopPlaylists(50))
  const [chartEntries, setChartEntries] = useState(() => getChartEntries())
  const [tab, setTab] = useState('songs')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [showChartRef, setShowChartRef] = useState(false)
  const [addForm, setAddForm] = useState({ song: '', artist: '', type: 'song', platform: 'spotify' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [logModal, setLogModal] = useState(null)
  const [logPosition, setLogPosition] = useState('')
  const [logNote, setLogNote] = useState('')
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

  const handleAddChart = (e) => {
    e.preventDefault()
    if (!addForm.song.trim()) return
    addChartEntry(addForm)
    setChartEntries(getChartEntries())
    setAddForm({ song: '', artist: '', type: 'song', platform: 'spotify' })
    setShowAddForm(false)
  }

  const handleLogPosition = () => {
    if (!logPosition || isNaN(logPosition) || Number(logPosition) < 1) return
    logChartPosition(logModal.id, logPosition, logNote)
    setChartEntries(getChartEntries())
    setLogModal(null)
    setLogPosition('')
    setLogNote('')
  }

  const handleRemoveChart = (id) => {
    removeChartEntry(id)
    setChartEntries(getChartEntries())
  }

  const getMovement = (entry) => {
    if (entry.positions.length < 2) return null
    const curr = entry.positions[0].position
    const prev = entry.positions[1].position
    const diff = prev - curr
    if (diff > 0) return { dir: 'up', diff, color: 'text-green-400' }
    if (diff < 0) return { dir: 'down', diff: Math.abs(diff), color: 'text-red-400' }
    return { dir: 'same', diff: 0, color: 'text-gray-400' }
  }

  const formatDate = (iso) => {
    if (!iso) return 'Never'
    const d = new Date(iso)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
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
          <button onClick={() => setTab('songs')}
            className={`flex-1 py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              tab === 'songs' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'
            }`}>Top Songs</button>
          <button onClick={() => setTab('playlists')}
            className={`flex-1 py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              tab === 'playlists' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'
            }`}>Top Playlists</button>
          <button onClick={() => setTab('tracker')}
            className={`flex-1 py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              tab === 'tracker' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'
            }`}>Chart Tracker {chartEntries.length > 0 && <span className="ml-1 opacity-60">{chartEntries.length}</span>}</button>
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

        {/* Chart Tracker */}
        {tab === 'tracker' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Track a song, album, or artist across any chart platform. Log positions manually to see trends over time.</p>
              <button onClick={() => setShowAddForm(v => !v)}
                className="flex-shrink-0 ml-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                + Track
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddChart} className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
                <p className="text-sm font-semibold text-white">Add to Chart Tracker</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Song / Album / Artist name</label>
                    <input type="text" value={addForm.song} onChange={e => setAddForm({ ...addForm, song: e.target.value })}
                      placeholder="e.g. Dynamite" required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Artist (optional)</label>
                    <input type="text" value={addForm.artist} onChange={e => setAddForm({ ...addForm, artist: e.target.value })}
                      placeholder="e.g. BTS"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Type</label>
                    <select value={addForm.type} onChange={e => setAddForm({ ...addForm, type: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500">
                      <option value="song">Song / Track</option>
                      <option value="album">Album</option>
                      <option value="artist">Artist</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Platform</label>
                    <select value={addForm.platform} onChange={e => setAddForm({ ...addForm, platform: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500">
                      {CHART_PLATFORMS.map(p => (
                        <option key={p.key} value={p.key}>{p.icon} {p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Add</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">Cancel</button>
                </div>
              </form>
            )}

            {chartEntries.length === 0 && !showAddForm && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
                <p className="text-gray-400 mb-1">No entries tracked yet</p>
                <p className="text-gray-500 text-sm">Add a song or artist above and log its chart position each day to track movement.</p>
              </div>
            )}

            {chartEntries.map(entry => {
              const meta = PLATFORM_META[entry.platform] || PLATFORM_META.spotify
              const current = entry.positions[0]
              const movement = getMovement(entry)
              const searchQuery = entry.artist ? `${entry.artist} ${entry.song}` : entry.song
              const searchUrl = CHART_LINKS[entry.platform]?.(searchQuery) || '#'
              return (
                <div key={entry.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0 mt-0.5">{meta.icon}</span>
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{entry.song}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {entry.artist && <p className="text-gray-400 text-xs">{entry.artist}</p>}
                          <span className="text-xs px-1.5 py-0.5 rounded-full capitalize" style={{ color: meta.color, backgroundColor: meta.color + '20' }}>
                            {meta.label}
                          </span>
                          <span className="text-xs text-gray-600 capitalize">{entry.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {current && (
                        <div className="text-right">
                          <p className="text-white font-bold text-lg leading-none">#{current.position}</p>
                          {movement && (
                            <p className={`text-xs font-medium ${movement.color}`}>
                              {movement.dir === 'up' && `▲ ${movement.diff}`}
                              {movement.dir === 'down' && `▼ ${movement.diff}`}
                              {movement.dir === 'same' && '— same'}
                            </p>
                          )}
                          {!movement && <p className="text-gray-600 text-xs">new</p>}
                        </div>
                      )}
                      {!current && <p className="text-gray-500 text-xs">No position yet</p>}
                    </div>
                  </div>

                  {entry.positions.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {entry.positions.slice(0, 14).map((p, i) => (
                        <div key={i} className={`text-center px-2 py-1 rounded-lg text-xs ${
                          i === 0 ? 'bg-purple-600/30 border border-purple-500/40' : 'bg-gray-700/60'
                        }`}>
                          <p className="font-semibold text-white">#{p.position}</p>
                          <p className="text-gray-500" style={{ fontSize: 10 }}>{p.date.slice(5)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => { setLogModal(entry); setLogPosition(current?.position || ''); setLogNote('') }}
                      className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border border-purple-500/30">
                      Log Position
                    </button>
                    <a href={searchUrl} target="_blank" rel="noopener noreferrer"
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                      Search on {meta.label}
                    </a>
                    <button onClick={() => handleRemoveChart(entry.id)}
                      className="text-gray-600 hover:text-red-400 text-xs px-2 py-1.5 rounded-lg transition-colors ml-auto">
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
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

      {/* Log Position Modal */}
      {logModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setLogModal(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-1">Log Chart Position</h3>
            <p className="text-gray-400 text-xs mb-4">
              {logModal.song}{logModal.artist ? ` — ${logModal.artist}` : ''} &middot; {PLATFORM_META[logModal.platform]?.label}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Chart Position (e.g. 5 = #5)</label>
                <input
                  type="number" min="1" max="200"
                  value={logPosition}
                  onChange={e => setLogPosition(e.target.value)}
                  placeholder="e.g. 12"
                  autoFocus
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Note (optional)</label>
                <input
                  type="text"
                  value={logNote}
                  onChange={e => setLogNote(e.target.value)}
                  placeholder="e.g. Peak position, after streaming party"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleLogPosition}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                Save
              </button>
              <button onClick={() => setLogModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
