import { createClient } from '@/lib/supabase/server'
export async function getRole(): Promise<'administrador' | 'supervisor'> {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  const { data } = await sb.from('profiles').select('rol').eq('id', user!.id).single()
  return data?.rol === 'administrador' ? 'administrador' : 'supervisor'
}
