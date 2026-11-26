import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth, useT } from '../../lib/auth'
import { useLoad } from '../../lib/hooks'
import { fmtDate, label } from '../../lib/format'
import { Badge, Body, Btn, Card, Empty, ErrorBox, H2, Loading, Muted, Row, Screen, Section, Stepper, toneOf } from '../../components/ui'

const STEPS = ['Enviado', 'En revisión', 'Aprobado']
// RF-T05 consulta de EPP · RF-T06 solicitar · RF-T14 estado de solicitudes
export default function Epp() {
  const { profile } = useAuth(); const t = useT(); const router = useRouter()
  const { data, loading, error, reload } = useLoad(async () => {
    const [a, s] = await Promise.all([
      supabase.from('epp_asignaciones').select('id,fecha_asignacion,fecha_vencimiento,estado,epp:epp_catalogo(nombre)').eq('trabajador_id', profile!.id).order('fecha_asignacion', { ascending: false }),
      supabase.from('epp_solicitudes').select('id,tipo_solicitud,estado,created_at,comentario_revision,epp:epp_catalogo(nombre)').eq('trabajador_id', profile!.id).order('created_at', { ascending: false }).limit(20)])
    if (a.error) throw a.error; if (s.error) throw s.error
    return { a: a.data ?? [], s: s.data ?? [] }
  }, [profile?.id])
  return (
    <Screen onRefresh={reload}>
      <Section title="Equipos de protección (EPP)" />
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : (<>
        {!data?.a.length ? <Empty text="Aún no tienes EPP asignados." icon="construct-outline" /> : data.a.map((x: any) => (
          <Card key={x.id}><Row><Ionicons name="shield-checkmark" size={26} color={t.primary} />
            <View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{x.epp?.nombre}</Body><Muted>Entregado {fmtDate(x.fecha_asignacion)}{x.fecha_vencimiento ? ` · Vence ${fmtDate(x.fecha_vencimiento)}` : ''}</Muted></View>
            <Badge text={label(x.estado)} tone={toneOf(x.estado)} /></Row></Card>))}
        <Section title="Solicitudes de EPP" />
        {!data?.s.length ? <Muted>No has realizado solicitudes.</Muted> : data.s.map((x: any) => (
          <Card key={x.id}><Body style={{ fontWeight: '600' }}>{label(x.tipo_solicitud)}: {x.epp?.nombre}</Body><Muted>Solicitado {fmtDate(x.created_at)}</Muted>
            <Stepper steps={x.estado === 'rechazado' ? ['Enviado', 'En revisión', 'Rechazado'] : STEPS} current={x.estado === 'enviado' ? 0 : x.estado === 'en_revision' ? 1 : 2} rejected={x.estado === 'rechazado'} />
            {x.comentario_revision && <Muted>Comentario: {x.comentario_revision}</Muted>}</Card>))}
        <Btn title="Solicitar EPP" icon="add-circle-outline" onPress={() => router.push('/solicitar-epp' as any)} />
      </>)}
    </Screen>
  )
}
