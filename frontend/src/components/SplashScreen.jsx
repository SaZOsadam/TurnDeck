import { useEffect, useState } from 'react'
import logo from '/faviconv2.png'

function playDJIntro() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    const play = (type, freq, start, dur, gainVal = 0.25) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur + 0.05)
    }

    // Vinyl wind-up sweep
    const sweep = ctx.createOscillator()
    const sweepGain = ctx.createGain()
    sweep.connect(sweepGain)
    sweepGain.connect(ctx.destination)
    sweep.type = 'sawtooth'
    sweep.frequency.setValueAtTime(80, ctx.currentTime)
    sweep.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.35)
    sweepGain.gain.setValueAtTime(0.18, ctx.currentTime)
    sweepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    sweep.start(ctx.currentTime)
    sweep.stop(ctx.currentTime + 0.4)

    // Punchy bass hit
    play('sine', 120, 0.3, 0.25, 0.4)
    play('sine', 80, 0.32, 0.3, 0.3)

    // Rising chord: root, third, fifth
    play('triangle', 330, 0.5, 0.35, 0.2)
    play('triangle', 415, 0.58, 0.32, 0.2)
    play('triangle', 495, 0.66, 0.3, 0.2)

    // Final accent sting
    play('sine', 880, 0.75, 0.25, 0.25)
    play('sine', 1100, 0.82, 0.2, 0.2)
    play('sine', 1320, 0.9, 0.35, 0.3)
  } catch { /* silent fail */ }
}

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const [zooming, setZooming] = useState(false)

  useEffect(() => {
    playDJIntro()
    const inTimer = setTimeout(() => setVisible(true), 50)
    const outTimer = setTimeout(() => { setFading(true); setZooming(true) }, 2200)
    const doneTimer = setTimeout(() => onDone(), 2750)
    return () => {
      clearTimeout(inTimer)
      clearTimeout(outTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center gap-6 transition-all duration-500 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <img
          src={logo}
          alt="TurnDeck"
          className="w-36 h-36 rounded-2xl shadow-2xl splash-logo"
          style={{
            transform: zooming ? 'scale(6)' : 'scale(1)',
            transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white tracking-tight font-brand">
            Turn<span className="text-green-400">Deck</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 tracking-widest uppercase">Streaming Playlist Organiser</p>
        </div>
        <div className="flex gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-green-400 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
