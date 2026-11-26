import { Alert, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth, useT } from '../../lib/auth'
import { useLoad } from '../../lib/hooks'
import { label } from '../../lib/format'
import { Badge, Body, Btn, Card, Empty, ErrorBox, H1, Kpi, Loading, Muted, Ring, Row, Screen, Section, toneOf } from '../../components/ui'
import { startOfDay } from '../../lib/format'

// Vista ejecutiva móvil del administrador: resumen, alertas y aprobaciones rápidas (RF-A02)
export default function AdminHome() {
  const { profile } = useAuth(); const t = useT(); const router = useRouter()
  const { data, loading, error, reload } = useLoad(async () => {
    const [w, a, ea, rep, sol, ca, un] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rol', 'trabajador').eq('activo', true),
      supabase.from('asistencias').select('trabajador_id').eq('tipo', 'entrada').gte('fecha_hora', startOfDay()),
      supabase.from('epp_asignaciones').select('estado'),
      supabase.from('reportes_subestandar').select('id,severidad,estado,categoria,descripcion').neq('estado', 'cerrado').order('created_at', { ascending: false }).limit(30),
      supabase.from('epp_solicitudes').select('id,tipo_solicitud,worker:profiles!trabajador_id(nombre_completo),epp:epp_catalogo(nombre)').in('estado', ['enviado', 'en_revision']).order('created_at', { ascending: false }).limit(10),
      supabase.from('capacitacion_asistentes').select('estado'),
      supabase.from('notificaciones').select('id', { count: 'exact', head: true }).eq('usuario_id', profile!.id).eq('leida', false)])
    const nW = Math.max(w.count ?? 0, 1), asist = Math.round((new Set((a.data ?? []).map((x: any) => x.trabajador_id)).size / nW) * 100)
    const epp = ea.data?.length ? Math.round((ea.data.filter((x: any) => x.estado === 'asignado').length / ea.data.length) * 100) : 100
    const cap = ca.data?.length ? Math.round((ca.data.filter((x: any) => x.estado === 'completado').length / ca.data.length) * 100) : 100
    return { global: Math.round((asist + epp + cap) / 3), rep: rep.data ?? [], sol: sol.data ?? [], unread: un.count ?? 0 }
  }, [profile?.id])
  async function decidir(id: string, estado: 'aprobado' | 'rechazado') {
    const { error } = await supabase.from('epp_solicitudes').update({ estado, revisado_por: profile!.id }).eq('id', id)
    if (error) Alert.alert('No se pudo actualizar', error.message); else reload()
  }
  const crit = data?.rep.filter((r: any) => r.severidad === 'critico') ?? []
  return (
    <Screen onRefresh={reload}>
      <Row style={{ justifyContent: 'space-between' }}><H1>Resumen ejecutivo</H1>
        <Card onPress={() => router.push('/notificaciones' as any)} style={{ padding: 10, borderRadius: 22 }}><Ionicons name="notifications-outline" size={22} color={t.text} />
          {!!data?.unread && <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: t.danger, borderRadius: 8, minWidth: 16, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 10 }}>{data.unread}</Text></View>}</Card></Row>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : (<>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, alignItems: 'center', gap: 6 }}><Muted>Cumplimiento global</Muted><Ring pct={data!.global} size={88} /></Card>
          <View style={{ flex: 1, gap: 10 }}><Kpi label="Nuevos reportes" value={data!.rep.length} /><Kpi label="Alertas críticas" value={crit.length} color={crit.length ? t.danger : t.ok} /></View></View>
        <Section title="Alertas y notificaciones" />
        {!data!.sol.length && !crit.length ? <Empty text="Todo en orden. No hay alertas pendientes." icon="shield-checkmark-outline" /> : null}
        {crit.map((r: any) => (<Card key={r.id} onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: r.id } } as any)} style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: t.danger }}><Body style={{ fontWeight: '700' }}>Acción subestándar crítica</Body><Muted>{r.categoria} · {r.descripcion}</Muted><Badge text="Alta prioridad" tone="danger" /></Card>))}
        {data!.sol.map((s: any) => (<Card key={s.id} style={{ gap: 8 }}><Body style={{ fontWeight: '700' }}>Aprobación EPP</Body><Muted>{s.worker?.nombre_completo} ({label(s.tipo_solicitud)}: {s.epp?.nombre})</Muted>
          <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Btn title="Aprobar" variant="ok" onPress={() => decidir(s.id, 'aprobado')} /></View><View style={{ flex: 1 }}><Btn title="Rechazar" variant="danger" onPress={() => decidir(s.id, 'rechazado')} /></View></View></Card>))}
      </>)}
    </Screen>
  )
}
