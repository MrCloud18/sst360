'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge, Card, Empty, Spinner } from '@/components/ui'
import { fmtDateTime } from '@/lib/utils'

export default function PendientesClient() {
  const sb = useMemo(() => createClient(), [])
  const [vista, setVista] = useState<'pendiente' | 'rechazado'>('pendiente')
  const [rows, setRows] = useState<any[] | null>(null)
  const [areas, setAreas] = useState<any[]>([])
  const [sups, setSups] = useState<any[]>([])
  const [sel, setSel] = useState<Record<string, { rol: string; area_id: string; supervisor_id: string }>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setRows(null)
    const [p, a, s] = await Promise.all([
      sb.from('profiles').select('id,nombre_completo,email,codigo_trabajador,created_at').eq('estado_cuenta', vista).order('created_at', { ascending: false }),
      sb.from('areas').select('id,nombre').eq('activa', true).order('nombre'),
      sb.from('profiles').select('id,nombre_completo').eq('rol', 'supervisor').eq('activo', true).order('nombre_completo'),
    ])
    if (p.error) setErr(p.error.message)
    setRows(p.data ?? []); setAreas(a.data ?? []); setSups(s.data ?? [])
  }, [sb, vista])
  useEffect(() => { load() }, [load])

  const get = (id: string) => sel[id] ?? { rol: 'trabajador', area_id: '', supervisor_id: '' }
  const set = (id: string, patch: any) => setSel((s) => ({ ...s, [id]: { ...get(id), ...patch } }))

  async function aprobar(r: any) {
    const c = get(r.id)
    if (c.rol === 'trabajador' && !c.area_id && !c.supervisor_id) return alert('Asigna al menos un área o un supervisor para que su supervisor pueda verlo.')
    setBusy(r.id)
    const { error } = await sb.from('profiles').update({
      activo: true, estado_cuenta: 'aprobado', rol: c.rol, area_id: c.area_id || null, supervisor_id: c.rol === 'trabajador' ? c.supervisor_id || null : null,
    }).eq('id', r.id)
    setBusy(null)
    if (error) return alert(error.message)
    load()
  }
  async function rechazar(r: any) {
    if (!confirm(`¿Rechazar la solicitud de ${r.nombre_completo}?`)) return
    setBusy(r.id)
    const { error } = await sb.from('profiles').update({ activo: false, estado_cuenta: 'rechazado' }).eq('id', r.id)
    setBusy(null)
    if (error) return alert(error.message)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['pendiente', 'rechazado'] as const).map((v) => (
          <button key={v} onClick={() => setVista(v)} className={`btn ${vista === v ? 'btn-primary' : 'btn-ghost'}`}>{v === 'pendiente' ? 'Pendientes' : 'Rechazadas'}</button>
        ))}
      </div>
      {err && <p className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">Error: {err}</p>}
      {!rows ? <Spinner /> : !rows.length ? <Card><Empty text={vista === 'pendiente' ? 'No hay solicitudes pendientes.' : 'No hay solicitudes rechazadas.'} /></Card> : rows.map((r) => {
        const c = get(r.id)
        return (
          <Card key={r.id}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div><p className="text-base font-semibold">{r.nombre_completo}</p>
                <p className="text-sm text-mute">{r.email} · ID: {r.codigo_trabajador ?? '— (repetido o vacío)'}</p>
                <p className="text-xs text-mute">Solicitó el {fmtDateTime(r.created_at)}</p></div>
              <Badge tone={vista === 'pendiente' ? 'warn' : 'danger'}>{vista}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div><label className="mb-1 block text-xs text-mute" htmlFor={`rol-${r.id}`}>Rol</label>
                <select id={`rol-${r.id}`} className="input" value={c.rol} onChange={(e) => set(r.id, { rol: e.target.value })}>
                  <option value="trabajador">Trabajador</option><option value="supervisor">Supervisor</option><option value="administrador">Administrador</option></select></div>
              <div><label className="mb-1 block text-xs text-mute" htmlFor={`ar-${r.id}`}>Área</label>
                <select id={`ar-${r.id}`} className="input" value={c.area_id} onChange={(e) => set(r.id, { area_id: e.target.value })}>
                  <option value="">— Seleccionar —</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
              {c.rol === 'trabajador' && (
                <div><label className="mb-1 block text-xs text-mute" htmlFor={`su-${r.id}`}>Supervisor</label>
                  <select id={`su-${r.id}`} className="input" value={c.supervisor_id} onChange={(e) => set(r.id, { supervisor_id: e.target.value })}>
                    <option value="">— Seleccionar —</option>{sups.map((s) => <option key={s.id} value={s.id}>{s.nombre_completo}</option>)}</select></div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn btn-primary" disabled={busy === r.id} onClick={() => aprobar(r)}>{busy === r.id ? 'Procesando…' : 'Aprobar y activar'}</button>
              {vista === 'pendiente' && <button className="btn btn-danger" disabled={busy === r.id} onClick={() => rechazar(r)}>Rechazar</button>}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
