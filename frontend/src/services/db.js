/**
 * db.js — Supabase sync layer
 * Reads always come from localStorage (fast, synchronous, works offline/guest).
 * Writes go to localStorage first, then fire-and-forget to Supabase when signed in.
 * syncFromSupabase() pulls cloud data into localStorage on sign-in.
 * pushToSupabase() uploads localStorage state to cloud (manual sync / sign-in push).
 */
import { supabase } from './supabase'
import {
  getPlaylists, savePlaylists,
  getCategories, saveCategories,
  getSettings, saveSettings,
  getStats, getProfile, saveProfile,
  getPlatformAccounts,
  getActivityLog,
  addPlaylist as localAddPlaylist,
  removePlaylist as localRemovePlaylist,
  archivePlaylist as localArchivePlaylist,
  restorePlaylist as localRestorePlaylist,
  updatePlaylist as localUpdatePlaylist,
  reorderPlaylists as localReorderPlaylists,
  savePlatformAccount as localSavePlatformAccount,
  removePlatformAccount as localRemovePlatformAccount,
  recordSongPlay as localRecordSongPlay,
  recordPlaylistPlay as localRecordPlaylistPlay,
  addCategory as localAddCategory,
  removeCategory as localRemoveCategory,
} from './storage'

// ─── Helpers ────────────────────────────────────────────────────────────────

async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

function fire(promise) {
  promise.catch(() => {})
}

// ─── Pull: Supabase → localStorage ──────────────────────────────────────────

export async function syncFromSupabase(userId) {
  if (!userId) return
  try {
    const [
      { data: profileData },
      { data: playlistsData },
      { data: categoriesData },
      { data: settingsData },
      { data: accountsData },
      { data: songsData },
      { data: plStatsData },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('playlists').select('*').eq('user_id', userId).order('sort_order'),
      supabase.from('categories').select('*').eq('user_id', userId).order('sort_order'),
      supabase.from('settings').select('*').eq('user_id', userId).single(),
      supabase.from('platform_accounts').select('*').eq('user_id', userId),
      supabase.from('stats_songs').select('*').eq('user_id', userId),
      supabase.from('stats_playlists').select('*').eq('user_id', userId),
    ])

    if (profileData) {
      saveProfile({ name: profileData.name, avatar: profileData.avatar, joinedAt: profileData.joined_at })
    }

    if (playlistsData?.length) {
      const mapped = playlistsData.map(p => ({
        id: p.id,
        playlist_id: p.playlist_id,
        platform: p.platform || 'spotify',
        name: p.name,
        url: p.url,
        source: p.source || 'manual',
        category: p.category || '',
        notes: p.notes || '',
        tags: p.tags || [],
        archived: p.archived || false,
        archivedAt: p.archived_at,
        addedAt: p.added_at,
      }))
      savePlaylists(mapped)
    }

    if (categoriesData?.length) {
      saveCategories(categoriesData.map(c => c.name))
    }

    if (settingsData) {
      saveSettings({
        rotation_mode: settingsData.rotation_mode,
        interval_minutes: settingsData.interval_minutes,
        fallback_playlist_id: settingsData.fallback_playlist_id,
        enabled: settingsData.enabled,
        current_playlist_index: settingsData.current_playlist_index,
      })
    }

    if (accountsData?.length) {
      const accs = {}
      accountsData.forEach(a => {
        accs[a.platform] = { username: a.username, profileUrl: a.profile_url, updatedAt: a.updated_at }
      })
      localStorage.setItem('autodj_platform_accounts', JSON.stringify(accs))
    }

    if (songsData?.length || plStatsData?.length) {
      const stats = { songs: {}, playlists: {} }
      songsData?.forEach(s => {
        stats.songs[s.track_uri] = {
          name: s.name,
          artist: s.artist,
          platform: s.platform,
          playlistId: s.playlist_id,
          count: s.total_count,
          lastPlayed: s.last_played_at,
          dailyCounts: s.daily_counts || {},
        }
      })
      plStatsData?.forEach(p => {
        stats.playlists[p.playlist_id] = {
          name: p.name,
          count: p.total_count,
          lastPlayed: p.last_played_at,
        }
      })
      localStorage.setItem('autodj_stats', JSON.stringify(stats))
    }
  } catch {
    // Non-fatal — user keeps working with localStorage
  }
}

// ─── Push: localStorage → Supabase ──────────────────────────────────────────

export async function pushToSupabase(userId) {
  if (!userId) return
  try {
    const profile = getProfile()
    const playlists = getPlaylists()
    const categories = getCategories()
    const settings = getSettings()
    const accounts = getPlatformAccounts()
    const stats = getStats()
    const log = getActivityLog().slice(0, 200)

    const ops = []

    // Profile
    if (profile.name || profile.avatar) {
      ops.push(supabase.from('profiles').upsert({
        id: userId,
        name: profile.name,
        avatar: profile.avatar,
        joined_at: profile.joinedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    }

    // Playlists
    if (playlists.length) {
      const rows = playlists.map((p, i) => ({
        id: p.id,
        user_id: userId,
        playlist_id: p.playlist_id,
        platform: p.platform || 'spotify',
        name: p.name,
        url: p.url || null,
        source: p.source || 'manual',
        category: p.category || '',
        notes: p.notes || '',
        tags: p.tags || [],
        archived: p.archived || false,
        archived_at: p.archivedAt || null,
        sort_order: i,
        added_at: p.addedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      ops.push(supabase.from('playlists').upsert(rows))
    }

    // Categories
    if (categories.length) {
      const rows = categories.map((name, i) => ({ user_id: userId, name, sort_order: i }))
      ops.push(supabase.from('categories').upsert(rows, { onConflict: 'user_id,name' }))
    }

    // Settings
    ops.push(supabase.from('settings').upsert({
      user_id: userId,
      rotation_mode: settings.rotation_mode,
      interval_minutes: settings.interval_minutes,
      fallback_playlist_id: settings.fallback_playlist_id,
      enabled: settings.enabled,
      current_playlist_index: settings.current_playlist_index || 0,
      updated_at: new Date().toISOString(),
    }))

    // Platform accounts
    const accountRows = Object.entries(accounts).map(([platform, data]) => ({
      user_id: userId,
      platform,
      username: data.username,
      profile_url: data.profileUrl,
      updated_at: data.updatedAt || new Date().toISOString(),
    }))
    if (accountRows.length) {
      ops.push(supabase.from('platform_accounts').upsert(accountRows, { onConflict: 'user_id,platform' }))
    }

    // Stats songs
    const songRows = Object.entries(stats.songs || {}).map(([track_uri, s]) => ({
      user_id: userId,
      track_uri,
      name: s.name,
      artist: s.artist,
      platform: s.platform || 'spotify',
      playlist_id: s.playlistId,
      total_count: s.count,
      daily_counts: s.dailyCounts || {},
      last_played_at: s.lastPlayed,
    }))
    if (songRows.length) {
      ops.push(supabase.from('stats_songs').upsert(songRows, { onConflict: 'user_id,track_uri' }))
    }

    // Stats playlists
    const plStatRows = Object.entries(stats.playlists || {}).map(([playlist_id, p]) => ({
      user_id: userId,
      playlist_id,
      name: p.name,
      total_count: p.count,
      last_played_at: p.lastPlayed,
    }))
    if (plStatRows.length) {
      ops.push(supabase.from('stats_playlists').upsert(plStatRows, { onConflict: 'user_id,playlist_id' }))
    }

    // Activity log (insert only — no upsert, deduplicate by id)
    if (log.length) {
      const logRows = log.map(e => ({
        id: e.id,
        user_id: userId,
        type: e.type,
        description: e.description,
        metadata: e.metadata || {},
        created_at: e.timestamp,
      }))
      ops.push(supabase.from('activity_log').upsert(logRows, { ignoreDuplicates: true }))
    }

    await Promise.allSettled(ops)
  } catch {
    // Non-fatal
  }
}

// ─── Wrapped mutations (localStorage + Supabase fire-and-forget) ─────────────

export function addPlaylist(playlist) {
  const result = localAddPlaylist(playlist)
  currentUserId().then(uid => { if (uid) fire(pushPlaylist(uid, playlist, result.length - 1)) })
  return result
}

export function removePlaylist(id) {
  const result = localRemovePlaylist(id)
  currentUserId().then(uid => { if (uid) fire(supabase.from('playlists').delete().eq('id', id).eq('user_id', uid)) })
  return result
}

export function archivePlaylist(id) {
  const result = localArchivePlaylist(id)
  currentUserId().then(uid => { if (uid) fire(supabase.from('playlists').update({ archived: true, archived_at: new Date().toISOString() }).eq('id', id).eq('user_id', uid)) })
  return result
}

export function restorePlaylist(id) {
  const result = localRestorePlaylist(id)
  currentUserId().then(uid => { if (uid) fire(supabase.from('playlists').update({ archived: false, archived_at: null }).eq('id', id).eq('user_id', uid)) })
  return result
}

export function updatePlaylist(id, updates) {
  const result = localUpdatePlaylist(id, updates)
  currentUserId().then(uid => { if (uid) fire(supabase.from('playlists').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', uid)) })
  return result
}

export function reorderPlaylists(orderedIds) {
  const result = localReorderPlaylists(orderedIds)
  currentUserId().then(uid => {
    if (!uid) return
    const updates = orderedIds.map((id, i) => supabase.from('playlists').update({ sort_order: i }).eq('id', id).eq('user_id', uid))
    updates.forEach(p => fire(p))
  })
  return result
}

export function savePlatformAccount(platform, data) {
  localSavePlatformAccount(platform, data)
  currentUserId().then(uid => {
    if (!uid) return
    fire(supabase.from('platform_accounts').upsert({
      user_id: uid,
      platform,
      username: data.username,
      profile_url: data.profileUrl,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' }))
  })
}

export function removePlatformAccount(platform) {
  localRemovePlatformAccount(platform)
  currentUserId().then(uid => { if (uid) fire(supabase.from('platform_accounts').delete().eq('user_id', uid).eq('platform', platform)) })
}

export function saveProfileDB(data) {
  const updated = saveProfile(data)
  currentUserId().then(uid => {
    if (!uid) return
    fire(supabase.from('profiles').upsert({
      id: uid,
      name: updated.name,
      avatar: updated.avatar,
      joined_at: updated.joinedAt,
      updated_at: new Date().toISOString(),
    }))
  })
  return updated
}

export function addCategory(name) {
  const result = localAddCategory(name)
  currentUserId().then(uid => {
    if (!uid) return
    fire(supabase.from('categories').upsert({ user_id: uid, name: name.trim(), sort_order: result.length - 1 }, { onConflict: 'user_id,name' }))
  })
  return result
}

export function removeCategory(name) {
  const result = localRemoveCategory(name)
  currentUserId().then(uid => { if (uid) fire(supabase.from('categories').delete().eq('user_id', uid).eq('name', name)) })
  return result
}

export function recordSongPlay(trackUri, trackName, artistName, playlistId, platform) {
  localRecordSongPlay(trackUri, trackName, artistName, playlistId, platform)
  currentUserId().then(uid => {
    if (!uid) return
    const stats = JSON.parse(localStorage.getItem('autodj_stats') || '{}')
    const s = (stats.songs || {})[trackUri]
    if (!s) return
    fire(supabase.from('stats_songs').upsert({
      user_id: uid,
      track_uri: trackUri,
      name: s.name,
      artist: s.artist,
      platform: s.platform || 'spotify',
      playlist_id: s.playlistId,
      total_count: s.count,
      daily_counts: s.dailyCounts || {},
      last_played_at: s.lastPlayed,
    }, { onConflict: 'user_id,track_uri' }))
  })
}

export function recordPlaylistPlay(playlistId, playlistName) {
  localRecordPlaylistPlay(playlistId, playlistName)
  currentUserId().then(uid => {
    if (!uid) return
    const stats = JSON.parse(localStorage.getItem('autodj_stats') || '{}')
    const p = (stats.playlists || {})[playlistId]
    if (!p) return
    fire(supabase.from('stats_playlists').upsert({
      user_id: uid,
      playlist_id: playlistId,
      name: p.name,
      total_count: p.count,
      last_played_at: p.lastPlayed,
    }, { onConflict: 'user_id,playlist_id' }))
  })
}

// ─── Internal helper ─────────────────────────────────────────────────────────

async function pushPlaylist(uid, playlist, sortOrder) {
  await supabase.from('playlists').upsert({
    id: playlist.id,
    user_id: uid,
    playlist_id: playlist.playlist_id,
    platform: playlist.platform || 'spotify',
    name: playlist.name,
    url: playlist.url || null,
    source: playlist.source || 'manual',
    category: playlist.category || '',
    notes: playlist.notes || '',
    tags: playlist.tags || [],
    archived: false,
    sort_order: sortOrder,
    added_at: playlist.addedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
}
