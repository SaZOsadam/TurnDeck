import { PLATFORM_META } from '../services/storage'

const CATEGORY_COLORS = {
  'Daily Mission': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Comeback Push': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Catalog': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Filler': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Naija Push': 'bg-green-500/20 text-green-400 border-green-500/30',
}

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
}

export default function PlaylistCard({ playlist, onDelete, onEdit, onPlay, deleteLabel = 'Remove' }) {
  const platform = playlist.platform || 'spotify'
  const meta = PLATFORM_META[platform] || PLATFORM_META.spotify
  const openUrl = platform === 'spotify'
    ? `https://open.spotify.com/playlist/${playlist.playlist_id}`
    : platform === 'apple_music'
    ? (playlist.url || `https://music.apple.com/playlist/${playlist.playlist_id}`)
    : platform === 'youtube_music'
    ? `https://music.youtube.com/playlist?list=${playlist.playlist_id}`
    : platform === 'tidal'
    ? `https://tidal.com/playlist/${playlist.playlist_id}`
    : (playlist.url || '#')
  const tags = Array.isArray(playlist.tags) ? playlist.tags : []

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xl" style={{ backgroundColor: meta.color + '22' }}>
          {meta.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-white font-semibold truncate text-sm sm:text-base leading-tight">{playlist.name || 'Untitled Playlist'}</p>
            {playlist.category && (
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${getCategoryColor(playlist.category)}`}>
                {playlist.category}
              </span>
            )}
          </div>

          {/* Notes */}
          {playlist.notes && (
            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{playlist.notes}</p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag, i) => (
                <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          {/* Platform badge */}
          <div className="mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: meta.color, borderColor: meta.color + '44', backgroundColor: meta.color + '18' }}>
              {meta.icon} {meta.label}
            </span>
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: meta.color }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Open in {meta.label}
            </a>
            {onPlay && (
              <button
                onClick={() => onPlay(playlist)}
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Play
              </button>
            )}
            <div className="flex items-center gap-3 ml-auto">
              {onEdit && (
                <button
                  onClick={() => onEdit(playlist)}
                  className="text-gray-400 hover:text-white text-xs transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => onDelete(playlist.id)}
                className="text-red-400 hover:text-red-300 text-xs transition-colors"
              >
                {deleteLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
