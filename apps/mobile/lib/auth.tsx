import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { makeTheme, type Theme } from './theme'
import type { Profile } from './shared'

type Ctx = { session: Session | null; profile: Profile | null; loading: boolean; theme: Theme; refreshProfile: () => Promise<void>; signOut: () => Promise<void> }
const AuthCtx = createContext<Ctx>(null as any)
export const useAuth = () => useContext(AuthCtx)
export const useT = () => useContext(AuthCtx).theme

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid?: string) => {
    if (!uid) { setProfile(null); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    // Cuentas desactivadas por el admin → se cierra sesión. Pendientes/rechazadas se mantienen para mostrar su estado.
    if (data && !data.activo && data.estado_cuenta === 'aprobado') { await supabase.auth.signOut(); setProfile(null); return }
    setProfile(data as Profile | null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => { setSession(data.session); await loadProfile(data.session?.user.id); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      // Evita deadlock de supabase-js: no hacer await dentro del callback
      setTimeout(() => loadProfile(s?.user.id), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const theme = useMemo(() => makeTheme(profile ? profile.rol !== 'trabajador' : false), [profile])
  const value = useMemo<Ctx>(() => ({
    session, profile, loading, theme,
    refreshProfile: () => loadProfile(session?.user.id),
    signOut: async () => { await supabase.auth.signOut(); setProfile(null) },
  }), [session, profile, loading, theme, loadProfile])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
