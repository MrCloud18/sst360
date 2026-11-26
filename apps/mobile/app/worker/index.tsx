import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth, useT } from '../../lib/auth'
import { useLoad } from '../../lib/hooks'
import { startOfDay } from '../../lib/format'
import { Avatar, Badge, Card, ErrorBox, H1, Kpi, Loading, Muted, Row, Screen, Section, Body } from '../../components/ui'

// RF-T02 · Panel principal
export default function WorkerHome() {
  const { profile } = useAuth(); const t = useT(); const router = useRouter(); const me = profile!.id
  const { data, loading, error, reload } = useLoad(async () => {
    const [a, e, c, n, r] = await Promise.all([
      supabase.from('asistencias').select('tipo,fecha_hora').eq('trabajador_id', me).gte('fecha_hora', startOfDay()).order('fecha_hora', { ascending: false }),
      supabase.from('epp_asignaciones').select('id', { count: 'exact', head: true }).eq('trabajador_id', me).eq('estado', 'asignado'),
      supabase.from('capacitacion_asistentes').select('id', { count: 'exact', head: true }).eq('trabajador_id', me).in('estado', ['inscrito', 'pendiente']),
      supabase.from('notificaciones').select('id', { count: 'exact', head: true }).eq('usuario_id', me).eq('leida', false),
      supabase.from('epp_solicitudes').select('id,estado,created_at').eq('trabajador_id', me).order('created_at', { ascending: false }).limit(3),
    ])
    if (a.error) throw a.error
    return { last: a.data?.[0], epp: e.count ?? 0, caps: c.count ?? 0, unread: n.count ?? 0, sols: r.data ?? [] }
  }, [me])

  const tiles: { t: string; i: any; to: string; badge?: number }[] = [
    { t: 'Registrar Asistencia', i: 'time-outline', to: '/asistencia' }, { t: 'Reportar Riesgo', i: 'warning-outline', to: '/reportar' },
    { t: 'Mis EPPs', i: 'construct-outline', to: '/worker/epp' }, { t: 'Capacitaciones', i: 'calendar-outline', to: '/worker/capacitaciones' },
    { t: 'Mi asistencia', i: 'list-outline', to: '/historial' }, { t: 'Documentos', i: 'document-text-outline', to: '/documentos' },
  ]
  const registered = data?.last?.tipo === 'entrada'
  return (
    <Screen onRefresh={reload}>
      <Row style={{ justifyContent: 'space-between' }}>
        <H1>¡Hola, {profile!.nombre_completo.split(' ')[0]}!</H1>
        <Row><Card onPress={() => router.push('/notificaciones' as any)} style={{ padding: 10, borderRadius: 22 }}><Ionicons name="notifications-outline" size={22} color={t.text} />
          {!!data?.unread && <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: t.danger, borderRadius: 8, minWidth: 16, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 10 }}>{data.unread}</Text></View>}</Card>
          <Avatar name={profile!.nombre_completo} uri={profile!.avatar_url} size={44} /></Row>
      </Row>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : (<>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, gap: 4 }}><Muted>Asistencia hoy</Muted><Badge text={data?.last ? (registered ? 'Entrada registrada' : 'Salida registrada') : 'Sin registrar'} tone={data?.last ? 'ok' : 'warn'} /></Card>
          <Kpi label="EPPs activos" value={data?.epp ?? 0} color={t.secondary} />
          <Card style={{ flex: 1, gap: 4 }}><Muted>Capacitaciones</Muted><Badge text={`${data?.caps ?? 0} pendiente(s)`} tone={data?.caps ? 'warn' : 'ok'} /></Card>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {tiles.map((x) => (
            <Card key={x.t} onPress={() => router.push(x.to as any)} style={{ width: '47.8%', alignItems: 'center', gap: 8, paddingVertical: 20 }}>
              <Ionicons name={x.i} size={34} color={t.primary} /><Body style={{ fontWeight: '600', textAlign: 'center' }}>{x.t}</Body></Card>))}
        </View>
        <Section title="Mis tareas recientes" />
        {!data?.sols.length ? <Muted>Sin solicitudes recientes.</Muted> : data.sols.map((s: any) => (
          <Card key={s.id} onPress={() => router.push('/worker/epp' as any)}><Row><Ionicons name="construct" size={20} color={t.primary} /><Body style={{ flex: 1 }}>Solicitud de EPP</Body><Badge text={s.estado.replace('_', ' ')} tone={s.estado === 'aprobado' ? 'ok' : s.estado === 'rechazado' ? 'danger' : 'warn'} /></Row></Card>))}
      </>)}
    </Screen>
  )
}
