import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth, useT } from '../../lib/auth'
import { useLoad } from '../../lib/hooks'
import { fmtDate, fmtDateTime, label } from '../../lib/format'
import { Badge, Body, Card, Empty, ErrorBox, Loading, Muted, Ring, Row, Screen, Section, toneOf } from '../../components/ui'

// RF-T09 capacitaciones · RF-T10 revisiones médicas
export default function Cap() {
  const { profile } = useAuth(); const t = useT()
  const { data, loading, error, reload } = useLoad(async () => {
    const [c, r] = await Promise.all([
      supabase.from('capacitacion_asistentes').select('id,estado,cap:capacitaciones(titulo,fecha_programada)').eq('trabajador_id', profile!.id),
      supabase.from('revisiones_medicas').select('*').eq('trabajador_id', profile!.id).order('fecha_programada')])
    if (c.error) throw c.error; if (r.error) throw r.error
    const caps = (c.data ?? []).sort((a: any, b: any) => +new Date(a.cap?.fecha_programada) - +new Date(b.cap?.fecha_programada))
    return { caps, revs: r.data ?? [] }
  }, [profile?.id])
  const done = data?.caps.filter((x: any) => x.estado === 'completado').length ?? 0, total = data?.caps.length ?? 0
  return (
    <Screen onRefresh={reload}>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : (<>
        <Card><Row><Ring pct={total ? (done / total) * 100 : 0} /><View style={{ flex: 1 }}><Body style={{ fontWeight: '700', fontSize: 18 }}>Capacitaciones</Body><Muted>{done}/{total} completadas</Muted></View></Row></Card>
        <Section title="Próximas capacitaciones" />
        {!total ? <Empty text="No tienes capacitaciones programadas." icon="school-outline" /> : data!.caps.map((x: any) => (
          <Card key={x.id}><Row><Ionicons name={x.estado === 'completado' ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={x.estado === 'completado' ? t.ok : t.primary} />
            <View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{x.cap?.titulo}</Body><Muted>{fmtDateTime(x.cap?.fecha_programada)}</Muted></View><Badge text={label(x.estado)} tone={toneOf(x.estado)} /></Row></Card>))}
        <Section title="Revisiones médicas" />
        {!data!.revs.length ? <Muted>No tienes revisiones médicas registradas.</Muted> : data!.revs.map((x: any) => (
          <Card key={x.id}><Row><Ionicons name="medkit" size={24} color={t.secondary} /><View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{x.tipo_examen}</Body><Muted>{fmtDate(x.fecha_programada)}</Muted></View><Badge text={label(x.estado)} tone={toneOf(x.estado)} /></Row></Card>))}
      </>)}
    </Screen>
  )
}
