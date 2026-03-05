import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getProfile, getPlatformAccounts, PLATFORM_META,
  getActivePlaylists, getArchivedPlaylists, getStats, getTopSongs, getTopPlaylists,
  todayKey, DAILY_STREAM_LIMITS,
  getChartEntries, addChartEntry, logChartPosition, removeChartEntry,
  getCategories, addCategory, removeCategory, clearStats,
} from '../services/storage'
import { saveProfileDB, savePlatformAccount, removePlatformAccount } from '../services/db'
import { useAuth } from '../hooks/useAuth.jsx'

const RATING_KEY = 'autodj_user_rating'
const SUPPORTED_PLATFORMS = [
  'spotify', 'apple_music', 'pandora', 'youtube_music', 'youtube',
  'facebook_mv', 'amazon_music', 'deezer', 'qobuz', 'tidal',
]
const AVATARS = ['🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🥁', '🎷', '🎤', '🎧']
const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent!' }

const CHART_PLATFORMS = [
  { key: 'spotify',       label: 'Spotify',       icon: '🎵', note: null },
  { key: 'apple_music',   label: 'Apple Music',   icon: '🍎', note: null },
  { key: 'pandora',       label: 'Pandora',       icon: '🎧', note: 'US/PR only' },
  { key: 'youtube_music', label: 'YouTube Music', icon: '▶️', note: null },
  { key: 'youtube',       label: 'YouTube',       icon: '▶️', note: null },
  { key: 'facebook_mv',   label: 'Facebook MV',   icon: '📘', note: 'US/PR only' },
  { key: 'amazon_music',  label: 'Amazon Music',  icon: '📦', note: null },
  { key: 'deezer',        label: 'Deezer',        icon: '🎶', note: null },
  { key: 'qobuz',         label: 'Qobuz',         icon: '🎼', note: null },
  { key: 'tidal',         label: 'Tidal',         icon: '🌊', note: null },
]

const CHART_LINKS = {
  spotify:       (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`,
  apple_music:   (q) => `https://music.apple.com/search?term=${encodeURIComponent(q)}`,
  youtube_music: (q) => `https://music.youtube.com/search?q=${encodeURIComponent(q)}`,
  youtube:       (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  tidal:         (q) => `https://tidal.com/search?q=${encodeURIComponent(q)}`,
  pandora:       (q) => `https://www.pandora.com/search/${encodeURIComponent(q)}/all`,
  amazon_music:  (q) => `https://music.amazon.com/search/${encodeURIComponent(q)}`,
  deezer:        (q) => `https://www.deezer.com/search/${encodeURIComponent(q)}`,
  qobuz:         (q) => `https://www.qobuz.com/search?q=${encodeURIComponent(q)}`,
  facebook_mv:   (q) => `https://www.facebook.com/search/videos?q=${encodeURIComponent(q)}`,
}

const SECTIONS = [
  { id: 'overview',  label: 'Overview',   icon: '🏠' },
  { id: 'stats',     label: 'Play Stats', icon: '📊' },
  { id: 'settings',  label: 'Settings',   icon: '⚙️' },
  { id: 'platforms', label: 'Platforms',  icon: '🎵' },
  { id: 'feedback',  label: 'Feedback',   icon: '⭐' },
]

function getRating() {
  try { return JSON.parse(localStorage.getItem(RATING_KEY)) || { stars: 0, feedback: '', submitted: false } }
  catch { return { stars: 0, feedback: '', submitted: false } }
}
function saveRatingData(data) { localStorage.setItem(RATING_KEY, JSON.stringify(data)) }

function StarRating({ value, hover, onHover, onLeave, onClick }) {
  return (
    <div className="flex gap-1" onMouseLeave={onLeave}>
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onMouseEnter={() => onHover(s)} onClick={() => onClick(s)}
          className="transition-transform hover:scale-110 focus:outline-none">
          <svg className={`w-9 h-9 transition-colors ${s <= (hover || value) ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default function Profile() {
  const [profile, setProfileState] = useState(() => getProfile())
  const [editingName, setEditingName] = useState(!getProfile().name)
  const [nameInput, setNameInput] = useState(getProfile().name || '')
  const [selectedAvatar, setSelectedAvatar] = useState(() => getProfile().avatar || AVATARS[0])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [rating, setRating] = useState(getRating)
  const [hover, setHover] = useState(0)
  const [feedback, setFeedback] = useState(() => getRating().feedback || '')
  const [submitted, setSubmitted] = useState(() => getRating().submitted || false)
  const [accounts, setAccounts] = useState(() => getPlatformAccounts())
  const [editingPlatform, setEditingPlatform] = useState(null)
  const [accountInput, setAccountInput] = useState('')
  const [activeSection, setActiveSection] = useState('overview')
  const [topSongs, setTopSongs] = useState(() => getTopSongs(50))
  const [topPlaylists, setTopPlaylists] = useState(() => getTopPlaylists(50))
  const [chartEntries, setChartEntries] = useState(() => getChartEntries())
  const [statsTab, setStatsTab] = useState('songs')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [showChartRef, setShowChartRef] = useState(false)
  const [addForm, setAddForm] = useState({ song: '', artist: '', type: 'song', platform: 'spotify' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [logModal, setLogModal] = useState(null)
  const [logPosition, setLogPosition] = useState('')
  const [logNote, setLogNote] = useState('')
  const [categories, setCategories] = useState(() => getCategories())
  const [newCat, setNewCat] = useState('')
  const [catError, setCatError] = useState('')
  const [settingsMsg, setSettingsMsg] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  const playlists = getActivePlaylists()
  const archived = getArchivedPlaylists()
  const stats = getStats()
  const topSongsPreview = getTopSongs(3)
  const today = todayKey()
  const totalPlays = Object.values(stats.songs).reduce((s, v) => s + v.count, 0)
  const totalSongPlays = totalPlays
  const totalPlaylistPlays = Object.values(stats.playlists).reduce((sum, p) => sum + p.count, 0)
  const songsAtLimit = Object.entries(stats.songs).filter(([, s]) => {
    const lim = (DAILY_STREAM_LIMITS[s.platform || 'spotify'] || DAILY_STREAM_LIMITS.spotify).limit
    return ((s.dailyCounts || {})[today] || 0) >= lim
  }).length

  const { user, signIn, signOut, syncNow, syncing } = useAuth()

  const handleSaveName = () => {
    if (!nameInput.trim()) return
    const updated = saveProfileDB({ name: nameInput.trim(), avatar: selectedAvatar })
    setProfileState(updated)
    setEditingName(false)
  }

  const handleAvatarPick = (a) => {
    setSelectedAvatar(a)
    setShowAvatarPicker(false)
    saveProfileDB({ avatar: a })
  }

  const handleSaveAccount = (platform) => {
    if (!accountInput.trim()) return
    savePlatformAccount(platform, { profileUrl: accountInput.trim(), username: accountInput.trim() })
    setAccounts(getPlatformAccounts())
    setEditingPlatform(null)
    setAccountInput('')
  }

  const handleRemoveAccount = (platform) => {
    removePlatformAccount(platform)
    setAccounts(getPlatformAccounts())
  }

  const handleRatingSubmit = (e) => {
    e.preventDefault()
    const data = { stars: rating.stars, feedback, submitted: true }
    saveRatingData(data)
    setSubmitted(true)
    setRating(data)
  }

  const handleRatingReset = () => {
    const fresh = { stars: 0, feedback: '', submitted: false }
    saveRatingData(fresh)
    setRating(fresh)
    setFeedback('')
    setSubmitted(false)
  }

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

  const handleStatsClear = () => {
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

  const handleAddCategory = (e) => {
    e.preventDefault()
    setCatError('')
    const trimmed = newCat.trim()
    if (!trimmed) { setCatError('Category name cannot be empty.'); return }
    if (categories.includes(trimmed)) { setCatError('Category already exists.'); return }
    const updated = addCategory(trimmed)
    setCategories(updated)
    setNewCat('')
    setSettingsMsg(`Category "${trimmed}" added.`)
    setTimeout(() => setSettingsMsg(''), 2500)
  }

  const handleRemoveCategory = (cat) => {
    const updated = removeCategory(cat)
    setCategories(updated)
    setSettingsMsg(`Category "${cat}" removed. Playlists using it are now uncategorized.`)
    setTimeout(() => setSettingsMsg(''), 3000)
  }

  const handleClearStats = () => {
    clearStats()
    setConfirmClear(false)
    setSettingsMsg('Play stats cleared.')
    setTopSongs([])
    setTopPlaylists([])
    setTimeout(() => setSettingsMsg(''), 2500)
  }

  const linkedCount = SUPPORTED_PLATFORMS.filter(p => accounts[p]).length

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">

      {/* Profile card */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
        {editingName ? (
          <div className="space-y-4">
            <p className="text-white font-semibold text-lg">Set up your profile</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAvatarPicker(v => !v)}
                className="w-14 h-14 rounded-full bg-gray-700 text-2xl flex items-center justify-center hover:bg-gray-600 transition-colors flex-shrink-0">
                {selectedAvatar}
              </button>
              <input
                autoFocus
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                placeholder="Your name"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            {showAvatarPicker && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-700/50 rounded-xl">
                {AVATARS.map(a => (
                  <button key={a} onClick={() => handleAvatarPick(a)}
                    className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      selectedAvatar === a ? 'bg-green-600' : 'hover:bg-gray-600'
                    }`}>{a}</button>
                ))}
              </div>
            )}
            <button onClick={handleSaveName} disabled={!nameInput.trim()}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
              Save profile
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button onClick={() => setShowAvatarPicker(v => !v)}
              className="w-14 h-14 rounded-full bg-gray-700 text-2xl flex items-center justify-center hover:bg-gray-600 transition-colors flex-shrink-0">
              {profile.avatar || selectedAvatar}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-xl truncate">{profile.name}</p>
              {profile.joinedAt && (
                <p className="text-gray-500 text-xs mt-0.5">
                  Member since {new Date(profile.joinedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <button onClick={() => { setNameInput(profile.name); setSelectedAvatar(profile.avatar || AVATARS[0]); setEditingName(true) }}
              className="text-gray-400 hover:text-white text-xs border border-gray-600 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0">
              Edit
            </button>
          </div>
        )}
        {showAvatarPicker && !editingName && (
          <div className="flex flex-wrap gap-2 p-3 bg-gray-700/50 rounded-xl mt-3">
            {AVATARS.map(a => (
              <button key={a} onClick={() => handleAvatarPick(a)}
                className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  (profile.avatar || selectedAvatar) === a ? 'bg-green-600' : 'hover:bg-gray-600'
                }`}>{a}</button>
            ))}
          </div>
        )}
      </div>

      {/* Google account banner */}
      {!user ? (
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-xl border border-blue-700/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-white font-semibold text-sm">Sign in to sync your data</p>
            <p className="text-gray-400 text-xs mt-0.5">Back up playlists, stats and settings across devices.</p>
          </div>
          <button onClick={signIn}
            className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm px-4 py-2 rounded-lg transition-colors flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {user.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="" className="w-7 h-7 rounded-full" />
            )}
            <div>
              <p className="text-white text-xs font-medium">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-gray-500 text-xs">Signed in with Google</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => syncNow(user.id)} disabled={syncing}
              className="text-blue-400 hover:text-blue-300 disabled:opacity-50 text-xs border border-blue-500/30 rounded px-2.5 py-1 transition-colors">
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>
            <button onClick={signOut} className="text-gray-400 hover:text-white text-xs border border-gray-600 rounded px-2.5 py-1 transition-colors">Sign out</button>
          </div>
        </div>
      )}

      {/* Quick nav grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/playlists"
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-500/40 rounded-xl p-4 text-center transition-colors group">
          <span className="text-2xl block mb-1">🎵</span>
          <p className="text-white text-sm font-semibold">Playlists</p>
          <p className="text-gray-500 text-xs mt-0.5">{playlists.length} saved</p>
        </Link>
        <Link to="/play"
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-500/40 rounded-xl p-4 text-center transition-colors group">
          <span className="text-2xl block mb-1">▶️</span>
          <p className="text-white text-sm font-semibold">Player</p>
          <p className="text-gray-500 text-xs mt-0.5">Open player</p>
        </Link>
        <button onClick={() => setActiveSection('stats')}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-500/40 rounded-xl p-4 text-center transition-colors">
          <span className="text-2xl block mb-1">📊</span>
          <p className="text-white text-sm font-semibold">Stats</p>
          <p className="text-gray-500 text-xs mt-0.5">{totalPlays} plays</p>
        </button>
        <button onClick={() => setActiveSection('settings')}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-500/40 rounded-xl p-4 text-center transition-colors">
          <span className="text-2xl block mb-1">⚙️</span>
          <p className="text-white text-sm font-semibold">Settings</p>
          <p className="text-gray-500 text-xs mt-0.5">Categories</p>
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
              activeSection === s.id ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>{s.label}</button>
        ))}
      </div>

      {/* Overview section */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          {/* Stats snapshot */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Stats</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{playlists.length}</p>
                <p className="text-gray-500 text-xs mt-0.5">playlists</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{totalPlays}</p>
                <p className="text-gray-500 text-xs mt-0.5">total plays</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${songsAtLimit > 0 ? 'text-red-400' : 'text-gray-400'}`}>{songsAtLimit}</p>
                <p className="text-gray-500 text-xs mt-0.5">at limit today</p>
              </div>
            </div>
            {topSongsPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Top tracks</p>
                {topSongsPreview.map((song, i) => (
                  <div key={song.uri} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-4 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{song.name || 'Unknown'}</p>
                    </div>
                    <span className="text-green-400 text-xs font-mono">{song.count}x</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setActiveSection('stats')} className="block w-full text-center text-green-400 text-xs mt-3 hover:text-green-300 transition-colors">See full stats →</button>
          </div>

          {/* Archived playlists */}
          {archived.length > 0 && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Archived Playlists</p>
                <p className="text-gray-500 text-xs">{archived.length} stored</p>
              </div>
              <Link to="/playlists" className="text-green-400 hover:text-green-300 text-xs transition-colors">View</Link>
            </div>
          )}

          {/* Platform summary */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Streaming Platforms</p>
              <p className="text-gray-500 text-xs">{linkedCount} linked</p>
            </div>
            <button onClick={() => setActiveSection('platforms')} className="text-green-400 hover:text-green-300 text-xs transition-colors">Manage</button>
          </div>
        </div>
      )}

      {/* Stats section */}
      {activeSection === 'stats' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Play Stats</h2>
              <p className="text-gray-400 text-xs mt-0.5">Track plays across chart-eligible platforms.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowChartRef(v => !v)}
                className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded border border-gray-600 hover:bg-gray-700 transition-colors">
                {showChartRef ? 'Hide' : 'Platforms'}
              </button>
              <button onClick={handleStatsClear}
                className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors">
                Clear
              </button>
            </div>
          </div>

          {showChartRef && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
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
              <p className="text-gray-600 text-xs mt-3">Daily limits are conservative estimates.</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
              <p className="text-xl font-bold text-green-400">{totalSongPlays}</p>
              <p className="text-gray-400 text-xs mt-1">Song Plays</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
              <p className="text-xl font-bold text-blue-400">{totalPlaylistPlays}</p>
              <p className="text-gray-400 text-xs mt-1">Playlist Plays</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
              <p className="text-xl font-bold text-purple-400">{Object.keys(stats.songs).length}</p>
              <p className="text-gray-400 text-xs mt-1">Unique Songs</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
              <p className="text-xl font-bold text-yellow-400">{Object.keys(stats.playlists).length}</p>
              <p className="text-gray-400 text-xs mt-1">Unique Playlists</p>
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap">
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

          <div className="flex gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
            <button onClick={() => setStatsTab('songs')}
              className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                statsTab === 'songs' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'
              }`}>Top Songs</button>
            <button onClick={() => setStatsTab('playlists')}
              className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                statsTab === 'playlists' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'
              }`}>Top Playlists</button>
            <button onClick={() => setStatsTab('tracker')}
              className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                statsTab === 'tracker' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'
              }`}>Chart Tracker {chartEntries.length > 0 && <span className="ml-1 opacity-60">{chartEntries.length}</span>}</button>
          </div>

          {statsTab === 'songs' && (
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
                          <p className="text-white font-medium truncate text-sm">{song.name || 'Unknown Track'}</p>
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

          {statsTab === 'playlists' && (
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
                        <p className="text-white font-medium truncate text-sm">{pl.name || 'Unknown Playlist'}</p>
                        <a href={`https://open.spotify.com/playlist/${pl.id}`} target="_blank" rel="noopener noreferrer"
                          className="text-green-400 text-xs hover:underline">Open in Spotify</a>
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

          {statsTab === 'tracker' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Track a song, album, or artist across any chart platform.</p>
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
        </div>
      )}

      {/* Platforms section */}
      {activeSection === 'platforms' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Streaming Platforms</h2>
          {SUPPORTED_PLATFORMS.map(platform => {
            const meta = PLATFORM_META[platform]
            const saved = accounts[platform]
            const isEditing = editingPlatform === platform
            return (
              <div key={platform} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-700">
                <span className="text-xl flex-shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{meta.label}</p>
                  {isEditing ? (
                    <div className="flex gap-2 mt-1.5">
                      <input autoFocus type="text" value={accountInput}
                        onChange={e => setAccountInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveAccount(platform); if (e.key === 'Escape') setEditingPlatform(null) }}
                        placeholder="Profile URL or username"
                        className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-green-500" />
                      <button onClick={() => handleSaveAccount(platform)} className="text-green-400 text-xs font-medium px-2">Save</button>
                      <button onClick={() => setEditingPlatform(null)} className="text-gray-400 text-xs px-1">✕</button>
                    </div>
                  ) : saved ? (
                    <p className="text-gray-400 text-xs truncate mt-0.5">{saved.username}</p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-0.5">Not linked</p>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setEditingPlatform(platform); setAccountInput(saved?.username || '') }}
                      className="text-gray-400 hover:text-white text-xs transition-colors">
                      {saved ? 'Edit' : 'Link'}
                    </button>
                    {saved && (
                      <button onClick={() => handleRemoveAccount(platform)} className="text-red-400 hover:text-red-300 text-xs transition-colors">Remove</button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Settings section */}
      {activeSection === 'settings' && (
        <div className="space-y-4">
          {settingsMsg && (
            <p className="bg-green-900/30 border border-green-700 text-green-400 rounded-lg px-4 py-3 text-sm">{settingsMsg}</p>
          )}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-base font-semibold text-white mb-1">Playlist Categories</h2>
            <p className="text-gray-400 text-sm mb-4">Create and manage categories for organizing your bookmarked playlists.</p>
            <form onSubmit={handleAddCategory} className="flex gap-3 mb-4">
              <input type="text" value={newCat} onChange={e => { setNewCat(e.target.value); setCatError('') }}
                placeholder="e.g. Arirang Push, K-charts, Weekend..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500" />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Add</button>
            </form>
            {catError && <p className="text-red-400 text-xs mb-3">{catError}</p>}
            {categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-2.5">
                    <span className="text-white text-sm font-medium">{cat}</span>
                    <button onClick={() => handleRemoveCategory(cat)} className="text-red-400 hover:text-red-300 text-xs transition-colors">Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No categories yet. Add one above.</p>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-base font-semibold text-white mb-1">Data</h2>
            <p className="text-gray-400 text-sm mb-4">All your data is stored locally in this browser.</p>
            {!confirmClear ? (
              <button onClick={() => setConfirmClear(true)}
                className="bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                Clear Play Stats
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-gray-400 text-sm">Are you sure? This cannot be undone.</p>
                <button onClick={handleClearStats} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Yes, Clear</button>
                <button onClick={() => setConfirmClear(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">Cancel</button>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-base font-semibold text-white mb-4">Cloud Account</h2>
            {!user ? (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">Sign in with Google to back up and sync your playlists, stats and settings across devices.</p>
                <button onClick={signIn}
                  className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  {user.user_metadata?.avatar_url && (
                    <img src={user.user_metadata.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{user.user_metadata?.full_name || user.email}</p>
                    <p className="text-gray-400 text-xs truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => syncNow(user.id)} disabled={syncing}
                    className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 text-blue-400 text-sm font-medium py-2 rounded-lg border border-blue-500/30 transition-colors">
                    {syncing ? 'Syncing...' : 'Push data to cloud'}
                  </button>
                  <button onClick={signOut}
                    className="px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg border border-gray-600 transition-colors">
                    Sign out
                  </button>
                </div>
                <p className="text-gray-600 text-xs">Data syncs automatically on sign-in. Use "Push" to manually upload your latest changes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback section */}
      {activeSection === 'feedback' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Rate TurnDeck</h2>
          {submitted ? (
            <div className="text-center space-y-3">
              <div className="flex justify-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className={`w-9 h-9 ${s <= rating.stars ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                ))}
              </div>
              <p className="text-green-400 font-semibold">{LABELS[rating.stars]}! Thanks for the feedback.</p>
              {rating.feedback && <p className="text-gray-400 text-sm italic">"{rating.feedback}"</p>}
              <button onClick={handleRatingReset} className="text-gray-500 hover:text-white text-xs underline transition-colors">Change rating</button>
            </div>
          ) : (
            <form onSubmit={handleRatingSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <StarRating value={rating.stars} hover={hover} onHover={setHover}
                  onLeave={() => setHover(0)} onClick={s => setRating(r => ({ ...r, stars: s }))} />
                <p className="text-sm text-gray-400 h-5">
                  {hover ? LABELS[hover] : rating.stars ? LABELS[rating.stars] : 'Tap a star'}
                </p>
              </div>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="What do you think?" rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 resize-none" />
              <button type="submit" disabled={!rating.stars}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
                Submit
              </button>
            </form>
          )}
        </div>
      )}

      {logModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setLogModal(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-1">Log Chart Position</h3>
            <p className="text-gray-400 text-xs mb-4">
              {logModal.song}{logModal.artist ? ` — ${logModal.artist}` : ''} · {PLATFORM_META[logModal.platform]?.label}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Chart Position (e.g. 5 = #5)</label>
                <input type="number" min="1" max="200" value={logPosition} onChange={e => setLogPosition(e.target.value)}
                  placeholder="e.g. 12" autoFocus
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Note (optional)</label>
                <input type="text" value={logNote} onChange={e => setLogNote(e.target.value)}
                  placeholder="e.g. Peak position, after streaming party"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
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
    </div>
  )
}
