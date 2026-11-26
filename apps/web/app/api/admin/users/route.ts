import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Crea usuarios sin cerrar la sesión del administrador. Usa SUPABASE_SERVICE_ROLE_KEY (solo servidor).
export async function POST(req: Request) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { data: me } = await sb.from('profiles').select('rol,activo').eq('id', user.id).single()
  if (!me?.activo || me.rol !== 'administrador') return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  const b = await req.json()
  if (!b.email || !b.password || !b.nombre_completo) return NextResponse.json({ error: 'Correo, contraseña y nombre son obligatorios' }, { status: 400 })
  if (String(b.password).length < 8) return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  const rol = ['trabajador', 'supervisor', 'administrador'].includes(b.rol) ? b.rol : 'trabajador'

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await admin.auth.admin.createUser({
    email: b.email, password: b.password, email_confirm: true,
    user_metadata: { nombre_completo: b.nombre_completo, codigo_trabajador: b.codigo_trabajador || '' },
    app_metadata: { rol },
  })
  if (error || !data.user) return NextResponse.json({ error: error?.message ?? 'No se pudo crear el usuario' }, { status: 400 })

  const { error: e2 } = await admin.from('profiles').update({
    nombre_completo: b.nombre_completo, codigo_trabajador: b.codigo_trabajador || null, telefono: b.telefono || null,
    rol, area_id: b.area_id || null, supervisor_id: b.supervisor_id || null, activo: b.activo !== false,
  }).eq('id', data.user.id)
  if (e2) { await admin.auth.admin.deleteUser(data.user.id); return NextResponse.json({ error: e2.message }, { status: 400 }) }
  return NextResponse.json({ id: data.user.id })
}
