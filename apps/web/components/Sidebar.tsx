'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, HardHat, Building2, GraduationCap, Stethoscope, AlertTriangle, ClipboardList, BarChart3, FileText, Bell, MessageSquare, Settings, LogOut, UserCog, ShieldCheck, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Brand } from './ui'

const NAV = [
  { href: '/dashboard', label: 'Panel General', icon: LayoutDashboard, roles: ['administrador', 'supervisor'] },
  { href: '/dashboard/usuarios', label: 'Usuarios y Roles', icon: ShieldCheck, roles: ['administrador'] },
  { href: '/dashboard/pendientes', label: 'Cuentas pendientes', icon: UserCheck, roles: ['administrador'] },
  { href: '/dashboard/trabajadores', label: 'Trabajadores', icon: Users, roles: ['administrador', 'supervisor'] },
  { href: '/dashboard/supervisores', label: 'Supervisores', icon: UserCog, roles: ['administrador'] },
  { href: '/dashboard/areas', label: 'Áreas', icon: Building2, roles: ['administrador'] },
  { href: '/dashboard/epp', label: 'Catálogo EPP', icon: HardHat, roles: ['administrador', 'supervisor'] },
  { href: '/dashboard/capacitaciones', label: 'Capacitaciones', icon: GraduationCap, roles: ['administrador', 'supervisor'] },
  { href: '/dashboard/revisiones', label: 'Revisiones Médicas', icon: Stethoscope, roles: ['administrador', 'supervisor'] },
  { href: '/dashboard/subestandar', label: 'Acciones Subestándar', icon: AlertTriangle, roles: ['administrador', 'supervisor'] },
  { href: '/dashboard/registros', label: 'Registros', icon: ClipboardList, roles: ['administrador', 'supervisor'] },
  { href: '/dashboard/reportes', label: 'Reportes SST', icon: BarChart3, roles: ['administrador', 'supervisor'] },
  { href: '/dashboard/documentos', label: 'Documentos', icon: FileText, roles: ['administrador'] },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell, roles: ['administrador', 'supervisor'] },
  { href: '/dashboard/mensajes', label: 'Mensajes', icon: MessageSquare, roles: ['administrador', 'supervisor'] },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings, roles: ['administrador'] },
]

export default function Sidebar({ rol, nombre }: { rol: string; nombre: string }) {
  const path = usePathname()
  const router = useRouter()
  const [pend, setPend] = useState(0)
  useEffect(() => {
    if (rol !== 'administrador') return
    createClient().from('profiles').select('id', { count: 'exact', head: true }).eq('estado_cuenta', 'pendiente').then(({ count }) => setPend(count ?? 0))
  }, [rol, path])
  async function logout() { await createClient().auth.signOut(); router.replace('/login'); router.refresh() }
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line p-5"><Brand /></div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Menú principal">
        {NAV.filter((n) => n.roles.includes(rol)).map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? path === href : path.startsWith(href)
          return (
            <Link key={href} href={href} aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-violet text-white' : 'text-mute hover:bg-white/5 hover:text-ink'}`}>
              <Icon size={18} />{label}
              {href === '/dashboard/pendientes' && pend > 0 && <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-xs text-white">{pend}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="flex items-center gap-3 border-t border-line p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold">{nombre.slice(0, 1).toUpperCase()}</div>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{nombre}</p><p className="text-xs capitalize text-mute">{rol}</p></div>
        <button onClick={logout} className="text-mute hover:text-ink" aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} /></button>
      </div>
    </aside>
  )
}
