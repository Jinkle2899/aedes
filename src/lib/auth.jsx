import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, cloudEnabled } from './supabase.js'

const AuthCtx = createContext({ session: null, ready: true })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!cloudEnabled)

  useEffect(() => {
    if (!cloudEnabled) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return <AuthCtx.Provider value={{ session, ready }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
}
