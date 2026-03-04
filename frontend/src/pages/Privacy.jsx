export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Overview</h2>
          <p>
            TurnDeck is a web app for bookmarking, organising, and rotating streaming playlists across multiple platforms.
            Your privacy matters. This page explains what data TurnDeck stores, where it is kept, and how it is used.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Data We Collect</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li><strong className="text-gray-300">Profile info</strong>: display name and avatar emoji you set in the app.</li>
            <li><strong className="text-gray-300">Playlist library</strong>: playlist IDs, names, URLs, categories, tags, and notes.</li>
            <li><strong className="text-gray-300">Play statistics</strong>: play counts per song and playlist, including daily stream counts.</li>
            <li><strong className="text-gray-300">Platform account links</strong>: profile URLs or usernames you optionally add for each streaming service.</li>
            <li><strong className="text-gray-300">App settings</strong>: rotation mode, interval, and other preferences.</li>
            <li><strong className="text-gray-300">Google account info</strong>: if you sign in with Google, we store your Google user ID, email address, and display name to identify your cloud account. We do not store your Google password.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Data Storage</h2>
          <p>
            TurnDeck stores data in two places depending on whether you are signed in:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2">
            <li><strong className="text-gray-300">Browser localStorage</strong>: all data is always saved locally in your browser. This works without an account and is never shared.</li>
            <li><strong className="text-gray-300">Supabase cloud (signed-in users only)</strong>: if you sign in with Google, your data is also synced to a secure Supabase database so you can access it across devices. Your data is tied to your account and is not visible to other users.</li>
          </ul>
          <p className="mt-2">
            If you sign out or never sign in, only your local browser data is used. No cloud data is written.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Google Authentication</h2>
          <p>
            TurnDeck uses Google OAuth via Supabase for optional sign-in. When you sign in with Google, Google shares your name, email address, and profile picture with us to create and identify your account. We do not access your Google contacts, Drive, Gmail, or any other Google services. You can sign out at any time from your Profile page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Third-Party Streaming Services</h2>
          <p>
            TurnDeck integrates with the following streaming platforms via official embed players. When you use an embedded player, that platform's own privacy policy applies. TurnDeck does not access your streaming account credentials or login details.
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2">
            <li>Spotify</li>
            <li>Apple Music</li>
            <li>YouTube Music</li>
            <li>YouTube</li>
            <li>Tidal</li>
            <li>Pandora</li>
            <li>Amazon Music</li>
            <li>Deezer</li>
            <li>Qobuz</li>
            <li>Facebook Music Videos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Cookies</h2>
          <p>
            TurnDeck itself does not use tracking cookies. Supabase may set session cookies to keep you signed in. Embedded players from streaming platforms may also set their own cookies as part of their service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Data Deletion</h2>
          <p>
            To delete your local data, clear your browser's localStorage for this site. To delete your cloud data, sign in and contact us via the GitHub repo below, and we will remove your Supabase records on request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Contact</h2>
          <p>
            If you have questions about this privacy policy, open an issue on the
            <a href="https://github.com/SaZOsadam/TurnDeck" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline ml-1">
              TurnDeck GitHub repo
            </a>.
          </p>
        </section>

        <div className="pt-4 border-t border-gray-700">
          <p className="text-gray-500 text-sm">Last updated: March 2026</p>
        </div>
      </div>
    </div>
  )
}
