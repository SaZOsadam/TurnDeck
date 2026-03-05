import { useState, useEffect, useCallback } from 'react'

const SPOTIFY_TOP50 = {
  us: '37i9dQZEVXbMDoHDwVN2tF',
  gb: '37i9dQZEVXbLnolsZ8PSNw',
  jp: '37i9dQZEVXbKXQ4mDTEBXq',
  kr: '37i9dQZEVXbNxXF4SkHj9F',
  ng: '37i9dQZEVXbKY7jLzlJ11V',
  za: '37i9dQZEVXbMH2jvi6jvjk',
  gh: '37i9dQZEVXbKqiTGXuCOsB',
  ke: '37i9dQZEVXbLJ0paT1JkgZ',
  eg: '37i9dQZEVXbLn7RQmT5fbi',
  ma: null,
}

const SPOTIFY_CHARTS_CC = {
  us: 'global', gb: 'gb', jp: 'jp', kr: 'kr',
  ng: 'ng', za: 'za', gh: 'gh', ke: 'ke', eg: 'eg', ma: 'ma',
}

const YOUTUBE_CHART_CC = {
  us: 'US', gb: 'GB', jp: 'JP', kr: 'KR',
  ng: 'NG', za: 'ZA', gh: 'GH', ke: 'KE', eg: 'EG', ma: 'MA',
}

const COUNTRIES = [
  { group: 'Global',
    items: [
      { cc: 'us', label: 'Global / US', flag: '�' },
    ]
  },
  { group: 'Major Markets',
    items: [
      { cc: 'gb', label: 'United Kingdom', flag: '🇬�' },
      { cc: 'jp', label: 'Japan', flag: '��' },
      { cc: 'kr', label: 'South Korea', flag: '��' },
    ]
  },
  { group: 'Africa',
    items: [
      { cc: 'ng', label: 'Nigeria', flag: '��' },
      { cc: 'za', label: 'South Africa', flag: '��' },
      { cc: 'gh', label: 'Ghana', flag: '��' },
      { cc: 'ke', label: 'Kenya', flag: '��' },
      { cc: 'eg', label: 'Egypt', flag: '��' },
      { cc: 'ma', label: 'Morocco', flag: '��' },
    ]
  },
]

const ALL_COUNTRIES = COUNTRIES.flatMap(g => g.items)

function parseEntries(data) {
  try {
    return (data?.feed?.entry || []).map((e, i) => ({
      rank: i + 1,
      name: e['im:name']?.label || 'Unknown',
      artist: e['im:artist']?.label || 'Unknown',
      image: e['im:image']?.[2]?.label || e['im:image']?.[1]?.label || e['im:image']?.[0]?.label || null,
      link: e?.link?.attributes?.href || e?.id?.label || '#',
    }))
  } catch {
    return []
  }
}

const SOURCES = [
  { id: 'apple', label: 'Apple Music', color: 'text-pink-400' },
  { id: 'spotify', label: 'Spotify', color: 'text-green-400' },
  { id: 'youtube', label: 'YouTube', color: 'text-red-400' },
]

export default function Charts() {
  const [selectedCC, setSelectedCC] = useState('us')
  const [source, setSource] = useState('apple')
  const [chartType, setChartType] = useState('topsongs')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetched, setLastFetched] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentCountry = ALL_COUNTRIES.find(c => c.cc === selectedCC) || ALL_COUNTRIES[0]

  const fetchChart = useCallback(async (cc, type) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/.netlify/functions/charts?cc=${cc}&type=${type}&limit=50`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const parsed = parseEntries(data)
      if (parsed.length === 0) throw new Error('No chart data available for this country.')
      setEntries(parsed)
      setLastFetched(new Date())
    } catch (err) {
      setError(err.message)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (source === 'apple') fetchChart(selectedCC, chartType)
  }, [selectedCC, chartType, source, fetchChart])

  const handleCountrySelect = (cc) => {
    setSelectedCC(cc)
    setSidebarOpen(false)
  }

  const spotifyPlaylistId = SPOTIFY_TOP50[selectedCC]
  const spotifyChartsCC = SPOTIFY_CHARTS_CC[selectedCC]
  const spotifyChartsUrl = spotifyChartsCC
    ? `https://charts.spotify.com/charts/view/regional-${spotifyChartsCC}-daily/latest`
    : 'https://charts.spotify.com'
  const youtubeChartsCC = YOUTUBE_CHART_CC[selectedCC]
  const youtubeChartsUrl = youtubeChartsCC
    ? `https://charts.youtube.com/charts/TopSongs/${youtubeChartsCC}`
    : 'https://charts.youtube.com'

  return (
    <div className="flex h-full min-h-screen bg-gray-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Country sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-30 h-[100dvh] lg:h-auto w-56 bg-gray-800 border-r border-gray-700 flex-shrink-0 flex flex-col transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-3 py-3 border-b border-gray-700 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Country</p>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          {COUNTRIES.map(group => (
            <div key={group.group} className="mb-2">
              <p className="px-3 py-1 text-xs text-gray-500 font-medium uppercase tracking-wide">{group.group}</p>
              {group.items.map(c => (
                <button key={c.cc} onClick={() => handleCountrySelect(c.cc)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors ${
                    selectedCC === c.cc
                      ? 'bg-green-900/40 text-green-400 border-l-2 border-green-500'
                      : 'text-gray-300 hover:bg-gray-700/50 border-l-2 border-transparent'
                  }`}>
                  <span className="text-base">{c.flag}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg border border-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              {currentCountry.flag} {currentCountry.label}
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {source === 'apple' && (lastFetched
                ? `Apple Music · Updated ${lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Apple Music · Loading...')}
              {source === 'spotify' && 'Spotify · Top 50 Playlist'}
              {source === 'youtube' && 'YouTube Music · Coming Soon'}
            </p>
          </div>
          {source === 'apple' && (
            <button onClick={() => fetchChart(selectedCC, chartType)} disabled={loading}
              className="text-gray-400 hover:text-white p-2 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-40 flex-shrink-0"
              title="Refresh">
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          )}
        </div>

        {/* Source tabs */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700 mb-4 w-fit overflow-x-auto no-scrollbar">
          {SOURCES.map(s => (
            <button key={s.id} onClick={() => setSource(s.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                source === s.id
                  ? s.id === 'apple' ? 'bg-pink-600 text-white'
                  : s.id === 'spotify' ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Apple Music: chart type sub-toggle */}
        {source === 'apple' && (
          <div className="flex gap-1 bg-gray-800/60 rounded-lg p-1 border border-gray-700/50 mb-4 w-fit">
            {[{ v: 'topsongs', label: 'Top Songs' }, { v: 'topalbums', label: 'Top Albums' }].map(t => (
              <button key={t.v} onClick={() => setChartType(t.v)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  chartType === t.v ? 'bg-pink-600/80 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── APPLE MUSIC panel ── */}
        {source === 'apple' && (
          <>
            {loading && (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-3 flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-4 bg-gray-700 rounded" />
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {error && !loading && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-6 text-center">
                <p className="text-red-400 font-medium mb-1">Chart unavailable</p>
                <p className="text-gray-400 text-sm">{error}</p>
                <p className="text-gray-500 text-xs mt-2">Apple Music charts may not be available for this country.</p>
              </div>
            )}
            {!loading && !error && entries.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-700/50">
                  {entries.map((entry) => (
                    <a key={entry.rank} href={entry.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/40 transition-colors group">
                      <span className={`w-7 text-right text-sm font-mono flex-shrink-0 ${entry.rank <= 3 ? 'text-yellow-400 font-bold' : 'text-gray-500'}`}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}`}
                      </span>
                      {entry.image ? (
                        <img src={entry.image} alt="" className="w-10 h-10 rounded-lg flex-shrink-0 object-cover" loading="lazy" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-gray-700 flex items-center justify-center text-gray-500 text-xs">♪</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate group-hover:text-pink-400 transition-colors">{entry.name}</p>
                        <p className="text-gray-400 text-xs truncate">{entry.artist}</p>
                      </div>
                      <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="text-gray-600 text-xs mt-4 text-center">Apple Music via iTunes RSS · updates daily · tap to open in Apple Music</p>
          </>
        )}

        {/* ── SPOTIFY panel ── */}
        {source === 'spotify' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <a href={spotifyChartsUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                View {currentCountry.label} Charts on Spotify
              </a>
              <span className="text-gray-500 text-xs">Opens Spotify Charts in a new tab</span>
            </div>

            {spotifyPlaylistId ? (
              <div>
                <p className="text-gray-400 text-xs mb-2">Top 50 Playlist — tracks listed in chart order</p>
                <div className="rounded-xl overflow-hidden border border-gray-700">
                  <iframe
                    key={spotifyPlaylistId}
                    src={`https://open.spotify.com/embed/playlist/${spotifyPlaylistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="500"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={`Spotify Top 50 - ${currentCountry.label}`}
                  />
                </div>
                <p className="text-gray-600 text-xs mt-2 text-center">Embedded Spotify Top 50 playlist · sign in to Spotify for full playback</p>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
                <p className="text-gray-400 text-sm mb-1">No embedded playlist available for this country.</p>
                <p className="text-gray-500 text-xs">Use the button above to view charts directly on Spotify.</p>
              </div>
            )}
          </div>
        )}

        {/* ── YOUTUBE panel ── */}
        {source === 'youtube' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <a href={youtubeChartsUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                View {currentCountry.label} Charts on YouTube
              </a>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
              <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg">YouTube Charts — Coming Soon</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
