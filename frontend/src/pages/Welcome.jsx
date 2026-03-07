import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

function PhoneFrame({ children }) {
  return (
    <div className="w-44 h-80 bg-gray-950 rounded-3xl border-2 border-gray-700 shadow-2xl overflow-hidden flex flex-col mx-auto flex-shrink-0">
      <div className="bg-gray-800 h-5 flex items-center justify-center flex-shrink-0">
        <div className="w-12 h-1 bg-gray-600 rounded-full" />
      </div>
      <div className="flex-1 overflow-hidden bg-gray-900">
        {children}
      </div>
    </div>
  )
}

function MockupPlaylists() {
  return (
    <PhoneFrame>
      <div className="p-2 space-y-1.5">
        <div className="bg-gray-800 rounded p-1.5">
          <p className="text-[8px] text-gray-400 mb-0.5">Paste playlist URL</p>
          <div className="bg-gray-700 rounded px-1.5 py-0.5 text-[8px] text-green-400 truncate">open.spotify.com/playlist/…</div>
        </div>
        {['Morning Mood 🌅', 'Afrobeats 2024 🔥', 'Chill Vibes 🎵', 'Naija Push 🌍'].map(n => (
          <div key={n} className="bg-gray-800 rounded px-1.5 py-1 flex items-center gap-1.5">
            <div className="w-5 h-5 bg-green-900 rounded flex items-center justify-center text-[8px] flex-shrink-0">🎵</div>
            <span className="text-[8px] text-white truncate">{n}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  )
}

function MockupOrganise() {
  return (
    <PhoneFrame>
      <div className="p-2 space-y-1.5">
        <div className="flex gap-1 flex-wrap">
          {[['Daily Mission','bg-green-900/60 text-green-300'],['Push','bg-blue-900/60 text-blue-300'],['Charts','bg-purple-900/60 text-purple-300']].map(([l,c]) => (
            <span key={l} className={`text-[7px] px-1.5 py-0.5 rounded-full ${c}`}>{l}</span>
          ))}
        </div>
        {[['📋','Daily Mission',3],['🚀','Comeback Push',2],['🌍','Naija Push',4]].map(([icon,cat,count]) => (
          <div key={cat} className="bg-gray-800 rounded p-1.5">
            <div className="flex justify-between items-center mb-0.5">
              <p className="text-[8px] text-white">{icon} {cat}</p>
              <span className="text-[7px] text-gray-500">{count}</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({length:count}).map((_,i) => <div key={i} className="h-1 bg-gray-600 rounded flex-1" />)}
            </div>
          </div>
        ))}
      </div>
    </PhoneFrame>
  )
}

function MockupPlay() {
  return (
    <PhoneFrame>
      <div className="p-2 space-y-1.5">
        <div className="bg-green-900/40 border border-green-700/40 rounded p-1.5 text-center">
          <p className="text-[7px] text-green-400 mb-0.5">Now Playing</p>
          <p className="text-[8px] text-white font-medium">Morning Mood 🌅</p>
          <div className="flex justify-center gap-3 mt-1">
            <span className="text-[10px] text-gray-400">⏮</span>
            <span className="text-[10px] text-green-400">⏸</span>
            <span className="text-[10px] text-gray-400">⏭</span>
          </div>
        </div>
        <p className="text-[7px] text-gray-500 uppercase tracking-wide">Today's streams</p>
        {[['Spotify','3 / 5','text-green-400'],['Apple Music','5 / 5','text-red-400'],['YouTube Music','7 / 10','text-yellow-400']].map(([p,c,col]) => (
          <div key={p} className="flex justify-between items-center bg-gray-800 rounded px-1.5 py-0.5">
            <span className="text-[7px] text-gray-400">{p}</span>
            <span className={`text-[7px] font-medium ${col}`}>{c}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  )
}

function MockupCharts() {
  return (
    <PhoneFrame>
      <div className="p-2 space-y-1.5">
        <div className="flex gap-1">
          {[['🍎','bg-red-900/50'],['🎵','bg-green-900/50']].map(([icon,bg]) => (
            <div key={icon} className={`flex-1 py-0.5 rounded text-center text-[9px] ${bg}`}>{icon}</div>
          ))}
        </div>
        {[['#1','Lose Control','▲3'],['#2','APT.','—'],['#3','Die With a Smile','▼1'],['#4','Espresso','▲2']].map(([rank,song,mv]) => (
          <div key={song} className="flex items-center gap-1 bg-gray-800 rounded px-1.5 py-0.5">
            <span className="text-[7px] text-gray-500 w-4">{rank}</span>
            <span className="text-[7px] text-white flex-1 truncate">{song}</span>
            <span className={`text-[7px] ${mv.includes('▲')?'text-green-400':mv.includes('▼')?'text-red-400':'text-gray-500'}`}>{mv}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  )
}

const SLIDES = [
  {
    step: '01',
    title: 'Add Your Playlists',
    desc: 'Paste any playlist URL from Spotify, Apple Music, YouTube Music, Tidal, Pandora and more. TurnDeck saves it instantly.',
    accent: 'text-green-400',
    glow: 'shadow-green-900/30',
    Mockup: MockupPlaylists,
  },
  {
    step: '02',
    title: 'Organise & Tag',
    desc: 'Group playlists into campaigns — Daily Mission, Comeback Push, Naija Push. Stay on top of every streaming goal.',
    accent: 'text-blue-400',
    glow: 'shadow-blue-900/30',
    Mockup: MockupOrganise,
  },
  {
    step: '03',
    title: 'Play & Track Streams',
    desc: 'Cycle through your rotation. TurnDeck tracks your daily stream count per platform so you never over-stream.',
    accent: 'text-purple-400',
    glow: 'shadow-purple-900/30',
    Mockup: MockupPlay,
  },
  {
    step: '04',
    title: 'Monitor the Charts',
    desc: 'Live Apple Music and Spotify charts by country. Track your favourite songs on the Chart Tracker.',
    accent: 'text-orange-400',
    glow: 'shadow-orange-900/30',
    Mockup: MockupCharts,
  },
]

export default function Welcome() {
  const [slide, setSlide] = useState(0)
  const touchStartX = useRef(null)

  const prev = () => setSlide(i => (i - 1 + SLIDES.length) % SLIDES.length)
  const next = () => setSlide(i => (i + 1) % SLIDES.length)

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = e => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev()
    touchStartX.current = null
  }

  const s = SLIDES[slide]

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold mb-3 font-brand">TurnDeck</h1>
          <p className="text-gray-400 mb-8 text-lg">Your streaming playlist organiser. Bookmark, tag, and quick-access playlists from any platform in one place.</p>

          <Link
            to="/profile"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-10 rounded-full text-lg transition-colors mb-10 w-full sm:w-auto text-center"
          >
            Get Started
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-green-400 font-semibold mb-1">Bookmark Playlists</p>
              <p className="text-gray-400 text-sm">Paste any streaming playlist URL to save it. Auto-fetches the name.</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-green-400 font-semibold mb-1">Organize & Tag</p>
              <p className="text-gray-400 text-sm">Add categories, notes, and tags. Daily Mission, Comeback Push, Naija Push, and more.</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-green-400 font-semibold mb-1">Quick Access</p>
              <p className="text-gray-400 text-sm">Open any playlist in the built-in player or launch directly in your streaming app.</p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── How it Works Carousel ── */}
      <section className="py-16 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-sm mx-auto">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest text-center mb-1">How it Works</p>
          <h2 className="text-2xl font-bold text-center mb-10">Four simple steps</h2>

          {/* Slide */}
          <div
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="select-none"
          >
            {/* Step label */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-4xl font-bold font-brand opacity-30 ${s.accent}`}>{s.step}</span>
              <h3 className={`text-xl font-bold ${s.accent}`}>{s.title}</h3>
            </div>

            {/* Mockup */}
            <div className={`mb-5 shadow-2xl ${s.glow}`}>
              <s.Mockup />
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm text-center leading-relaxed">{s.desc}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={prev} className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)}
                  className={`rounded-full transition-all duration-300 ${i === slide ? 'w-5 h-2 bg-green-400' : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'}`}
                />
              ))}
            </div>

            <button onClick={next} className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* View More */}
          <div className="mt-10 text-center">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold text-sm transition-colors group"
            >
              View full guide
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
