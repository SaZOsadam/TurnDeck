import { useState } from 'react'
import AppRoutes from './routes'
import SplashScreen from './components/SplashScreen'
import ConsentPopup from './components/ConsentPopup'

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    if (sessionStorage.getItem('autodj_splashed')) return false
    return true
  })

  const [showConsent, setShowConsent] = useState(() => {
    return !localStorage.getItem('autodj_consent')
  })

  const handleSplashDone = () => {
    sessionStorage.setItem('autodj_splashed', '1')
    setShowSplash(false)
  }

  const handleConsent = () => {
    localStorage.setItem('autodj_consent', '1')
    setShowConsent(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {!showSplash && showConsent && <ConsentPopup onAgree={handleConsent} />}
      <AppRoutes />
    </>
  )
}

export default App
