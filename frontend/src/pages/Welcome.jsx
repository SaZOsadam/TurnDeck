import { Link } from 'react-router-dom'

export default function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold mb-3">TurnDeck</h1>
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
    </div>
  )
}
