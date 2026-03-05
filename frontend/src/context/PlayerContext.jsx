import { createContext, useContext, useState } from 'react'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [currentPl, setCurrentPl] = useState(null)
  const [queue, setQueue] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const playPlaylist = (playlist, queueList, index) => {
    setCurrentPl(playlist)
    setQueue(queueList || [playlist])
    setSelectedIndex(index ?? 0)
  }

  const playNext = () => {
    if (!queue.length) return
    const next = (selectedIndex + 1) % queue.length
    setSelectedIndex(next)
    setCurrentPl(queue[next])
  }

  const playPrev = () => {
    if (!queue.length) return
    const prev = (selectedIndex - 1 + queue.length) % queue.length
    setSelectedIndex(prev)
    setCurrentPl(queue[prev])
  }

  const stop = () => {
    setCurrentPl(null)
    setQueue([])
    setSelectedIndex(0)
  }

  return (
    <PlayerContext.Provider value={{ currentPl, queue, selectedIndex, playPlaylist, playNext, playPrev, stop }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  return useContext(PlayerContext)
}
