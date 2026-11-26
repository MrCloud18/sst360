'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
import { opt, trabajadorRef } from '@/lib/fields'

export default function NotificacionesClient() {
  const sb = createClient()
  const [f, setF] = useState({ titulo: '', mensaje: '', tipo: 'info', destino: 'todos', valor: '' })
  const [areas, setAreas] = useState<any[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [key, setKey] = useState(0)

  async function loadAreas() { if (!areas) setAreas((await sb.from('areas').select('id,nombre').order('nombre')).data ?? []) }
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setOk(null)
    const { data: { user } } = await sb.auth.getUser()
    const { data: me } = await sb.from('profiles').select('rol').eq('id', user!.id).single()
    let q = sb.from('profiles').select('id').eq('activo', true)
    // Un supervisor solo puede avisar a los trabajadores a su cargo (política RLS)
    if (me?.rol === 'supervisor') q = q.eq('supervisor_id', user!.id)
    if (f.destino === 'area') q = q.eq('area_id', f.valor)
    if (f.destino === 'rol') q = q.eq('rol', f.valor)
    const { data: users, error } = await q
    if (error || !users?.length) { setBusy(false); return alert(error?.message ?? 'No hay destinatarios para ese filtro.') }
    const { error: e2 } = await sb.from('notificaciones').insert(users.map((u) => ({ usuario_id: u.id, titulo: f.titulo, mensaje: f.mensaje, tipo: f.tipo })))
    setBusy(false)
    if (e2) return alert(e2.message)
    setOk(`Aviso enviado a ${users.length} usuario(s).`); setF({ ...f, titulo: '', mensaje: '' }); setKey((k) => k + 1)
  }
  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={enviar} className="grid gap-4 md:grid-cols-2">
          <div><label className="mb-1 block text-sm text-mute" htmlFor="t">Título</label><input id="t" className="input" required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
          <div><label className="mb-1 block text-sm text-mute" htmlFor="tp">Tipo</label>
            <select id="tp" className="input" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>{opt('info', 'alerta', 'capacitacion', 'medica', 'aprobacion').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="md:col-span-2"><label className="mb-1 block text-sm text-mute" htmlFor="m">Mensaje</label><textarea id="m" rows={2} className="input" value={f.mensaje} onChange={(e) => setF({ ...f, mensaje: e.target.value })} /></div>
          <div><label className="mb-1 block text-sm text-mute" htmlFor="d">Destinatarios</label>
            <select id="d" className="input" value={f.destino} onChange={(e) => { setF({ ...f, destino: e.target.value, valor: '' }); if (e.target.value === 'area') loadAreas() }}>
              <option value="todos">Todos los usuarios</option><option value="area">Por área</option><option value="rol">Por rol</option></select></div>
          {f.destino === 'area' && <div><label className="mb-1 block text-sm text-mute" htmlFor="v">Área</label><select id="v" className="input" required value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })}><option value="">— Seleccionar —</option>{areas?.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>}
          {f.destino === 'rol' && <div><label className="mb-1 block text-sm text-mute" htmlFor="v">Rol</label><select id="v" className="input" required value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })}><option value="">— Seleccionar —</option>{['trabajador', 'supervisor', 'administrador'].map((r) => <option key={r}>{r}</option>)}</select></div>}
          <div className="flex items-end gap-3 md:col-span-2"><button className="btn btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar aviso'}</button>{ok && <span className="text-sm text-ok">{ok}</span>}</div>
        </form>
      </Card>
      <CrudModule key={key} table="notificaciones" title="Historial de notificaciones" canCreate={false} canEdit={false} fields={[
        trabajadorRef('usuario_id', 'Destinatario'), { key: 'titulo', label: 'Título' }, { key: 'mensaje', label: 'Mensaje' }, { key: 'tipo', label: 'Tipo' },
        { key: 'leida', label: 'Leída', type: 'checkbox' }, { key: 'created_at', label: 'Fecha', type: 'datetime' }]} />
    </div>
  )
}
