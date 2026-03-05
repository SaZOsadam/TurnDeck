const KEYS = {
  PLAYLISTS: 'autodj_playlists',
  SETTINGS: 'autodj_settings',
  ROTATION: 'autodj_rotation',
  STATS: 'autodj_stats',
  CATEGORIES: 'autodj_categories',
  ACTIVITY: 'autodj_activity',
  PLATFORM_ACCOUNTS: 'autodj_platform_accounts',
  PROFILE: 'turndeck_profile',
}

export function getProfile() {
  try { return JSON.parse(localStorage.getItem(KEYS.PROFILE)) || {} }
  catch { return {} }
}

export function saveProfile(data) {
  const existing = getProfile()
  const updated = { ...existing, ...data }
  if (!updated.joinedAt) updated.joinedAt = new Date().toISOString()
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(updated))
  return updated
}

const DEFAULT_SETTINGS = {
  rotation_mode: 'playlist_end',
  interval_minutes: 30,
  fallback_playlist_id: '37i9dQZEVXbKY7jLzlJ11V',
  enabled: false,
}

const DEFAULT_CATEGORIES = ['Daily Mission', 'Comeback Push', 'Catalog', 'Filler', 'Naija Push']

const DEFAULT_PLAYLISTS = [
  { playlist_id: '37i9dQZEVXbMDoHDwVN2tF', name: 'Top Global', platform: 'spotify', type: 'playlist', category: 'Daily Mission', notes: '', tags: [] },
  { playlist_id: '37i9dQZF1DXcBWIGoYBM5M', name: "Today's Top Hits", platform: 'spotify', type: 'playlist', category: 'Daily Mission', notes: '', tags: [] },
  { playlist_id: '37i9dQZEVXbKY7jLzlJ11V', name: 'Top 50 Nigeria', platform: 'spotify', type: 'playlist', category: 'Naija Push', notes: '', tags: [] },
  { playlist_id: 'pl.f4d106fed2bd41149eda4ff549bdc774', name: "Today's Hits", platform: 'apple_music', type: 'playlist', category: 'Daily Mission', notes: '', tags: [], url: 'https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149eda4ff549bdc774' },
]

// --- Auto-migrate stale data ---
const STORAGE_VERSION = '6'  // bump this when defaults change
;(function migrate() {
  const v = localStorage.getItem('autodj_version')
  if (v !== STORAGE_VERSION) {
    localStorage.removeItem(KEYS.PLAYLISTS)
    localStorage.removeItem(KEYS.ROTATION)
    if (DEFAULT_PLAYLISTS.length > 0) {
      localStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(
        DEFAULT_PLAYLISTS.map(dp => ({ ...dp, id: crypto.randomUUID(), addedAt: new Date().toISOString() }))
      ))
    }
    localStorage.setItem('autodj_version', STORAGE_VERSION)
  }
})()

// --- Playlists ---
export function getPlaylists() {
  try {
    const raw = localStorage.getItem(KEYS.PLAYLISTS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePlaylists(playlists) {
  localStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(playlists))
}

export function addPlaylist(playlist) {
  const playlists = getPlaylists()
  playlists.push(playlist)
  savePlaylists(playlists)
  return playlists
}

export function removePlaylist(id) {
  const playlists = getPlaylists().filter(p => p.id !== id)
  savePlaylists(playlists)
  return playlists
}

export function archivePlaylist(id) {
  const playlists = getPlaylists()
  const target = playlists.find(p => p.id === id)
  if (!target) return playlists
  const updated = playlists.map(p => p.id === id ? { ...p, archived: true, archivedAt: new Date().toISOString() } : p)
  savePlaylists(updated)
  logActivity('archive', `Archived playlist: ${target.name}`, { playlistId: id, name: target.name })
  return updated
}

export function restorePlaylist(id) {
  const playlists = getPlaylists()
  const target = playlists.find(p => p.id === id)
  const updated = playlists.map(p => p.id === id ? { ...p, archived: false, archivedAt: null } : p)
  savePlaylists(updated)
  if (target) logActivity('restore', `Restored playlist: ${target.name}`, { playlistId: id, name: target.name })
  return updated
}

export function getArchivedPlaylists() {
  return getPlaylists().filter(p => p.archived === true)
}

export function getActivePlaylists() {
  return getPlaylists().filter(p => !p.archived)
}

export function reorderPlaylists(orderedIds) {
  const all = getPlaylists()
  const archived = all.filter(p => p.archived)
  const map = Object.fromEntries(all.map(p => [p.id, p]))
  const reordered = orderedIds.map(id => map[id]).filter(Boolean)
  savePlaylists([...reordered, ...archived])
  return reordered
}

export function updatePlaylist(id, updates) {
  const playlists = getPlaylists().map(p => p.id === id ? { ...p, ...updates } : p)
  savePlaylists(playlists)
  return playlists
}

// --- Categories ---
export function getCategories() {
  try {
    const raw = localStorage.getItem(KEYS.CATEGORIES)
    return raw ? JSON.parse(raw) : [...DEFAULT_CATEGORIES]
  } catch {
    return [...DEFAULT_CATEGORIES]
  }
}

export function saveCategories(categories) {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories))
}

export function addCategory(name) {
  const trimmed = name.trim()
  if (!trimmed) return getCategories()
  const cats = getCategories()
  if (cats.includes(trimmed)) return cats
  const updated = [...cats, trimmed]
  saveCategories(updated)
  return updated
}

export function removeCategory(name) {
  const cats = getCategories().filter(c => c !== name)
  saveCategories(cats)
  const playlists = getPlaylists().map(p => p.category === name ? { ...p, category: '' } : p)
  savePlaylists(playlists)
  return cats
}

export function loadDefaultPlaylists() {
  const existing = getPlaylists()
  const existingIds = new Set(existing.map(p => p.playlist_id))
  let added = 0
  for (const dp of DEFAULT_PLAYLISTS) {
    if (!existingIds.has(dp.playlist_id)) {
      existing.push({ ...dp, id: crypto.randomUUID() })
      added++
    }
  }
  savePlaylists(existing)
  return { playlists: existing, added }
}

// --- Settings ---
export function getSettings() {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

// --- Rotation state ---
export function getRotationState() {
  try {
    const raw = localStorage.getItem(KEYS.ROTATION)
    return raw ? JSON.parse(raw) : { enabled: false, current_playlist_index: 0 }
  } catch {
    return { enabled: false, current_playlist_index: 0 }
  }
}

export function saveRotationState(state) {
  localStorage.setItem(KEYS.ROTATION, JSON.stringify(state))
}

// --- Parse playlist input — returns { id, platform } or null ---
export function parsePlaylistInput(input) {
  if (!input || !input.trim()) return null
  const trimmed = input.trim()

  // Spotify URI — playlist
  const spotifyUri = trimmed.match(/spotify:playlist:([a-zA-Z0-9]+)/)
  if (spotifyUri) return { id: spotifyUri[1], platform: 'spotify', type: 'playlist' }

  // Spotify URI — album
  const spotifyUriAlbum = trimmed.match(/spotify:album:([a-zA-Z0-9]+)/)
  if (spotifyUriAlbum) return { id: spotifyUriAlbum[1], platform: 'spotify', type: 'album' }

  // Spotify URL — playlist
  const spotifyUrl = trimmed.match(/open\.spotify\.com\/(?:[a-z]{2,5}-[a-z]{2,5}\/)?playlist\/([a-zA-Z0-9]+)/)
  if (spotifyUrl) return { id: spotifyUrl[1], platform: 'spotify', type: 'playlist' }

  // Spotify URL — album
  const spotifyAlbum = trimmed.match(/open\.spotify\.com\/(?:[a-z]{2,5}-[a-z]{2,5}\/)?album\/([a-zA-Z0-9]+)/)
  if (spotifyAlbum) return { id: spotifyAlbum[1], platform: 'spotify', type: 'album' }

  // Apple Music URL — playlist with name
  const appleUrl = trimmed.match(/music\.apple\.com\/[a-z]{2,4}\/playlist\/[^/]+\/(pl\.[a-zA-Z0-9]+)/)
  if (appleUrl) return { id: appleUrl[1], platform: 'apple_music', type: 'playlist', url: trimmed }

  // Apple Music share URL — playlist without name
  const appleShort = trimmed.match(/music\.apple\.com\/[a-z]{2,4}\/playlist\/(pl\.[a-zA-Z0-9]+)/)
  if (appleShort) return { id: appleShort[1], platform: 'apple_music', type: 'playlist', url: trimmed }

  // Apple Music URL — album (numeric ID)
  const appleAlbum = trimmed.match(/music\.apple\.com\/[a-z]{2,4}\/album\/(?:[^/]+\/)?(\.?\d{6,})/)
  if (appleAlbum) return { id: appleAlbum[1], platform: 'apple_music', type: 'album', url: trimmed }

  // Pandora — pandora.com/playlist/PL:XXXXX
  const pandoraUrl = trimmed.match(/pandora\.com\/(?:playlist|station)\/([^?&/]+)/)
  if (pandoraUrl) return { id: pandoraUrl[1], platform: 'pandora', url: trimmed }

  // YouTube Music playlist
  const ytUrl = trimmed.match(/music\.youtube\.com\/.*[?&]list=([a-zA-Z0-9_-]+)/)
  if (ytUrl) return { id: ytUrl[1], platform: 'youtube_music', url: trimmed }

  // Tidal playlist
  const tidalUrl = trimmed.match(/tidal\.com\/(?:browse\/)?playlist\/([a-zA-Z0-9-]+)/)
  if (tidalUrl) return { id: tidalUrl[1], platform: 'tidal', url: trimmed }

  // Raw Spotify ID fallback
  if (/^[a-zA-Z0-9]{15,30}$/.test(trimmed)) return { id: trimmed, platform: 'spotify' }

  return null
}

// Keep backward-compat alias
export function parsePlaylistId(input) {
  const result = parsePlaylistInput(input)
  return result ? result.id : null
}

// --- Fetch playlist name (platform-aware) ---
export async function fetchPlaylistName(playlistId, platform = 'spotify', rawUrl = null, type = 'playlist') {
  try {
    if (platform === 'spotify') {
      const kind = type === 'album' ? 'album' : 'playlist'
      const url = `https://open.spotify.com/oembed?url=https://open.spotify.com/${kind}/${playlistId}`
      const res = await fetch(url)
      if (!res.ok) return null
      const data = await res.json()
      const title = data.title || null
      if (title) return title.replace(/\s*\|\s*Spotify$/, '').replace(/\s*-\s*playlist by\s+.*$/, '').trim()
    }
    if (platform === 'apple_music' && rawUrl) {
      const res = await fetch(`https://music.apple.com/oembed?url=${encodeURIComponent(rawUrl)}`)
      if (!res.ok) return null
      const data = await res.json()
      return data.title ? data.title.replace(/\s*on Apple Music$/, '').trim() : null
    }
    return null
  } catch {
    return null
  }
}

// --- Platform helpers ---
export const PLATFORM_META = {
  spotify:       { label: 'Spotify',        color: '#1DB954', icon: '🎵', chartNote: null },
  apple_music:   { label: 'Apple Music',    color: '#FC3C44', icon: '🍎', chartNote: null },
  pandora:       { label: 'Pandora',        color: '#224099', icon: '🎧', chartNote: 'US/PR only' },
  youtube_music: { label: 'YouTube Music',  color: '#FF0000', icon: '▶️', chartNote: null },
  youtube:       { label: 'YouTube',        color: '#FF0000', icon: '▶️', chartNote: null },
  facebook_mv:   { label: 'Facebook MV',    color: '#1877F2', icon: '📘', chartNote: 'US/PR only' },
  amazon_music:  { label: 'Amazon Music',   color: '#00A8E1', icon: '📦', chartNote: null },
  deezer:        { label: 'Deezer',         color: '#A238FF', icon: '🎶', chartNote: null },
  qobuz:         { label: 'Qobuz',          color: '#002855', icon: '🎼', chartNote: null },
  tidal:         { label: 'Tidal',          color: '#00FFFF', icon: '🌊', chartNote: null },
}

export function getEmbedUrl(playlist) {
  const { platform, playlist_id, url, type } = playlist
  const kind = type === 'album' ? 'album' : 'playlist'
  if (platform === 'spotify' || !platform) return `https://open.spotify.com/embed/${kind}/${playlist_id}`
  if (platform === 'apple_music') return `https://embed.music.apple.com/${url?.match(/music\.apple\.com\/(\w{2,4})\//)?.[1] || 'us'}/${kind}/${playlist_id}`
  if (platform === 'youtube_music') return `https://www.youtube.com/embed/videoseries?list=${playlist_id}`
  if (platform === 'tidal') return `https://embed.tidal.com/playlists/${playlist_id}`
  return null
}

// --- Build rotation status object (mirrors old backend /rotation/status shape) ---
export function buildRotationStatus() {
  const settings = getSettings()
  const playlists = getPlaylists()
  const rotation = getRotationState()
  const enabled = rotation.enabled && playlists.length >= 2
  const idx = rotation.current_playlist_index || 0
  const safeIdx = playlists.length > 0 ? idx % playlists.length : 0
  const nextIdx = playlists.length > 0 ? (safeIdx + 1) % playlists.length : 0

  return {
    enabled,
    rotation_mode: settings.rotation_mode,
    interval_minutes: settings.interval_minutes,
    current_playlist_index: safeIdx,
    current_playlist: playlists.length > 0 ? playlists[safeIdx] : null,
    next_playlist: playlists.length > 1 ? playlists[nextIdx] : null,
    playlists,
    total_playlists: playlists.length,
  }
}

// --- Play Stats ---
// Shape: { playlists: { [playlistId]: { name, count, lastPlayed } }, songs: { [trackUri]: { name, artist, count, lastPlayed, playlistId } } }
export function getStats() {
  try {
    const raw = localStorage.getItem(KEYS.STATS)
    return raw ? JSON.parse(raw) : { playlists: {}, songs: {} }
  } catch {
    return { playlists: {}, songs: {} }
  }
}

function saveStats(stats) {
  localStorage.setItem(KEYS.STATS, JSON.stringify(stats))
}

export function recordPlaylistPlay(playlistId, playlistName) {
  const stats = getStats()
  if (!stats.playlists[playlistId]) {
    stats.playlists[playlistId] = { name: playlistName, count: 0, lastPlayed: null }
  }
  stats.playlists[playlistId].count += 1
  stats.playlists[playlistId].lastPlayed = new Date().toISOString()
  stats.playlists[playlistId].name = playlistName || stats.playlists[playlistId].name
  saveStats(stats)
}

// Daily filter limit constants (conservative chart-safe thresholds per platform)
export const DAILY_STREAM_LIMITS = {
  spotify:       { warn: 3, limit: 5 },
  apple_music:   { warn: 3, limit: 5 },
  youtube_music: { warn: 5, limit: 10 },
  youtube:       { warn: 5, limit: 10 },
  pandora:       { warn: 5, limit: 10 },
  facebook_mv:   { warn: 5, limit: 10 },
  amazon_music:  { warn: 3, limit: 5 },
  deezer:        { warn: 4, limit: 7 },
  qobuz:         { warn: 3, limit: 5 },
  tidal:         { warn: 3, limit: 5 },
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function recordSongPlay(trackUri, trackName, artistName, playlistId, platform = 'spotify') {
  const stats = getStats()
  const today = todayKey()
  if (!stats.songs[trackUri]) {
    stats.songs[trackUri] = { name: trackName, artist: artistName, count: 0, lastPlayed: null, playlistId, platform, dailyCounts: {} }
  }
  const song = stats.songs[trackUri]
  song.count += 1
  song.lastPlayed = new Date().toISOString()
  song.name = trackName || song.name
  song.artist = artistName || song.artist
  song.platform = platform || song.platform
  song.dailyCounts = song.dailyCounts || {}
  song.dailyCounts[today] = (song.dailyCounts[today] || 0) + 1
  saveStats(stats)
  logActivity('play', `Played: ${trackName || trackUri}`, { trackUri, playlistId, platform })
}

export function getTopSongs(limit = 20) {
  const stats = getStats()
  return Object.entries(stats.songs)
    .map(([uri, data]) => ({ uri, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function getTopPlaylists(limit = 20) {
  const stats = getStats()
  return Object.entries(stats.playlists)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function clearStats() {
  localStorage.removeItem(KEYS.STATS)
}

export function getDailyCount(trackUri) {
  const stats = getStats()
  const song = stats.songs[trackUri]
  if (!song) return 0
  return (song.dailyCounts || {})[todayKey()] || 0
}

export function getStreamStatus(trackUri, platform = 'spotify') {
  const count = getDailyCount(trackUri)
  const limits = DAILY_STREAM_LIMITS[platform] || DAILY_STREAM_LIMITS.spotify
  if (count >= limits.limit) return 'over'
  if (count >= limits.warn) return 'warn'
  return 'ok'
}

// --- Activity Log ---
export function logActivity(type, description, metadata = {}) {
  try {
    const log = getActivityLog()
    log.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), type, description, metadata })
    localStorage.setItem(KEYS.ACTIVITY, JSON.stringify(log.slice(0, 500)))
  } catch {}
}

export function getActivityLog() {
  try {
    const raw = localStorage.getItem(KEYS.ACTIVITY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearActivityLog() {
  localStorage.removeItem(KEYS.ACTIVITY)
}

// --- Platform Accounts ---
export function getPlatformAccounts() {
  try {
    const raw = localStorage.getItem(KEYS.PLATFORM_ACCOUNTS)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function savePlatformAccount(platform, data) {
  const accounts = getPlatformAccounts()
  accounts[platform] = { ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(KEYS.PLATFORM_ACCOUNTS, JSON.stringify(accounts))
  logActivity('account', `Updated ${platform} account`, { platform })
}

export function removePlatformAccount(platform) {
  const accounts = getPlatformAccounts()
  delete accounts[platform]
  localStorage.setItem(KEYS.PLATFORM_ACCOUNTS, JSON.stringify(accounts))
}

// --- Timer persistence (survives tab close/refresh) ---
export function saveTimerTarget(targetMs) {
  if (targetMs) {
    localStorage.setItem('autodj_timer_target', String(targetMs))
  } else {
    localStorage.removeItem('autodj_timer_target')
  }
}

export function getTimerTarget() {
  try {
    const raw = localStorage.getItem('autodj_timer_target')
    if (!raw) return null
    const t = Number(raw)
    // Only return if it's in the future
    return t > Date.now() ? t : null
  } catch {
    return null
  }
}

// --- Chart Tracker ---
const CHART_TRACKER_KEY = 'turndeck_chart_tracker'

export function getChartEntries() {
  try {
    const raw = localStorage.getItem(CHART_TRACKER_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveChartEntries(entries) {
  localStorage.setItem(CHART_TRACKER_KEY, JSON.stringify(entries))
}

export function addChartEntry({ song, artist, type, platform }) {
  const entries = getChartEntries()
  const entry = {
    id: crypto.randomUUID(),
    song: song.trim(),
    artist: artist.trim(),
    type: type || 'song',
    platform,
    positions: [],
    addedAt: new Date().toISOString(),
  }
  entries.unshift(entry)
  saveChartEntries(entries)
  return entry
}

export function logChartPosition(id, position, note = '') {
  const entries = getChartEntries()
  const idx = entries.findIndex(e => e.id === id)
  if (idx === -1) return
  const today = new Date().toISOString().slice(0, 10)
  const existing = entries[idx].positions.findIndex(p => p.date === today)
  if (existing >= 0) {
    entries[idx].positions[existing] = { position: Number(position), date: today, note, loggedAt: new Date().toISOString() }
  } else {
    entries[idx].positions.unshift({ position: Number(position), date: today, note, loggedAt: new Date().toISOString() })
  }
  saveChartEntries(entries)
}

export function removeChartEntry(id) {
  const entries = getChartEntries().filter(e => e.id !== id)
  saveChartEntries(entries)
}

// --- Skip to next playlist ---
export function skipToNext() {
  const playlists = getPlaylists()
  if (playlists.length < 2) return null
  const rotation = getRotationState()
  const currentIdx = rotation.current_playlist_index || 0
  const nextIdx = (currentIdx + 1) % playlists.length
  const newState = { ...rotation, current_playlist_index: nextIdx }
  saveRotationState(newState)
  return {
    current_playlist: playlists[nextIdx],
    next_playlist: playlists[(nextIdx + 1) % playlists.length],
    current_playlist_index: nextIdx,
  }
}
