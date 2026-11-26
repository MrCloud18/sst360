import { useState } from 'react'
import { Share, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth, useT } from '../lib/auth'
import { useLoad } from '../lib/hooks'
import { fmtDate, fmtDateTime, label } from '../lib/format'
import { loadTeam } from '../lib/team'
import { Bars, Badge, Body, Btn, Card, Chip, Chips, Empty, ErrorBox, H2, Loading, Muted, Ring, Row, Screen, Section, toneOf } from './ui'

// RF-S06 solicitudes EPP · RF-S07 revisión de reportes (filtrable por severidad y estado)
export function ValidarScreen() {
  const t = useT(); const router = useRouter()
  const [tab, setTab] = useState<'epp' | 'rep'>('epp'); const [onlyPend, setOnlyPend] = useState(true); const [sev, setSev] = useState<string | null>(null)
  const { data, loading, error, reload } = useLoad(async () => {
    const [s, r] = await Promise.all([
      supabase.from('epp_solicitudes').select('id,tipo_solicitud,estado,created_at,worker:profiles!trabajador_id(nombre_completo),epp:epp_catalogo(nombre)').order('created_at', { ascending: false }).limit(100),
      supabase.from('reportes_subestandar').select('id,severidad,estado,categoria,descripcion,created_at,worker:profiles!trabajador_id(nombre_completo)').order('created_at', { ascending: false }).limit(100)])
    if (s.error) throw s.error; if (r.error) throw r.error
    return { s: s.data ?? [], r: r.data ?? [] }
  })
  const sols = (data?.s ?? []).filter((x: any) => !onlyPend || ['enviado', 'en_revision'].includes(x.estado))
  const reps = (data?.r ?? []).filter((x: any) => (!onlyPend || x.estado !== 'cerrado') && (!sev || x.severidad === sev))
  return (
    <Screen onRefresh={reload}>
      <Chips><Chip text={`Solicitudes EPP${data ? ` (${sols.length})` : ''}`} active={tab === 'epp'} onPress={() => setTab('epp')} /><Chip text={`Reportes${data ? ` (${reps.length})` : ''}`} active={tab === 'rep'} onPress={() => setTab('rep')} /></Chips>
      <Chips><Chip text="Solo pendientes" active={onlyPend} onPress={() => setOnlyPend(!onlyPend)} color={t.secondary} />
        {tab === 'rep' && (['leve', 'moderado', 'critico'] as const).map((s) => <Chip key={s} text={label(s)} active={sev === s} onPress={() => setSev(sev === s ? null : s)} color={s === 'critico' ? t.danger : s === 'moderado' ? t.warn : t.ok} />)}</Chips>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : tab === 'epp' ? (
        !sols.length ? <Empty text="No hay solicitudes de EPP en esta vista." icon="checkmark-done-outline" /> : sols.map((x: any) => (
          <Card key={x.id} onPress={() => router.push({ pathname: '/solicitud/[id]', params: { id: x.id } } as any)}><Row><Ionicons name="construct" size={22} color={t.primary} />
            <View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{x.worker?.nombre_completo}</Body><Muted>{label(x.tipo_solicitud)}: {x.epp?.nombre} · {fmtDate(x.created_at)}</Muted></View><Badge text={label(x.estado)} tone={toneOf(x.estado)} /></Row></Card>))
      ) : (
        !reps.length ? <Empty text="No hay reportes en esta vista." icon="shield-checkmark-outline" /> : reps.map((x: any) => (
          <Card key={x.id} onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: x.id } } as any)} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}><Badge text={label(x.severidad)} tone={toneOf(x.severidad)} /><Badge text={label(x.estado)} tone={toneOf(x.estado)} /></Row>
            <Body style={{ fontWeight: '600' }}>{x.categoria ?? 'Reporte'} · {x.worker?.nombre_completo}</Body><Muted>{x.descripcion}</Muted><Muted style={{ fontSize: 11 }}>{fmtDateTime(x.created_at)}</Muted></Card>))
      )}
    </Screen>
  )
}

// RF-S14 indicadores · RF-S11 revisiones médicas · RF-S10 acceso a capacitaciones · RF-S15 generación de reportes
export function IndicadoresScreen() {
  const { profile } = useAuth(); const t = useT(); const router = useRouter()
  const { data, loading, error, reload } = useLoad(async () => {
    const team = await loadTeam(profile!)
    const [ea, rep, caps, rev, st] = await Promise.all([
      supabase.from('epp_asignaciones').select('estado'), supabase.from('reportes_subestandar').select('severidad,estado,created_at,categoria'),
      supabase.from('capacitaciones').select('id,titulo,fecha_programada').gte('fecha_programada', new Date().toISOString()).order('fecha_programada').limit(5),
      supabase.from('revisiones_medicas').select('id,tipo_examen,fecha_programada,estado,worker:profiles!trabajador_id(nombre_completo)').order('fecha_programada').limit(30),
      supabase.from('asistencias').select('trabajador_id,fecha_hora').eq('tipo', 'entrada').gte('fecha_hora', new Date(Date.now() - 30 * 864e5).toISOString())])
    const eppAll = ea.data?.length ?? 0, eppOk = ea.data?.filter((x: any) => x.estado === 'asignado').length ?? 0
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return d })
    const dias = new Set((st.data ?? []).map((a: any) => a.fecha_hora.slice(0, 10))).size || 1
    return {
      eppPct: eppAll ? Math.round((eppOk / eppAll) * 100) : 0,
      asist: team.length ? Math.min(100, Math.round(((st.data?.length ?? 0) / (team.length * dias)) * 100)) : 0,
      meses: months.map((d) => ({ l: d.toLocaleDateString('es-PE', { month: 'short' }), v: (rep.data ?? []).filter((r: any) => r.created_at.slice(0, 7) === d.toISOString().slice(0, 7)).length })),
      caps: caps.data ?? [], rev: (rev.data ?? []).filter((r: any) => r.estado !== 'realizado'), revDone: (rev.data ?? []).filter((r: any) => r.estado === 'realizado').length,
      raw: { epp: { total: eppAll, vigentes: eppOk }, reportes: rep.data ?? [], team: team.length },
    }
  }, [profile?.id])

  async function exportar() {
    const d = data!; const rows = [['Indicador', 'Valor'], ['Trabajadores a cargo', d.raw.team], ['Cumplimiento EPP %', d.eppPct], ['Asistencia % (30 días)', d.asist],
      ['Reportes totales', d.raw.reportes.length], ['Reportes abiertos', d.raw.reportes.filter((r: any) => r.estado !== 'cerrado').length], ['Revisiones médicas pendientes', d.rev.length], ['Revisiones realizadas', d.revDone]]
    await Share.share({ title: 'Reporte SST 360', message: `Reporte SST 360 · ${new Date().toLocaleDateString('es-PE')}\n\n` + rows.map((r) => r.join(',')).join('\n') })
  }
  return (
    <Screen onRefresh={reload}>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : (<>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, alignItems: 'center', gap: 8 }}><Muted>Cumplimiento EPP</Muted><Ring pct={data!.eppPct} size={92} /></Card>
          <Card style={{ flex: 1, alignItems: 'center', gap: 8 }}><Muted>Asistencia (30 d)</Muted><Ring pct={data!.asist} size={92} /></Card>
        </View>
        <Card style={{ gap: 8 }}><H2>Accidentabilidad mensual</H2><Bars data={data!.meses} /></Card>
        <Section title="Capacitaciones próximas" right={<Muted onPress={() => router.push('/gestion-capacitaciones' as any)} style={{ color: t.secondary }}>Gestionar</Muted> as any} />
        {!data!.caps.length ? <Muted>No hay capacitaciones programadas.</Muted> : data!.caps.map((c: any) => (<Card key={c.id}><Row><Ionicons name="school" size={22} color={t.primary} /><View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{c.titulo}</Body><Muted>{fmtDateTime(c.fecha_programada)}</Muted></View></Row></Card>))}
        <Section title="Revisiones médicas pendientes" />
        {!data!.rev.length ? <Muted>Sin revisiones pendientes.</Muted> : data!.rev.map((r: any) => (<Card key={r.id}><Row><Ionicons name="medkit" size={22} color={t.secondary} /><View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{r.worker?.nombre_completo}</Body><Muted>{r.tipo_examen} · {fmtDate(r.fecha_programada)}</Muted></View><Badge text={label(r.estado)} tone={toneOf(r.estado)} /></Row></Card>))}
        <Btn title="Generar reporte (compartir)" icon="share-outline" onPress={exportar} />
      </>)}
    </Screen>
  )
}
