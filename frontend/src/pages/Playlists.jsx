import { useState } from 'react'
import PlaylistCard from '../components/PlaylistCard'
import {
  getPlaylists, getActivePlaylists, getArchivedPlaylists, savePlaylists,
  parsePlaylistInput, fetchPlaylistName,
  updatePlaylist, getCategories, archivePlaylist, restorePlaylist,
  removePlaylist, reorderPlaylists, logActivity, PLATFORM_META,
} from '../services/storage'

export default function Playlists() {
  const [playlists, setPlaylists] = useState(() => getActivePlaylists())
  const [archived, setArchived] = useState(() => getArchivedPlaylists())
  const [categories, setCategories] = useState(() => getCategories())
  const [activeTab, setActiveTab] = useState('active')
  const [activeCategory, setActiveCategory] = useState('All')
  const [link, setLink] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newTags, setNewTags] = useState('')
  const [showAddDetails, setShowAddDetails] = useState(false)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [sortBy, setSortBy] = useState('manual')

  const refresh = () => {
    setPlaylists(getActivePlaylists())
    setArchived(getArchivedPlaylists())
    setCategories(getCategories())
  }

  const handleAddPlaylist = async (e) => {
    e.preventDefault()
    setError('')
    const parsed = parsePlaylistInput(link)
    if (!parsed) {
      setError('Invalid URL. Supported: Spotify & Apple Music playlists and albums, Pandora, YouTube Music, Tidal.')
      return
    }
    const existing = getPlaylists()
    if (existing.some(p => p.playlist_id === parsed.id)) {
      setError('This playlist is already in your list.')
      return
    }
    setAdding(true)
    const realName = await fetchPlaylistName(parsed.id, parsed.platform, parsed.url, parsed.type)
    const parsedTags = newTags.split(',').map(t => t.trim()).filter(Boolean)
    const newPlaylist = {
      id: crypto.randomUUID(),
      playlist_id: parsed.id,
      platform: parsed.platform,
      type: parsed.type || 'playlist',
      url: parsed.url || null,
      name: realName || `Playlist ${parsed.id.slice(0, 8)}...`,
      source: 'manual',
      category: newCategory || '',
      notes: newNotes || '',
      tags: parsedTags,
      addedAt: new Date().toISOString(),
    }
    const updated = [...existing, newPlaylist]
    savePlaylists(updated)
    logActivity('add', `Added playlist: ${newPlaylist.name}`, { playlistId: newPlaylist.id, platform: parsed.platform })
    refresh()
    setLink('')
    setNewCategory('')
    setNewNotes('')
    setNewTags('')
    setShowAddDetails(false)
    setAdding(false)
  }

  const handleArchive = (id) => {
    archivePlaylist(id)
    refresh()
  }

  const handleRestore = (id) => {
    restorePlaylist(id)
    refresh()
  }

  const handleDeletePermanent = (id) => {
    removePlaylist(id)
    refresh()
  }

  const handleEdit = (pl) => {
    setEditTarget(pl)
    setEditForm({
      name: pl.name || '',
      category: pl.category || '',
      notes: pl.notes || '',
      tags: Array.isArray(pl.tags) ? pl.tags.join(', ') : '',
    })
  }

  const handleEditSave = () => {
    if (!editTarget) return
    const parsedTags = editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    updatePlaylist(editTarget.id, {
      name: editForm.name,
      category: editForm.category,
      notes: editForm.notes,
      tags: parsedTags,
    })
    logActivity('edit', `Edited playlist: ${editForm.name}`, { playlistId: editTarget.id })
    refresh()
    setEditTarget(null)
  }

  const handleMoveUp = (idx) => {
    if (idx === 0) return
    const list = [...filtered]
    ;[list[idx - 1], list[idx]] = [list[idx], list[idx - 1]]
    reorderPlaylists(list.map(p => p.id))
    refresh()
  }

  const handleMoveDown = (idx) => {
    if (idx === filtered.length - 1) return
    const list = [...filtered]
    ;[list[idx], list[idx + 1]] = [list[idx + 1], list[idx]]
    reorderPlaylists(list.map(p => p.id))
    refresh()
  }

  const filtered = activeCategory === 'All'
    ? playlists
    : activeCategory === 'Uncategorized'
      ? playlists.filter(p => !p.category)
      : playlists.filter(p => p.category === activeCategory)

  const platformOrder = ['spotify', 'apple_music', 'youtube_music', 'youtube', 'tidal', 'pandora', 'amazon_music', 'deezer', 'qobuz', 'facebook_mv']
  const groupedByPlatform = sortBy === 'platform'
    ? platformOrder
        .map(key => ({ key, meta: PLATFORM_META[key], items: filtered.filter(p => (p.platform || 'spotify') === key) }))
        .filter(g => g.items.length > 0)
    : []

  const hasUncategorized = playlists.some(p => !p.category)

  const platformHint = link ? (() => {
    const p = parsePlaylistInput(link)
    return p ? PLATFORM_META[p.platform] : null
  })() : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">My Playlists</h1>
        <p className="text-gray-400">Bookmark playlists from Spotify, Apple Music, Pandora, YouTube Music & Tidal.</p>
      </div>

      {/* Add Playlist Form */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-6">
        <h2 className="text-lg font-semibold mb-3">Add a Playlist</h2>
        <form onSubmit={handleAddPlaylist} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Paste a playlist URL from any platform…"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm pr-24"
              />
              {platformHint && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-600 text-gray-300">
                  {platformHint.icon} {platformHint.label}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={adding}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddDetails(!showAddDetails)}
            className="text-gray-400 hover:text-white text-xs transition-colors flex items-center gap-1"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${showAddDetails ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            {showAddDetails ? 'Hide details' : 'Add category, notes & tags (optional)'}
          </button>

          {showAddDetails && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500">
                    <option value="">No category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Tags (comma-separated)</label>
                  <input type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. priority, paid tier, 5k target"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Target for 5k Naija streams, updated Mar 1" rows={2}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 resize-none" />
              </div>
            </div>
          )}
        </form>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>

      {/* Active / Archived tabs */}
      <div className="flex gap-1 mb-4 bg-gray-800 rounded-xl p-1 w-fit border border-gray-700">
        <button onClick={() => setActiveTab('active')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'active' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          Active <span className="ml-1 opacity-70">{playlists.length}</span>
        </button>
        <button onClick={() => setActiveTab('archived')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'archived' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          Archived <span className="ml-1 opacity-70">{archived.length}</span>
        </button>
      </div>

      {activeTab === 'active' && (
        <>
          {playlists.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-4 items-center">
              {['All', ...categories, ...(hasUncategorized ? ['Uncategorized'] : [])].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeCategory === cat ? 'bg-green-600 border-green-600 text-white' : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'}`}>
                  {cat}
                  {cat !== 'All' && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {cat === 'Uncategorized' ? playlists.filter(p => !p.category).length : playlists.filter(p => p.category === cat).length}
                    </span>
                  )}
                </button>
              ))}
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setSortBy(s => s === 'platform' ? 'manual' : 'platform')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    sortBy === 'platform' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                  }`}>
                  🎵 By Platform
                </button>
              </div>
            </div>
          )}

          {sortBy === 'platform' ? (
            <div className="space-y-5">
              {groupedByPlatform.length === 0 && (
                <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                  <p className="text-gray-400 mb-1">{activeCategory === 'All' ? 'No playlists yet' : `No playlists in "${activeCategory}"`}</p>
                  <p className="text-gray-500 text-sm">Paste a playlist link above to get started.</p>
                </div>
              )}
              {groupedByPlatform.map(group => (
                <div key={group.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{group.meta?.icon}</span>
                    <h3 className="text-sm font-semibold text-gray-300">{group.meta?.label}</h3>
                    <span className="text-xs text-gray-500 ml-1">{group.items.length}</span>
                    <div className="flex-1 h-px bg-gray-700 ml-2" />
                  </div>
                  <div className="space-y-2">
                    {group.items.map(pl => (
                      <PlaylistCard key={pl.id} playlist={pl} onDelete={handleArchive} onEdit={handleEdit} deleteLabel="Archive" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((pl, idx) => (
                <div key={pl.id} className="flex gap-2 items-start">
                  <div className="flex flex-col gap-1 pt-2">
                    <button onClick={() => handleMoveUp(idx)} disabled={idx === 0}
                      className="text-gray-500 hover:text-white disabled:opacity-20 transition-colors p-0.5" title="Move up">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                    </button>
                    <button onClick={() => handleMoveDown(idx)} disabled={idx === filtered.length - 1}
                      className="text-gray-500 hover:text-white disabled:opacity-20 transition-colors p-0.5" title="Move down">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                  </div>
                  <div className="flex-1">
                    <PlaylistCard playlist={pl} onDelete={handleArchive} onEdit={handleEdit} deleteLabel="Archive" />
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                  <p className="text-gray-400 mb-1">{activeCategory === 'All' ? 'No playlists yet' : `No playlists in "${activeCategory}"`}</p>
                  <p className="text-gray-500 text-sm">Paste a playlist link above to get started.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'archived' && (
        <div className="space-y-3">
          {archived.length === 0 && (
            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
              <p className="text-gray-400">No archived playlists</p>
              <p className="text-gray-500 text-sm mt-1">Archived playlists are saved here and can be restored.</p>
            </div>
          )}
          {archived.map(pl => (
            <div key={pl.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{pl.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {PLATFORM_META[pl.platform || 'spotify']?.icon} {PLATFORM_META[pl.platform || 'spotify']?.label}
                  {pl.archivedAt && ` · Archived ${new Date(pl.archivedAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleRestore(pl.id)}
                  className="text-green-400 hover:text-green-300 text-xs font-medium px-3 py-1.5 bg-green-500/10 rounded-lg transition-colors">
                  Restore
                </button>
                <button onClick={() => handleDeletePermanent(pl.id)}
                  className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 bg-red-500/10 rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditTarget(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Edit Playlist</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500">
                  <option value="">No category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tags (comma-separated)</label>
                <input type="text" value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="e.g. priority, paid tier"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleEditSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors">Save</button>
              <button onClick={() => setEditTarget(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
