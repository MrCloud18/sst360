'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge, Card, Empty, Modal, Spinner, toneOf } from './ui'
import FileLink from './FileLink'
import { downloadCSV, fmtDate, fmtDateTime, toLocalInput } from '@/lib/utils'

export type Field = {
  key: string; label: string
  type?: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'datetime' | 'checkbox' | 'upload' | 'files' | 'json' | 'password'
  options?: { value: string; label: string }[]
  ref?: { table: string; label: string; filter?: Record<string, string> }
  required?: boolean; hideInTable?: boolean; hideInForm?: boolean; readOnly?: boolean
  createOnly?: boolean; lockOnEdit?: boolean; bucket?: string; sizeKey?: string; def?: any
}
type Props = {
  table: string; title: string; fields: Field[]; pk?: string; orderBy?: string; asc?: boolean
  filter?: Record<string, any>; select?: string; defaults?: Record<string, any>
  stamp?: Record<string, 'uid'>; createVia?: string
  canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; hideTitle?: boolean
}

export default function CrudModule(p: Props) {
  const { table, fields, pk = 'id', orderBy = 'created_at', asc = false } = p
  const sb = useMemo(() => createClient(), [])
  const [rows, setRows] = useState<any[]>([])
  const [refs, setRefs] = useState<Record<string, { value: string; label: string }[]>>({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<any | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const filterKey = JSON.stringify(p.filter ?? {})

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    let qy = sb.from(table).select(p.select ?? '*').order(orderBy, { ascending: asc }).limit(500)
    for (const [k, v] of Object.entries(p.filter ?? {})) qy = qy.eq(k, v)
    const { data, error } = await qy
    if (error) setErr(error.message); else setRows(data ?? [])
    setLoading(false)
    // catálogos para campos FK
    const out: any = {}
    await Promise.all(fields.filter((f) => f.ref).map(async (f) => {
      let r = sb.from(f.ref!.table).select(`id,${f.ref!.label}`).limit(1000)
      for (const [k, v] of Object.entries(f.ref!.filter ?? {})) r = r.eq(k, v)
      const { data: d } = await r
      out[f.key] = (d ?? []).map((x: any) => ({ value: x.id, label: x[f.ref!.label] }))
    }))
    setRefs(out)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterKey, orderBy, asc])
  useEffect(() => { load() }, [load])

  const opts = (f: Field) => f.options ?? refs[f.key] ?? []
  const display = (f: Field, row: any) => {
    const v = row[f.key]
    if (v === null || v === undefined || v === '') return '—'
    if (f.ref || f.type === 'select') return opts(f).find((o) => o.value === v)?.label ?? (f.ref ? '…' : String(v))
    if (f.type === 'checkbox') return v ? 'Sí' : 'No'
    if (f.type === 'date') return fmtDate(v)
    if (f.type === 'datetime') return fmtDateTime(v)
    if (f.type === 'json') return JSON.stringify(v)
    return String(v)
  }
  const cell = (f: Field, row: any) => {
    const v = row[f.key]
    if ((f.type === 'upload' || f.type === 'files') && f.bucket) return <FileLink bucket={f.bucket} value={v} />
    const d = display(f, row)
    if (['estado', 'severidad', 'estado_cuenta'].includes(f.key) && v) return <Badge tone={toneOf(v)}>{String(d).replace('_', ' ')}</Badge>
    if (f.type === 'checkbox') return <Badge tone={v ? 'ok' : 'danger'}>{d}</Badge>
    return <span className="line-clamp-2 max-w-xs">{d}</span>
  }

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return rows
    return rows.filter((r) => fields.some((f) => String(display(f, r)).toLowerCase().includes(t)))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, refs])

  function openNew() {
    const f: any = { ...(p.defaults ?? {}) }
    fields.forEach((x) => { if (f[x.key] === undefined) f[x.key] = x.def ?? (x.type === 'checkbox' ? true : '') })
    setForm(f); setIsNew(true); setEditing({})
  }
  function openEdit(row: any) {
    const f: any = {}
    fields.forEach((x) => { f[x.key] = x.type === 'datetime' ? toLocalInput(row[x.key]) : x.type === 'json' ? JSON.stringify(row[x.key], null, 2) : row[x.key] ?? (x.type === 'checkbox' ? false : '') })
    setForm(f); setIsNew(false); setEditing(row)
  }
  async function upload(f: Field, file?: File | null) {
    if (!file) return
    const path = `${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`
    const { error } = await sb.storage.from(f.bucket!).upload(path, file, { contentType: file.type })
    if (error) return alert('Error al subir: ' + error.message)
    setForm((s: any) => ({ ...s, [f.key]: path, ...(f.sizeKey ? { [f.sizeKey]: file.size } : {}) }))
  }
  async function save() {
    setSaving(true)
    try {
      const payload: any = {}
      for (const f of fields) {
        if (f.hideInForm || f.readOnly) continue
        if (f.createOnly && !isNew) continue
        if (f.lockOnEdit && !isNew) continue
        let v = form[f.key]
        if (f.required && (v === '' || v === null || v === undefined)) throw new Error(`El campo "${f.label}" es obligatorio`)
        if (f.type === 'number') v = v === '' ? null : Number(v)
        else if (f.type === 'datetime') v = v ? new Date(v).toISOString() : null
        else if (f.type === 'json') { try { v = JSON.parse(v) } catch { throw new Error(`"${f.label}" debe ser JSON válido`) } }
        else if (v === '') v = null
        payload[f.key] = v
        if (f.sizeKey && form[f.sizeKey] !== undefined) payload[f.sizeKey] = form[f.sizeKey]
      }
      Object.assign(payload, p.defaults && isNew ? Object.fromEntries(Object.entries(p.defaults).filter(([k]) => !(k in payload) || payload[k] == null)) : {})
      const { data: { user } } = await sb.auth.getUser()
      for (const [k] of Object.entries(p.stamp ?? {})) payload[k] = user?.id
      if (isNew && p.createVia) {
        const r = await fetch(p.createVia, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Error al crear')
      } else if (isNew) {
        const { error } = await sb.from(table).insert(payload); if (error) throw error
      } else {
        const { error } = await sb.from(table).update(payload).eq(pk, editing[pk]); if (error) throw error
      }
      setEditing(null); await load()
    } catch (e: any) { alert(e.message ?? 'Error al guardar') } finally { setSaving(false) }
  }
  async function remove(row: any) {
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return
    const { error } = await sb.from(table).delete().eq(pk, row[pk])
    if (error) alert(error.message); else load()
  }

  const canCreate = p.canCreate ?? true, canEdit = p.canEdit ?? true, canDelete = p.canDelete ?? true
  const cols = fields.filter((f) => !f.hideInTable)
  const formFields = fields.filter((f) => !f.hideInForm && !f.readOnly && (isNew || !f.createOnly))

  return (
    <Card className="print-area p-0">
      <div className="no-print flex flex-wrap items-center gap-3 border-b border-line p-4">
        {!p.hideTitle && <h2 className="mr-auto text-base font-semibold">{p.title}</h2>}
        <input className="input max-w-[16rem]" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        <button className="btn btn-ghost" onClick={() => downloadCSV(shown, table)} disabled={!shown.length}><Download size={16} />CSV</button>
        {canCreate && <button className="btn btn-primary" onClick={openNew}><Plus size={16} />Nuevo</button>}
      </div>
      {err && <p className="m-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">Error: {err}</p>}
      {loading ? <Spinner /> : !shown.length ? <Empty /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-line"><tr>
              {cols.map((f) => <th key={f.key} className="th">{f.label}</th>)}
              {(canEdit || canDelete) && <th className="th no-print w-24" />}
            </tr></thead>
            <tbody className="divide-y divide-line">
              {shown.map((r) => (
                <tr key={r[pk]} className="hover:bg-white/[.02]">
                  {cols.map((f) => <td key={f.key} className="td">{cell(f, r)}</td>)}
                  {(canEdit || canDelete) && (
                    <td className="td no-print"><div className="flex justify-end gap-3">
                      {canEdit && <button onClick={() => openEdit(r)} className="text-mute hover:text-ink" aria-label="Editar"><Pencil size={16} /></button>}
                      {canDelete && <button onClick={() => remove(r)} className="text-mute hover:text-danger" aria-label="Eliminar"><Trash2 size={16} /></button>}
                    </div></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!editing} title={(isNew ? 'Nuevo · ' : 'Editar · ') + p.title} onClose={() => setEditing(null)}>
        <div className="space-y-4">
          {formFields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm text-mute" htmlFor={'f-' + f.key}>{f.label}{f.required && ' *'}</label>
              {f.type === 'textarea' || f.type === 'json' ? (
                <textarea id={'f-' + f.key} rows={f.type === 'json' ? 6 : 3} className={`input ${f.type === 'json' ? 'font-mono text-xs' : ''}`} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              ) : f.type === 'select' || f.ref ? (
                <select id={'f-' + f.key} className="input" value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  <option value="">— Seleccionar —</option>
                  {opts(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'checkbox' ? (
                <input id={'f-' + f.key} type="checkbox" className="h-5 w-5 accent-violet" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />
              ) : f.type === 'upload' ? (
                <div><input id={'f-' + f.key} type="file" className="input" onChange={(e) => upload(f, e.target.files?.[0])} />
                  {form[f.key] && <p className="mt-1 text-xs text-ok">Archivo cargado: {form[f.key]}</p>}</div>
              ) : (
                <input id={'f-' + f.key} className="input" type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'datetime' ? 'datetime-local' : f.type === 'password' ? 'password' : 'text'}
                  value={form[f.key] ?? ''} disabled={f.lockOnEdit && !isNew} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </Modal>
    </Card>
  )
}
