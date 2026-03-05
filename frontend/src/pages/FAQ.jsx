import { useState } from 'react'

const FAQS = [
  {
    section: 'About TurnDeck',
    items: [
      {
        q: 'What is TurnDeck?',
        a: 'TurnDeck is a free web app built to help music fans and artists organise streaming playlists across multiple platforms in one place. You can bookmark playlists from Spotify, Apple Music, YouTube Music, Tidal, Pandora, Amazon Music, Deezer, Qobuz, YouTube, and Facebook Music Videos, then keep track of your daily stream activity.',
      },
      {
        q: 'What inspired TurnDeck?',
        a: 'TurnDeck was built for passionate fan communities that run coordinated streaming campaigns to support their favourite artists. Streaming smart is not just about playing music, it is about playing it consistently and strategically. TurnDeck gives dedicated fans the tools to stay organised without keeping manual score.',
      },
      {
        q: 'Is TurnDeck free?',
        a: 'Yes, completely free. No subscription, no hidden fees. You do not even need an account to get started — just open it in your browser and go.',
      },
      {
        q: 'Do I need to download anything?',
        a: 'No. TurnDeck runs entirely in your web browser. Open the app on any device and it works immediately.',
      },
    ],
  },
  {
    section: 'Streaming & Charts',
    items: [
      {
        q: 'Why does it matter how many times I stream a song per day?',
        a: 'Streaming platforms have guidelines on how many plays from a single account are recognised per day. TurnDeck helps you stay within those guidelines so every stream you complete has the best chance of being counted.',
      },
      {
        q: 'Will using TurnDeck get my account flagged?',
        a: 'No. TurnDeck does not touch your streaming accounts, does not automate playback, and does not interact with any platform on your behalf. It is purely an organiser and tracker. You still open your streaming app and press play yourself — all activity is genuine human interaction on the platform.',
      },
      {
        q: 'Which platforms does TurnDeck support?',
        a: 'TurnDeck supports all major streaming platforms including Spotify, Apple Music, YouTube Music, YouTube, Tidal, Pandora, Amazon Music, Deezer, Qobuz, and Facebook Music Videos. Platform-specific guidance is available inside the app.',
      },
      {
        q: 'Where can I see my daily stream progress?',
        a: 'The Stats page shows your activity per song and per platform. You will see colour-coded indicators when you are approaching or have reached the recommended daily limit for a given track.',
      },
    ],
  },
  {
    section: 'Using the App',
    items: [
      {
        q: 'How do I add a playlist?',
        a: 'Go to My Playlists and paste any playlist URL from a supported platform. TurnDeck detects the platform automatically. You can also add a category, tags, and notes to stay organised.',
      },
      {
        q: 'Can I group playlists by streaming platform?',
        a: 'Yes. In My Playlists, tap the "By Platform" button in the filter bar to group all your playlists by streaming service. Tap it again to return to your custom order.',
      },
      {
        q: 'What is the Player feature?',
        a: 'The Player page lets you set up a playlist rotation. TurnDeck guides you on which playlist to play next and for how long, helping you stay consistent during long streaming sessions without losing track.',
      },
      {
        q: 'What is the Charts page?',
        a: 'The Charts page shows live music charts across three sources. Apple Music displays top songs and albums via the iTunes chart feed. Spotify shows the Top 50 playlist embed for each market. YouTube Music charts are coming soon. Countries covered include Global, UK, Japan, South Korea, and several African markets including Nigeria, South Africa, Ghana, Kenya, Egypt, and Morocco.',
      },
      {
        q: 'Can I use TurnDeck on my phone?',
        a: 'Yes. TurnDeck is fully responsive and works on any mobile browser.',
      },
    ],
  },
  {
    section: 'Account & Data',
    items: [
      {
        q: 'Do I need an account?',
        a: 'No. Everything works without signing in — your playlists, stats, and settings are saved locally in your browser. If you want to back up your data or use TurnDeck across multiple devices, you can sign in with Google from the Profile page.',
      },
      {
        q: 'What happens to my data if I sign in with Google?',
        a: 'Your playlists, stats, settings, and profile are synced to a secure cloud database tied to your Google account. Only you can see your data. Signing out does not delete your local data — it is still in your browser.',
      },
      {
        q: 'How do I delete my data?',
        a: 'To clear local data, clear your browser storage for this site in your browser settings. To request removal of cloud data, contact us via the Privacy page.',
      },
    ],
  },
]

export default function FAQ() {
  const [openKey, setOpenKey] = useState(null)

  const toggle = (key) => setOpenKey(prev => (prev === key ? null : key))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">FAQ</h1>
        <p className="text-gray-400">Everything you need to know about TurnDeck.</p>
      </div>

      <div className="space-y-10">
        {FAQS.map(section => (
          <div key={section.section}>
            <h2 className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">{section.section}</h2>
            <div className="space-y-2">
              {section.items.map(item => {
                const key = section.section + item.q
                const open = openKey === key
                return (
                  <div key={item.q} className={`bg-gray-800 rounded-xl border transition-colors ${open ? 'border-green-700/50' : 'border-gray-700'}`}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 group"
                    >
                      <span className={`text-sm font-semibold transition-colors ${open ? 'text-green-400' : 'text-white group-hover:text-green-300'}`}>
                        {item.q}
                      </span>
                      <svg
                        className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180 text-green-400' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {open && (
                      <div className="px-5 pb-4">
                        <p className="text-gray-400 text-sm leading-relaxed border-t border-gray-700 pt-3">{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-700 text-center">
        <p className="text-gray-500 text-sm">Still have a question? Visit the <a href="/privacy" className="text-green-400 hover:text-green-300 underline">Privacy page</a> to get in touch.</p>
      </div>
    </div>
  )
}
