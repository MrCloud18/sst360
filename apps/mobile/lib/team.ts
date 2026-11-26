import { supabase } from './supabase'
import type { Profile } from './shared'
import { startOfDay } from './format'

// Trabajadores a cargo: supervisor → supervisor_id propio o misma área. Administrador → todos. (RLS refuerza esto en el servidor.)
export async function loadTeam(me: Profile) {
  let q = supabase.from('profiles').select('id,nombre_completo,codigo_trabajador,avatar_url,area_id,supervisor_id,telefono').eq('rol', 'trabajador').eq('activo', true).order('nombre_completo')
  if (me.rol === 'supervisor') q = q.or(`supervisor_id.eq.${me.id}${me.area_id ? `,area_id.eq.${me.area_id}` : ''}`)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function todayStatus() {
  const { data } = await supabase.from('asistencias').select('trabajador_id,tipo,estado,fecha_hora').gte('fecha_hora', startOfDay()).order('fecha_hora', { ascending: true })
  const m: Record<string, { tipo: string; estado: string; fecha_hora: string }> = {}
  ;(data ?? []).forEach((a: any) => { m[a.trabajador_id] = a })      // la última marcación del día gana
  return m
}
export const statusOf = (a?: { tipo: string; estado: string }) =>
  !a ? { text: 'Offline', tone: 'neutral' as const } : a.tipo === 'salida' ? { text: 'Salió', tone: 'info' as const } : a.estado === 'tardanza' ? { text: 'Tarde', tone: 'warn' as const } : { text: 'Activo', tone: 'ok' as const }
