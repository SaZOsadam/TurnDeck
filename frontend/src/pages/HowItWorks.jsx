import { Link } from 'react-router-dom'

const STEPS = [
  {
    step: '01',
    title: 'Add Your Playlists',
    accent: 'text-green-400',
    border: 'border-green-700/40',
    bg: 'bg-green-900/10',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    points: [
      'Paste any playlist URL from Spotify, Apple Music, YouTube Music, Tidal, Pandora, Amazon Music, Deezer, Qobuz, YouTube, or Facebook Music Videos.',
      'TurnDeck detects the platform automatically from the URL.',
      'Add a custom name, category, notes, and tags to stay organised.',
      'Archive playlists you are not actively using to keep your workspace clean.',
    ],
  },
  {
    step: '02',
    title: 'Organise & Tag',
    accent: 'text-blue-400',
    border: 'border-blue-700/40',
    bg: 'bg-blue-900/10',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    points: [
      'Create custom categories like Daily Mission, Comeback Push, Naija Push, or anything that fits your campaign.',
      'Filter your playlist library by platform, category, or search by name.',
      'Add personal notes to remind yourself of a playlist\'s purpose or timing.',
      'Star important playlists for instant access from the top of your library.',
    ],
  },
  {
    step: '03',
    title: 'Play & Track Your Streams',
    accent: 'text-purple-400',
    border: 'border-purple-700/40',
    bg: 'bg-purple-900/10',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    points: [
      'Use the rotation player to cycle through playlists in a structured order.',
      'TurnDeck tracks how many times you have streamed each playlist today, per platform.',
      'Platform stream limits are shown so you know exactly when to stop and switch.',
      'Your daily counts reset automatically each day — no manual clearing needed.',
    ],
  },
  {
    step: '04',
    title: 'Monitor the Charts',
    accent: 'text-orange-400',
    border: 'border-orange-700/40',
    bg: 'bg-orange-900/10',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    points: [
      'Browse live Apple Music and Spotify charts by country — Global, UK, Nigeria, South Korea, Japan, and more.',
      'Switch between songs and albums, and filter by market.',
      'Use the Chart Tracker to log your favourite songs and track their chart positions over time.',
      'YouTube Music charts are coming soon.',
    ],
  },
]

const PLATFORMS = [
  { name: 'Spotify', emoji: '🟢' },
  { name: 'Apple Music', emoji: '🍎' },
  { name: 'YouTube Music', emoji: '▶️' },
  { name: 'YouTube', emoji: '📺' },
  { name: 'Tidal', emoji: '🌊' },
  { name: 'Pandora', emoji: '🎵' },
  { name: 'Amazon Music', emoji: '📦' },
  { name: 'Deezer', emoji: '🎶' },
  { name: 'Qobuz', emoji: '🎼' },
  { name: 'Facebook MV', emoji: '👥' },
]

export default function HowItWorks() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">

      {/* Header */}
      <div>
        <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Guide</p>
        <h1 className="text-3xl font-bold text-white mb-2">How TurnDeck Works</h1>
        <p className="text-gray-400">Everything you need to get the most out of your streaming campaigns.</p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {STEPS.map(s => (
          <div key={s.step} className={`rounded-xl border ${s.border} ${s.bg} p-5`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg} border ${s.border} ${s.accent} flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-widest ${s.accent} opacity-60`}>Step {s.step}</p>
                <h2 className={`text-lg font-bold ${s.accent}`}>{s.title}</h2>
              </div>
            </div>
            <ul className="space-y-2">
              {s.points.map((pt, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300">
                  <span className={`mt-0.5 flex-shrink-0 ${s.accent}`}>›</span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Supported Platforms */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Supported Platforms</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PLATFORMS.map(p => (
            <div key={p.name} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-lg">{p.emoji}</span>
              <span className="text-sm text-gray-300">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* No Account Needed */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex gap-4 items-start">
        <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-1">No account required to get started</p>
          <p className="text-gray-400 text-sm">All your playlists, stats, and settings are saved locally in your browser. Sign in with Google from your Profile to back up data and sync across devices.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pb-4">
        <Link
          to="/profile"
          className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-10 rounded-full text-base transition-colors"
        >
          Get Started
        </Link>
        <p className="text-gray-600 text-xs mt-3">Free. No download. Works in any browser.</p>
      </div>
    </div>
  )
}
