'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brand } from '@/components/ui'

const MSG_PENDING = 'Tu cuenta está pendiente de aprobación por un administrador.'
const MSG_WORKER = 'Acceso exclusivo para administradores y supervisores. Utiliza la aplicación móvil SST 360.'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState<string | null>(params.get('error') === 'worker' ? MSG_WORKER : params.get('error') === 'pending' ? MSG_PENDING : null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true)
    const sb = createClient()
    let email = user.trim()
    if (!email.includes('@')) {
      const { data } = await sb.rpc('email_por_codigo', { p_codigo: email })
      if (!data) { setLoading(false); return setErr('Usuario o contraseña incorrectos.') }
      email = data as string
    }
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass })
    if (error || !data.user) { setLoading(false); return setErr('Usuario o contraseña incorrectos.') }
    const { data: p } = await sb.from('profiles').select('rol,activo,estado_cuenta').eq('id', data.user.id).single()
    if (!p || !p.activo || p.rol === 'trabajador') {
      await sb.auth.signOut(); setLoading(false)
      return setErr(p?.estado_cuenta === 'pendiente' ? MSG_PENDING : p?.estado_cuenta === 'rechazado' ? 'Tu solicitud de cuenta fue rechazada.' : p && !p.activo ? 'Tu cuenta está desactivada. Contacta al administrador.' : MSG_WORKER)
    }
    router.replace('/dashboard'); router.refresh()
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
      <div className="mb-8 flex justify-center"><Brand size={40} /></div>
      <h1 className="mb-1 text-center text-lg font-semibold">Panel de administración</h1>
      <p className="mb-6 text-center text-sm text-mute">Ingresa con tu correo o ID de usuario</p>
      <label className="mb-1 block text-sm text-mute" htmlFor="u">Correo o ID</label>
      <input id="u" className="input mb-4" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" required />
      <label className="mb-1 block text-sm text-mute" htmlFor="p">Contraseña</label>
      <input id="p" type="password" className="input mb-4" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required />
      {err && <p role="alert" className="mb-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{err}</p>}
      <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Ingresando…' : 'Iniciar sesión'}</button>
    </form>
  )
}
export default function LoginPage() {
  return (<main className="flex min-h-screen items-center justify-center p-4"><Suspense><LoginForm /></Suspense></main>)
}
