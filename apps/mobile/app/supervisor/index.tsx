import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth, useT } from '../../lib/auth'
import { useLoad } from '../../lib/hooks'
import { loadTeam, statusOf, todayStatus } from '../../lib/team'
import { Avatar, Badge, Body, Card, Empty, ErrorBox, H1, Kpi, Loading, Muted, Row, Screen, Section } from '../../components/ui'
import { Ionicons } from '@expo/vector-icons'

// RF-S02 panel · RF-S03 consulta de trabajadores · RF-S13 acceso a notificaciones
export default function SupHome() {
  const { profile } = useAuth(); const t = useT(); const router = useRouter()
  const { data, loading, error, reload } = useLoad(async () => {
    const [team, st, rep, sol, rev, un] = await Promise.all([
      loadTeam(profile!), todayStatus(),
      supabase.from('reportes_subestandar').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('epp_solicitudes').select('id', { count: 'exact', head: true }).in('estado', ['enviado', 'en_revision']),
      supabase.from('revisiones_medicas').select('id', { count: 'exact', head: true }).neq('estado', 'realizado'),
      supabase.from('notificaciones').select('id', { count: 'exact', head: true }).eq('usuario_id', profile!.id).eq('leida', false)])
    const present = team.filter((w: any) => st[w.id]).length
    return { team, st, pct: team.length ? Math.round((present / team.length) * 100) : 0, rep: rep.count ?? 0, sol: sol.count ?? 0, rev: rev.count ?? 0, unread: un.count ?? 0 }
  }, [profile?.id])
  return (
    <Screen onRefresh={reload}>
      <Row style={{ justifyContent: 'space-between' }}><H1>Panel de supervisión</H1>
        <Card onPress={() => router.push('/notificaciones' as any)} style={{ padding: 10, borderRadius: 22 }}><Ionicons name="notifications-outline" size={22} color={t.text} />
          {!!data?.unread && <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: t.danger, borderRadius: 8, minWidth: 16, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 10 }}>{data.unread}</Text></View>}</Card></Row>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : (<>
        <View style={{ flexDirection: 'row', gap: 10 }}><Kpi grad label="Asistencia" value={`${data!.pct}%`} /><Kpi label="Reportes pendientes" value={data!.rep} color={data!.rep ? t.warn : t.ok} onPress={() => router.push('/supervisor/validar' as any)} /></View>
        <View style={{ flexDirection: 'row', gap: 10 }}><Kpi label="Solicitudes EPP" value={data!.sol} onPress={() => router.push('/supervisor/validar' as any)} /><Kpi label="Revisiones pendientes" value={data!.rev} onPress={() => router.push('/supervisor/indicadores' as any)} /></View>
        <Section title="Equipo a cargo" />
        {!data!.team.length ? <Empty text="Aún no tienes trabajadores asignados." icon="people-outline" /> : data!.team.map((w: any) => { const s = statusOf(data!.st[w.id])
          return (<Card key={w.id} onPress={() => router.push({ pathname: '/trabajador/[id]', params: { id: w.id } } as any)}><Row><Avatar name={w.nombre_completo} uri={w.avatar_url} /><View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{w.nombre_completo}</Body><Muted>{w.codigo_trabajador ?? ''}</Muted></View><Badge text={s.text} tone={s.tone} /></Row></Card>) })}
      </>)}
    </Screen>
  )
}
