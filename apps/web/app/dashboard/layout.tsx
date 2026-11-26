import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: p } = await sb.from('profiles').select('nombre_completo,rol').eq('id', user.id).single()
  if (!p) redirect('/login')
  return (
    <div className="flex min-h-screen">
      <Sidebar rol={p.rol} nombre={p.nombre_completo || user.email || 'Usuario'} />
      <main className="min-w-0 flex-1 overflow-x-hidden p-6 lg:p-8">{children}</main>
    </div>
  )
}
