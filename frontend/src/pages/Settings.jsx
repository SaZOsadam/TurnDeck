import { useState } from 'react'
import { getCategories, addCategory, removeCategory, clearStats } from '../services/storage'

export default function Settings() {
  const [categories, setCategories] = useState(() => getCategories())
  const [newCat, setNewCat] = useState('')
  const [catError, setCatError] = useState('')
  const [message, setMessage] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  const handleAddCategory = (e) => {
    e.preventDefault()
    setCatError('')
    const trimmed = newCat.trim()
    if (!trimmed) { setCatError('Category name cannot be empty.'); return }
    if (categories.includes(trimmed)) { setCatError('Category already exists.'); return }
    const updated = addCategory(trimmed)
    setCategories(updated)
    setNewCat('')
    setMessage(`Category "${trimmed}" added.`)
    setTimeout(() => setMessage(''), 2500)
  }

  const handleRemoveCategory = (cat) => {
    const updated = removeCategory(cat)
    setCategories(updated)
    setMessage(`Category "${cat}" removed. Playlists using it are now uncategorized.`)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleClearStats = () => {
    clearStats()
    setConfirmClear(false)
    setMessage('Play stats cleared.')
    setTimeout(() => setMessage(''), 2500)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-gray-400">Manage categories and app preferences.</p>
      </div>

      {message && (
        <p className="bg-green-900/30 border border-green-700 text-green-400 rounded-lg px-4 py-3 mb-5 text-sm">{message}</p>
      )}

      {/* Category Manager */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-5">
        <h2 className="text-lg font-semibold mb-1">Playlist Categories</h2>
        <p className="text-gray-400 text-sm mb-4">Create and manage categories for organizing your bookmarked playlists.</p>

        {/* Add new category */}
        <form onSubmit={handleAddCategory} className="flex gap-3 mb-4">
          <input
            type="text"
            value={newCat}
            onChange={e => { setNewCat(e.target.value); setCatError('') }}
            placeholder="e.g. Arirang Push, K-charts, Weekend..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500"
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            Add
          </button>
        </form>
        {catError && <p className="text-red-400 text-xs mb-3">{catError}</p>}

        {/* Existing categories */}
        {categories.length > 0 ? (
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-2.5">
                <span className="text-white text-sm font-medium">{cat}</span>
                <button
                  onClick={() => handleRemoveCategory(cat)}
                  className="text-red-400 hover:text-red-300 text-xs transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No categories yet. Add one above.</p>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h2 className="text-lg font-semibold mb-1">Data</h2>
        <p className="text-gray-400 text-sm mb-4">All your data is stored locally in this browser.</p>

        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Clear Play Stats
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-gray-400 text-sm">Are you sure? This cannot be undone.</p>
            <button onClick={handleClearStats} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              Yes, Clear
            </button>
            <button onClick={() => setConfirmClear(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
