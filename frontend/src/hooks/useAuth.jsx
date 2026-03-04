import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, signInWithGoogle as _signIn, signOut as _signOut } from '../services/supabase'
import { syncFromSupabase, pushToSupabase } from '../services/db'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still loading
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setSyncing(true)
        syncFromSupabase(session.user.id).finally(() => setSyncing(false))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        setSyncing(true)
        await syncFromSupabase(u.id)
        setSyncing(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = () => _signIn()

  const signOutUser = async () => {
    await _signOut()
    setUser(null)
  }

  const syncNow = async (userId) => {
    if (!userId) return
    setSyncing(true)
    await pushToSupabase(userId)
    setSyncing(false)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut: signOutUser, syncNow, syncing, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
