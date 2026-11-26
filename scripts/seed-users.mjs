// Crea usuarios demo + datos de ejemplo. Requiere Node 18+ y: npm i @supabase/supabase-js (en la raíz o en apps/web)
// Uso (PowerShell):  $env:SUPABASE_URL="https://xxx.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; node scripts/seed-users.mjs
// Uso (bash):        SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-users.mjs
import { createClient } from '@supabase/supabase-js'
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const PASS = 'Sst360!Demo'

const { data: areas } = await sb.from('areas').select('id,nombre')
const area = (n) => areas.find((a) => a.nombre === n)?.id
if (!areas?.length) { console.error('Ejecuta primero seed.sql (áreas y catálogo).'); process.exit(1) }

async function crear(email, nombre, rol, codigo) {
  const { data, error } = await sb.auth.admin.createUser({
    email, password: PASS, email_confirm: true,
    user_metadata: { nombre_completo: nombre, codigo_trabajador: codigo },
    app_metadata: { rol },
  })
  if (error) {
    if (/already/i.test(error.message)) {
      const { data: p } = await sb.from('profiles').select('id').eq('email', email).single()
      console.log('· ya existía', email); return p.id
    }
    throw error
  }
  console.log('✓ creado', email, `(${rol})`); return data.user.id
}

const adminId = await crear('admin@sst360.test', 'Ana Administradora', 'administrador', 'ADM001')
const supId = await crear('supervisor@sst360.test', 'Carlos Ruiz', 'supervisor', 'SUP001')
const w = []
w.push(await crear('juan@sst360.test', 'Juan Pérez', 'trabajador', '88402'))
w.push(await crear('maria@sst360.test', 'María Gómez', 'trabajador', '88403'))
w.push(await crear('luis@sst360.test', 'Luis Torres', 'trabajador', '88404'))

await sb.from('profiles').update({ area_id: area('Operaciones') }).in('id', [supId, adminId])
for (const id of w) await sb.from('profiles').update({ area_id: area('Operaciones'), supervisor_id: supId }).eq('id', id)

// Datos de ejemplo
const { data: epp } = await sb.from('epp_catalogo').select('id,nombre,vida_util_dias')
for (const id of w) for (const nom of ['Casco de seguridad', 'Botas de seguridad', 'Chaleco reflectivo']) {
  const e = epp.find((x) => x.nombre === nom)
  const venc = new Date(Date.now() + e.vida_util_dias * 864e5).toISOString().slice(0, 10)
  await sb.from('epp_asignaciones').insert({ trabajador_id: id, epp_id: e.id, fecha_vencimiento: venc })
}
const d = (n) => new Date(Date.now() + n * 864e5).toISOString()
const { data: caps } = await sb.from('capacitaciones').insert([
  { titulo: 'Uso correcto de EPP', descripcion: 'Charla práctica', fecha_programada: d(3), creado_por: supId },
  { titulo: 'Prevención de incendios', descripcion: 'Uso de extintores', fecha_programada: d(10), creado_por: supId },
  { titulo: 'Primeros auxilios', descripcion: 'Básico', fecha_programada: d(-20), creado_por: supId },
]).select()
for (const id of w) for (const c of caps) await sb.from('capacitacion_asistentes')
  .insert({ capacitacion_id: c.id, trabajador_id: id, estado: c.titulo === 'Primeros auxilios' ? 'completado' : 'inscrito' })
for (const id of w) await sb.from('revisiones_medicas')
  .insert({ trabajador_id: id, tipo_examen: 'Examen médico ocupacional', fecha_programada: d(45).slice(0, 10) })
console.log(`\nListo. Contraseña de todos los usuarios demo: ${PASS}`)
