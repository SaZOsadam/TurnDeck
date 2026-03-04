import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getRotationState, getSettings, getPlaylists, getTimerTarget } from '../services/storage'

export default function Navbar() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [rotationActive, setRotationActive] = useState(false)
  const [timerDisplay, setTimerDisplay] = useState(null)

  // Poll rotation state every second for the live indicator
  useEffect(() => {
    const tick = () => {
      const rotation = getRotationState()
      const playlists = getPlaylists()
      const active = rotation.enabled && playlists.length >= 2
      setRotationActive(active)
      if (active) {
        const settings = getSettings()
        if (settings.rotation_mode === 'interval') {
          const target = getTimerTarget()
          if (target) {
            const secs = Math.max(0, Math.round((target - Date.now()) / 1000))
            const m = Math.floor(secs / 60)
            const s = secs % 60
            setTimerDisplay(`${m}:${s.toString().padStart(2, '0')}`)
          } else {
            setTimerDisplay(null)
          }
        } else {
          setTimerDisplay('LIVE')
        }
      } else {
        setTimerDisplay(null)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`transition-colors ${pathname === to ? 'text-green-400 font-semibold' : 'text-gray-300 hover:text-white'}`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-xl font-bold text-green-400">AutoDJ</Link>
          {rotationActive && (
            <Link to="/rotation" className="flex items-center gap-1.5 bg-green-900/40 border border-green-700/50 rounded-full px-2.5 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-green-400 font-mono font-semibold">{timerDisplay || 'ON'}</span>
            </Link>
          )}
        </div>
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/playlists', 'Playlists')}
          {navLink('/settings', 'Settings')}
          {navLink('/rotation', 'Rotation')}
          {navLink('/stats', 'Stats')}
        </div>
        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-300 hover:text-white p-1"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-700 px-4 py-3 flex flex-col gap-3">
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/playlists', 'Playlists')}
          {navLink('/settings', 'Settings')}
          {navLink('/rotation', 'Rotation')}
          {navLink('/stats', 'Stats')}
        </div>
      )}
    </nav>
  )
}
