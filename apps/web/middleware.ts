import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_ONLY = ['/dashboard/usuarios', '/dashboard/supervisores', '/dashboard/areas', '/dashboard/documentos', '/dashboard/configuracion', '/dashboard/pendientes']

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })
  const redirect = (path: string) => {
    const r = NextResponse.redirect(new URL(path, req.url))
    res.cookies.getAll().forEach((c) => r.cookies.set(c))
    return r
  }
  const { data: { user } } = await supabase.auth.getUser()
  const path = req.nextUrl.pathname

  if (path.startsWith('/dashboard')) {
    if (!user) return redirect('/login')
    const { data: p } = await supabase.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).single()
    // Trabajadores NO pueden usar la web: se cierra la sesión y se muestra aviso
    if (!p || !p.activo || p.rol === 'trabajador') {
      await supabase.auth.signOut()
      return redirect(p?.estado_cuenta === 'pendiente' ? '/login?error=pending' : '/login?error=worker')
    }
    if (p.rol === 'supervisor' && ADMIN_ONLY.some((a) => path.startsWith(a))) return redirect('/dashboard')
  }
  return res
}
export const config = { matcher: ['/dashboard/:path*'] }
