export default function ConsentPopup({ onAgree }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-up">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🎵</span>
            <h2 className="text-xl font-bold">Welcome to TurnDeck</h2>
          </div>
          <p className="text-gray-400 text-sm">Quick heads up before you dive in.</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm text-gray-300">
          <div className="flex gap-3">
            <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
            <p>TurnDeck is a <strong className="text-white">streaming playlist organiser</strong>. It helps you bookmark and access playlists from any platform.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
            <p>All your data (playlists, categories, notes) is stored <strong className="text-white">locally on your device</strong> using browser storage. Nothing is sent to a server.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
            <p>Playback uses <strong className="text-white">official embed players</strong> from each platform. You need an account on the platform to play full tracks.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-400 mt-0.5 flex-shrink-0">⚠</span>
            <p>TurnDeck is for <strong className="text-white">personal, non-commercial use only</strong> in compliance with each platform's Terms of Service.</p>
          </div>

          <p className="text-gray-500 text-xs pt-1">
            By tapping below you agree to our{' '}
            <a href="/privacy" onClick={onAgree} className="text-green-400 hover:underline">
              Privacy Policy
            </a>.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6">
          <button
            onClick={onAgree}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Got it, let's go
          </button>
        </div>
      </div>
    </div>
  )
}
