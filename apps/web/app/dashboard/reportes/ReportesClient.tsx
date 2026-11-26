'use client'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, Spinner } from '@/components/ui'
import { downloadCSV, flatten } from '@/lib/utils'

const DATASETS: Record<string, { label: string; select: string; date: string }> = {
  asistencias: { label: 'Asistencias', select: '*, trabajador:profiles!trabajador_id(nombre_completo,codigo_trabajador)', date: 'fecha_hora' },
  epp_solicitudes: { label: 'Solicitudes de EPP', select: '*, trabajador:profiles!trabajador_id(nombre_completo), epp:epp_catalogo(nombre)', date: 'created_at' },
  reportes_subestandar: { label: 'Reportes subestándar', select: '*, trabajador:profiles!trabajador_id(nombre_completo), area:areas(nombre)', date: 'created_at' },
  capacitacion_asistentes: { label: 'Capacitaciones (asistentes)', select: '*, trabajador:profiles!trabajador_id(nombre_completo), capacitacion:capacitaciones(titulo,fecha_programada)', date: 'created_at' },
  revisiones_medicas: { label: 'Revisiones médicas', select: '*, trabajador:profiles!trabajador_id(nombre_completo)', date: 'fecha_programada' },
}
const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#7C3AED']
const tip = { contentStyle: { background: '#181B28', border: '1px solid #272B3F', borderRadius: 8 } }

export default function ReportesClient() {
  const sb = createClient()
  const [ind, setInd] = useState<any>(null)
  const [ds, setDs] = useState('asistencias')
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10))
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<any[] | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      const [ea, rep, ca] = await Promise.all([
        sb.from('epp_asignaciones').select('estado'), sb.from('reportes_subestandar').select('severidad,created_at'),
        sb.from('capacitacion_asistentes').select('estado'),
      ])
      const eppOk = (ea.data ?? []).filter((x: any) => x.estado === 'asignado').length, eppAll = (ea.data ?? []).length
      const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return d })
      setInd({
        epp: [{ name: 'Vigentes', value: eppOk }, { name: 'Vencidos / devueltos', value: eppAll - eppOk }],
        eppPct: eppAll ? Math.round((eppOk / eppAll) * 100) : 0,
        meses: months.map((d) => ({ mes: d.toLocaleDateString('es-PE', { month: 'short' }),
          Reportes: (rep.data ?? []).filter((r: any) => r.created_at.slice(0, 7) === d.toISOString().slice(0, 7)).length })),
        sev: ['leve', 'moderado', 'critico'].map((s) => ({ s, n: (rep.data ?? []).filter((r: any) => r.severidad === s).length })),
        cap: ['completado', 'inscrito', 'pendiente', 'ausente'].map((s) => ({ name: s, value: (ca.data ?? []).filter((x: any) => x.estado === s).length })),
      })
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generar() {
    setBusy(true)
    const c = DATASETS[ds]
    const { data, error } = await sb.from(ds).select(c.select).gte(c.date, from).lte(c.date, to + 'T23:59:59').order(c.date, { ascending: false }).limit(5000)
    setBusy(false)
    if (error) return alert(error.message)
    setRows(data ?? [])
  }

  if (!ind) return <Spinner />
  const flat = (rows ?? []).slice(0, 50).map((r) => flatten(r))
  const cols = Array.from(new Set(flat.flatMap((r) => Object.keys(r)))).filter((k) => !k.endsWith('_id') && k !== 'id').slice(0, 8)
  return (
    <div className="space-y-6">
      <div className="no-print grid gap-4 lg:grid-cols-3">
        <Card><h2 className="mb-2 text-base font-semibold">Cumplimiento de EPP</h2>
          <div className="relative h-52"><ResponsiveContainer width="100%" height="100%"><PieChart>
            <Pie data={ind.epp} dataKey="value" innerRadius={55} outerRadius={80} stroke="none">{ind.epp.map((_: any, i: number) => <Cell key={i} fill={i === 0 ? '#06B6D4' : '#272B3F'} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer>
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl font-semibold">{ind.eppPct}%</p></div></Card>
        <Card><h2 className="mb-2 text-base font-semibold">Accidentabilidad mensual (reportes)</h2>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={ind.meses}><CartesianGrid stroke="#272B3F" vertical={false} /><XAxis dataKey="mes" stroke="#9CA3AF" fontSize={12} /><YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} /><Tooltip {...tip} /><Bar dataKey="Reportes" fill="#7C3AED" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><h2 className="mb-2 text-base font-semibold">Capacitaciones por estado</h2>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={ind.cap} dataKey="value" nameKey="name" outerRadius={80} label={(e: any) => e.name} stroke="none">{ind.cap.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % 4]} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer></div></Card>
      </div>
      <Card className="no-print">
        <h2 className="mb-4 text-base font-semibold">Generar reporte</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="mb-1 block text-sm text-mute" htmlFor="ds">Tipo de reporte</label>
            <select id="ds" className="input" value={ds} onChange={(e) => setDs(e.target.value)}>{Object.entries(DATASETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <div><label className="mb-1 block text-sm text-mute" htmlFor="d1">Desde</label><input id="d1" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className="mb-1 block text-sm text-mute" htmlFor="d2">Hasta</label><input id="d2" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={generar} disabled={busy}>{busy ? 'Generando…' : 'Generar'}</button>
          {rows && <><button className="btn btn-ghost" onClick={() => downloadCSV(rows, ds)} disabled={!rows.length}><Download size={16} />Excel / CSV</button>
            <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16} />Imprimir / PDF</button></>}
        </div>
      </Card>
      {rows && (
        <Card className="print-area p-0">
          <p className="border-b border-line p-4 text-sm">{DATASETS[ds].label} · {from} a {to} · {rows.length} registro(s){rows.length > 50 && ' (vista previa de 50; el CSV incluye todos)'}</p>
          {rows.length ? <div className="overflow-x-auto"><table className="w-full"><thead className="border-b border-line"><tr>{cols.map((c) => <th key={c} className="th">{c}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{flat.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c} className="td">{String(r[c] ?? '—')}</td>)}</tr>)}</tbody></table></div>
            : <p className="p-6 text-center text-sm text-mute">No hay registros en ese rango.</p>}
        </Card>
      )}
    </div>
  )
}
