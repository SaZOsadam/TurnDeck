import { useState } from 'react'
import { getPlaylists, getStats, getTopSongs, getTopPlaylists, getActivityLog, clearActivityLog, PLATFORM_META, DAILY_STREAM_LIMITS, todayKey } from '../services/storage'

const ACTIVITY_ICONS = {
  add: '➕', edit: '✏️', archive: '📦', restore: '♻️',
  play: '▶️', account: '🔗', delete: '🗑️',
}

export default function Admin() {
  const [tab, setTab] = useState('activity')
  const [activityLog, setActivityLog] = useState(() => getActivityLog())
  const playlists = getPlaylists()
  const stats = getStats()
  const topSongs = getTopSongs(10)
  const topPlaylists = getTopPlaylists(10)
  const totalSongPlays = Object.values(stats.songs).reduce((sum, s) => sum + s.count, 0)
  const totalPlaylistPlays = Object.values(stats.playlists).reduce((sum, p) => sum + p.count, 0)
  const uniqueTracks = Object.keys(stats.songs).length

  const today = todayKey()
  const songsAtLimit = Object.entries(stats.songs).filter(([, s]) => {
    const platform = s.platform || 'spotify'
    const limit = (DAILY_STREAM_LIMITS[platform] || DAILY_STREAM_LIMITS.spotify).limit
    return ((s.dailyCounts || {})[today] || 0) >= limit
  })

  const tabs = [
    { id: 'activity', label: 'Activity Log' },
    { id: 'analytics', label: 'User Analytics' },
    { id: 'playlists', label: 'Playlists' },
    { id: 'recommendations', label: 'Recommendations' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-2">
        <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2 py-1 rounded">ADMIN</span>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>
      <p className="text-gray-400 mb-6">Manage playlists, recommendations, and monitor user activity.</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 sm:px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Default Playlists Tab */}
      {tab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Default Playlists ({playlists.length})</h2>
            <button disabled className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg opacity-60 cursor-not-allowed">
              + Add Default Playlist
            </button>
          </div>
          {/* Mobile: card layout */}
          <div className="sm:hidden space-y-3">
            {playlists.map((pl, i) => (
              <div key={pl.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{pl.name}</p>
                    <p className="text-gray-500 font-mono text-xs truncate mt-1">{pl.playlist_id}</p>
                  </div>
                  <span className="text-gray-500 text-xs flex-shrink-0">#{i + 1}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${pl.source === 'default' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600 text-gray-300'}`}>
                    {pl.source || 'user'}
                  </span>
                  <div className="flex gap-3">
                    <button disabled className="text-gray-500 text-xs cursor-not-allowed">Edit</button>
                    <button disabled className="text-gray-500 text-xs cursor-not-allowed">Remove</button>
                  </div>
                </div>
              </div>
            ))}
            {playlists.length === 0 && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-500">No playlists found</div>
            )}
          </div>
          {/* Desktop: table layout */}
          <div className="hidden sm:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-left">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Playlist ID</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {playlists.map((pl, i) => (
                  <tr key={pl.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{pl.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{pl.playlist_id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${pl.source === 'default' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600 text-gray-300'}`}>
                        {pl.source || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button disabled className="text-gray-500 hover:text-white text-xs mr-3 cursor-not-allowed">Edit</button>
                      <button disabled className="text-gray-500 hover:text-red-400 text-xs cursor-not-allowed">Remove</button>
                    </td>
                  </tr>
                ))}
                {playlists.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No playlists found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {tab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Special Recommendation Playlists</h2>
            <button disabled className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg opacity-60 cursor-not-allowed">
              + Add Recommendation
            </button>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Curated Recommendations</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
              Add special playlists that you recommend to all users. These will appear as featured playlists in the app.
            </p>
            <p className="text-yellow-400 text-sm">Not set up yet.</p>
          </div>
        </div>
      )}

      {/* Activity Log Tab */}
      {tab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Activity</h2>
            <button onClick={() => { clearActivityLog(); setActivityLog([]) }}
              className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">
              Clear Log
            </button>
          </div>

          {songsAtLimit.length > 0 && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
              <p className="text-red-400 font-semibold text-sm mb-2">⚠️ Daily Stream Limit Reached</p>
              <p className="text-red-300/70 text-xs mb-3">These tracks have hit the estimated chart-filter threshold today. Further streams may not count toward charts.</p>
              <div className="space-y-1">
                {songsAtLimit.map(([uri, s]) => (
                  <div key={uri} className="flex items-center justify-between text-sm">
                    <span className="text-white truncate">{s.name || uri}</span>
                    <span className="text-red-400 font-mono ml-2 flex-shrink-0">{((s.dailyCounts || {})[today] || 0)} today</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded-xl border border-gray-700">
            {activityLog.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No activity recorded yet</div>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {activityLog.map(entry => (
                  <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">{ACTIVITY_ICONS[entry.type] || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">{entry.description}</p>
                      {entry.metadata?.platform && (
                        <span className="text-xs text-gray-500">{PLATFORM_META[entry.metadata.platform]?.label || entry.metadata.platform}</span>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs flex-shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">User Activity (Local Data)</h2>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Total Song Plays</p>
              <p className="text-2xl font-bold text-green-400">{totalSongPlays}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Unique Tracks</p>
              <p className="text-2xl font-bold text-blue-400">{uniqueTracks}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Playlist Plays</p>
              <p className="text-2xl font-bold text-purple-400">{totalPlaylistPlays}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Active Playlists</p>
              <p className="text-2xl font-bold text-yellow-400">{playlists.length}</p>
            </div>
          </div>

          {/* Top songs */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="font-semibold">Top Tracks by Play Count</h3>
            </div>
            {topSongs.length > 0 ? (
              <div className="divide-y divide-gray-700/50">
                {topSongs.map((song, i) => (
                  <div key={song.uri} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-6 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{song.name || 'Unknown Track'}</p>
                      <p className="text-gray-500 text-xs truncate">{song.artist || 'Unknown Artist'}</p>
                    </div>
                    <span className="text-green-400 font-semibold text-sm">{song.count} plays</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">No play data yet</div>
            )}
          </div>

          {/* Top playlists */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="font-semibold">Top Playlists by Play Count</h3>
            </div>
            {topPlaylists.length > 0 ? (
              <div className="divide-y divide-gray-700/50">
                {topPlaylists.map((pl, i) => (
                  <div key={pl.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-6 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{pl.name || 'Unknown Playlist'}</p>
                      <p className="text-gray-500 text-xs">{pl.lastPlayed ? `Last played: ${new Date(pl.lastPlayed).toLocaleDateString()}` : ''}</p>
                    </div>
                    <span className="text-blue-400 font-semibold text-sm">{pl.count} plays</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">No play data yet</div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
