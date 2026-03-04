const FAQS = [
  {
    section: 'About TurnDeck',
    items: [
      {
        q: 'What is TurnDeck?',
        a: 'TurnDeck is a free web app built to help music fans and artists organise streaming playlists across multiple platforms in one place. You can bookmark playlists from Spotify, Apple Music, YouTube Music, Tidal, Pandora, Amazon Music, Deezer, Qobuz, YouTube, and Facebook Music Videos — then track your daily stream counts to make sure every play counts.',
      },
      {
        q: 'What inspired TurnDeck?',
        a: 'TurnDeck was built for the passionate fan communities that run coordinated streaming campaigns to support their favourite artists. Streaming smart is not just about playing music — it is about playing it in a way that the charts actually register. Dedicated fan bases already know the rules; TurnDeck gives them the tools to follow them without keeping manual score.',
      },
      {
        q: 'Is TurnDeck free?',
        a: 'Yes, completely free. No subscription, no hidden fees. You do not even need an account to get started — just open it in your browser and go.',
      },
      {
        q: 'Do I need to download anything?',
        a: 'No. TurnDeck runs entirely in your web browser. Open deck-turntable.netlify.app on any device and it works immediately.',
      },
    ],
  },
  {
    section: 'Streaming & Charts',
    items: [
      {
        q: 'Why does it matter how many times I stream a song per day?',
        a: 'Streaming platforms have limits on how many plays from a single account count toward chart calculations each day. Streams above that threshold still play — but they may not add to the chart total. TurnDeck tracks your daily count per song and warns you before you hit that limit so none of your effort goes to waste.',
      },
      {
        q: 'Will using TurnDeck get my account flagged for bot activity?',
        a: 'No. TurnDeck does not touch your streaming accounts, does not automate playback, and does not interact with any platform on your behalf. It is purely an organiser and tracker — you still open the actual streaming app and press play yourself. All human interaction happens on the platform, as required.',
      },
      {
        q: 'Which platforms count toward music charts?',
        a: 'TurnDeck tracks streams from all major chart-eligible platforms: Spotify, Apple Music, YouTube Music, YouTube, Tidal, Pandora (US/PR), Amazon Music, Deezer, Qobuz, and Facebook Music Videos (US/PR). Each platform has its own daily stream limit shown in the Stats page.',
      },
      {
        q: 'What are the daily stream limits?',
        a: 'Limits vary by platform. As a general guide: Spotify, Apple Music, Amazon Music, Tidal, and Qobuz are around 5 streams per song per day. YouTube and YouTube Music are around 10. Pandora and Facebook MV (US/PR only) are also around 10. TurnDeck shows warnings before you reach each limit. These are conservative estimates based on known chart methodology — always check current official chart rules for your target chart.',
      },
    ],
  },
  {
    section: 'Using the App',
    items: [
      {
        q: 'How do I add a playlist?',
        a: 'Go to My Playlists and paste any playlist URL from a supported platform. TurnDeck detects the platform automatically and fetches the playlist name. You can also add a category, tags, and notes to stay organised.',
      },
      {
        q: 'Can I group playlists by streaming platform?',
        a: 'Yes. In My Playlists, tap the "By Platform" button in the filter bar to group all your playlists by streaming service. Tap it again to go back to your custom order.',
      },
      {
        q: 'What is the Player / Rotation feature?',
        a: 'The Player page lets you set up a playlist rotation — TurnDeck will tell you which playlist to play next and for how long. This helps during long streaming sessions so you do not forget to switch playlists or platforms.',
      },
      {
        q: 'Where are my stats?',
        a: 'The Stats page shows your top songs and playlists by play count, daily stream counts per song, and platform breakdowns. You can filter by platform and see which songs are approaching or over the daily safe limit.',
      },
      {
        q: 'Can I use TurnDeck on my phone?',
        a: 'Yes. TurnDeck is fully responsive and works on mobile browsers. Open deck-turntable.netlify.app in Safari, Chrome, or any mobile browser.',
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
        a: 'To clear local data, clear your browser storage for this site in your browser settings. To remove cloud data, open an issue on the TurnDeck GitHub repo and we will delete your records on request.',
      },
    ],
  },
]

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">FAQ</h1>
        <p className="text-gray-400">Everything you need to know about TurnDeck.</p>
      </div>

      <div className="space-y-10">
        {FAQS.map(section => (
          <div key={section.section}>
            <h2 className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-4">{section.section}</h2>
            <div className="space-y-4">
              {section.items.map(item => (
                <div key={item.q} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                  <p className="text-white font-semibold mb-2">{item.q}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-700 text-center">
        <p className="text-gray-500 text-sm">Still have a question? Open an issue on the{' '}
          <a href="https://github.com/SaZOsadam/TurnDeck" target="_blank" rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 underline">TurnDeck GitHub repo</a>.
        </p>
      </div>
    </div>
  )
}
