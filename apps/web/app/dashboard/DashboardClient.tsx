'use client'
import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { Badge, Card, Kpi, Spinner } from '@/components/ui'

const day = (d: Date) => d.toISOString().slice(0, 10)

export default function DashboardClient() {
  const [d, setD] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const sb = createClient()
      const since = new Date(); since.setDate(since.getDate() - 13); since.setHours(0, 0, 0, 0)
      const r = await Promise.all([
        sb.from('profiles').select('id,nombre_completo,codigo_trabajador,area_id').eq('rol', 'trabajador').eq('activo', true),
        sb.from('asistencias').select('trabajador_id,fecha_hora').eq('tipo', 'entrada').gte('fecha_hora', since.toISOString()).limit(5000),
        sb.from('reportes_subestandar').select('id,severidad,estado,created_at'),
        sb.from('epp_solicitudes').select('id,estado,created_at'),
        sb.from('capacitaciones').select('id,fecha_programada'),
        sb.from('capacitacion_asistentes').select('trabajador_id,estado'),
        sb.from('revisiones_medicas').select('trabajador_id,estado'),
        sb.from('epp_asignaciones').select('trabajador_id,estado'),
        sb.from('areas').select('id,nombre'),
      ])
      const bad = r.find((x) => x.error); if (bad?.error) return setErr(bad.error.message)
      const [w, a, rep, sol, cap, ca, rev, ea, areas] = r.map((x) => x.data ?? []) as any[]
      const today = day(new Date()), nW = Math.max(w.length, 1)
      const uniq = (list: any[]) => new Set(list.map((x) => x.trabajador_id)).size
      const trend = Array.from({ length: 14 }, (_, i) => {
        const dt = new Date(since); dt.setDate(since.getDate() + i); const k = day(dt)
        return {
          dia: dt.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
          Asistencia: Math.round((uniq(a.filter((x: any) => day(new Date(x.fecha_hora)) === k)) / nW) * 100),
          Reportes: rep.filter((x: any) => x.created_at.slice(0, 10) === k).length,
          'Solicitudes EPP': sol.filter((x: any) => x.created_at.slice(0, 10) === k).length,
        }
      })
      const rows = w.map((t: any) => ({
        ...t,
        asist: a.filter((x: any) => x.trabajador_id === t.id).length,
        epp: ea.filter((x: any) => x.trabajador_id === t.id && x.estado === 'asignado').length,
        cap: `${ca.filter((x: any) => x.trabajador_id === t.id && x.estado === 'completado').length}/${ca.filter((x: any) => x.trabajador_id === t.id).length}`,
        rev: `${rev.filter((x: any) => x.trabajador_id === t.id && x.estado === 'realizado').length}/${rev.filter((x: any) => x.trabajador_id === t.id).length}`,
        area: areas.find((z: any) => z.id === t.area_id)?.nombre ?? '—',
      }))
      setD({
        asistHoy: Math.round((uniq(a.filter((x: any) => day(new Date(x.fecha_hora)) === today)) / nW) * 100),
        incidentes: rep.filter((x: any) => x.estado !== 'cerrado').length,
        criticos: rep.filter((x: any) => x.estado !== 'cerrado' && x.severidad === 'critico').length,
        capsCurso: cap.filter((x: any) => new Date(x.fecha_programada) >= new Date()).length,
        eppPend: sol.filter((x: any) => ['enviado', 'en_revision'].includes(x.estado)).length,
        trend, rows,
      })
    })()
  }, [])

  if (err) return <p className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">Error: {err}</p>
  if (!d) return <Spinner />
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Asistencia hoy" value={`${d.asistHoy}%`} tone="text-cyan" />
        <Kpi label="Incidentes activos" value={d.incidentes} hint={d.criticos > 0 ? <Badge tone="danger">{d.criticos} crítico(s)</Badge> : <Badge tone="ok">Sin críticos</Badge>} />
        <Kpi label="Capacitaciones en curso" value={d.capsCurso} />
        <Kpi label="EPP pendientes" value={d.eppPend} />
      </div>
      <Card>
        <h2 className="mb-4 text-base font-semibold">Tendencia de cumplimiento SST (14 días)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={d.trend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C3AED" stopOpacity={0.6} /><stop offset="1" stopColor="#7C3AED" stopOpacity={0} /></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#06B6D4" stopOpacity={0.5} /><stop offset="1" stopColor="#06B6D4" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="#272B3F" vertical={false} />
              <XAxis dataKey="dia" stroke="#9CA3AF" fontSize={12} />
              <YAxis yAxisId="l" stroke="#9CA3AF" fontSize={12} domain={[0, 100]} unit="%" />
              <YAxis yAxisId="r" orientation="right" stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#181B28', border: '1px solid #272B3F', borderRadius: 8 }} />
              <Legend />
              <Area yAxisId="l" type="monotone" dataKey="Asistencia" stroke="#7C3AED" fill="url(#g1)" strokeWidth={2} />
              <Area yAxisId="r" type="monotone" dataKey="Reportes" stroke="#06B6D4" fill="url(#g2)" strokeWidth={2} />
              <Area yAxisId="r" type="monotone" dataKey="Solicitudes EPP" stroke="#F59E0B" fill="none" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-0">
        <h2 className="border-b border-line p-4 text-base font-semibold">Resumen de cumplimiento de trabajadores</h2>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px]">
          <thead className="border-b border-line"><tr>{['Trabajador', 'Código', 'Área', 'Asistencias (14 d)', 'EPP vigentes', 'Capacitaciones', 'Rev. médicas'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {d.rows.map((r: any) => (
              <tr key={r.id}><td className="td font-medium">{r.nombre_completo}</td><td className="td">{r.codigo_trabajador ?? '—'}</td><td className="td">{r.area}</td>
                <td className="td">{r.asist}</td><td className="td">{r.epp}</td><td className="td">{r.cap}</td><td className="td">{r.rev}</td></tr>
            ))}
            {!d.rows.length && <tr><td colSpan={7} className="td text-center text-mute">Aún no hay trabajadores registrados.</td></tr>}
          </tbody></table></div>
      </Card>
    </div>
  )
}
