import { Link } from 'react-router-dom'
import { getPlaylists, getCategories, getStats } from '../services/storage'

export default function Dashboard() {
  const playlists = getPlaylists()
  const categories = getCategories()
  const stats = getStats()
  const totalSongPlays = Object.values(stats.songs).reduce((sum, s) => sum + s.count, 0)
  const totalPlaylistPlays = Object.values(stats.playlists).reduce((sum, p) => sum + p.count, 0)
  const recentPlaylists = [...playlists].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)).slice(0, 3)

  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: playlists.filter(p => p.category === cat).length,
  })).filter(c => c.count > 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">My Playlist Hub</h1>
        <p className="text-gray-400">Bookmark, organize, and quick-access your playlists.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Bookmarked</p>
          <p className="text-2xl font-bold text-white">{playlists.length}</p>
          <p className="text-gray-500 text-xs mt-1">playlists</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Categories</p>
          <p className="text-2xl font-bold text-purple-400">{categoryCounts.length}</p>
          <p className="text-gray-500 text-xs mt-1">in use</p>
        </div>
        <Link to="/stats" className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-green-500/50 transition-colors">
          <p className="text-gray-400 text-xs mb-1">Song Plays</p>
          <p className="text-2xl font-bold text-green-400">{totalSongPlays}</p>
          <p className="text-gray-500 text-xs mt-1">{Object.keys(stats.songs).length} tracks</p>
        </Link>
        <Link to="/stats" className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-colors">
          <p className="text-gray-400 text-xs mb-1">Playlist Opens</p>
          <p className="text-2xl font-bold text-blue-400">{totalPlaylistPlays}</p>
          <p className="text-gray-500 text-xs mt-1">tracked</p>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link to="/playlists" className="bg-green-600 hover:bg-green-700 rounded-xl p-4 text-center font-semibold transition-colors text-sm">
          + Bookmark a Playlist
        </Link>
        <Link to="/play" className="bg-gray-700 hover:bg-gray-600 rounded-xl p-4 text-center font-semibold transition-colors text-sm">
          Open Player
        </Link>
        <Link to="/settings" className="bg-gray-700 hover:bg-gray-600 rounded-xl p-4 text-center font-semibold transition-colors text-sm">
          Manage Categories
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recently added */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Recently Added</h2>
            <Link to="/playlists" className="text-green-400 text-xs hover:text-green-300">View all</Link>
          </div>
          {recentPlaylists.length > 0 ? (
            <div className="divide-y divide-gray-700/50">
              {recentPlaylists.map(pl => (
                <div key={pl.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{pl.name}</p>
                    {pl.category && <p className="text-gray-500 text-xs">{pl.category}</p>}
                  </div>
                  <a href={`https://open.spotify.com/playlist/${pl.playlist_id}`} target="_blank" rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 text-xs flex-shrink-0">Open</a>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No playlists yet. <Link to="/playlists" className="text-green-400 hover:underline">Add one</Link>
            </div>
          )}
        </div>

        {/* Categories summary */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-sm">By Category</h2>
            <Link to="/settings" className="text-green-400 text-xs hover:text-green-300">Manage</Link>
          </div>
          {categoryCounts.length > 0 ? (
            <div className="divide-y divide-gray-700/50">
              {categoryCounts.map(cat => (
                <Link key={cat.name} to={`/playlists`}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                  <span className="text-white text-sm">{cat.name}</span>
                  <span className="text-gray-400 text-xs">{cat.count} playlist{cat.count !== 1 ? 's' : ''}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No categories assigned yet
            </div>
          )}
        </div>
      </div>

      {/* Getting started */}
      {playlists.length === 0 && (
        <div className="mt-4 bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-base font-semibold mb-3">Getting started</h2>
          <div className="space-y-3">
            <Step num={1} done={false} title="Bookmark your playlists">
              Go to <Link to="/playlists" className="text-green-400 underline">My Playlists</Link> and paste Spotify playlist URLs.
            </Step>
            <Step num={2} done={false} title="Organize with categories & tags">
              Add categories (Daily Mission, Comeback Push, etc.) and notes to each playlist.
            </Step>
            <Step num={3} done={false} title="Open and listen">
              Use <Link to="/play" className="text-green-400 underline">Player</Link> to quickly open any playlist in the Spotify embed.
            </Step>
          </div>
        </div>
      )}
    </div>
  )
}

function Step({ num, done, title, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${done ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>{done ? '✓' : num}</span>
      <div>
        <p className={`font-medium ${done ? 'text-green-400' : 'text-white'}`}>{title}</p>
        <p className="text-gray-400 text-sm">{children}</p>
      </div>
    </div>
  )
}
