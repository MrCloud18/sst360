import { useEffect } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth, useT } from '../lib/auth'
import { useLoad } from '../lib/hooks'
import { fmtDateTime } from '../lib/format'
import { Body, Card, Empty, ErrorBox, Loading, Muted, Row, Screen } from '../components/ui'

const ICON: Record<string, any> = { alerta: ['warning', '#EF4444'], info: ['information-circle', '#7C3AED'], aprobacion: ['checkmark-circle', '#10B981'], capacitacion: ['school', '#F59E0B'], medica: ['medkit', '#06B6D4'] }

// Panel de notificaciones en tiempo real (RF-T11, S13)
export default function Notificaciones() {
  const { profile } = useAuth(); const t = useT()
  const { data, loading, error, reload } = useLoad(async () => {
    const { data, error } = await supabase.from('notificaciones').select('*').eq('usuario_id', profile!.id).order('created_at', { ascending: false }).limit(100)
    if (error) throw error; return data ?? []
  }, [profile?.id])
  useEffect(() => {
    const ch = supabase.channel('notifs-' + profile!.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${profile!.id}` }, () => reload()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile?.id])
  async function read(n: any) { if (!n.leida) { await supabase.from('notificaciones').update({ leida: true }).eq('id', n.id); reload() } }
  async function readAll() { await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', profile!.id).eq('leida', false); reload() }
  return (
    <Screen onRefresh={reload}>
      {data?.some((n: any) => !n.leida) && <Card onPress={readAll}><Body style={{ textAlign: 'center', color: t.primary, fontWeight: '600' }}>Marcar todas como leídas</Body></Card>}
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : !data?.length ? <Empty text="No tienes notificaciones." icon="notifications-off-outline" /> :
        data.map((n: any) => { const [icon, color] = ICON[n.tipo] ?? ICON.info
          return (<Card key={n.id} onPress={() => read(n)} style={{ borderLeftWidth: 4, borderLeftColor: color, opacity: n.leida ? 0.65 : 1 }}>
            <Row><Ionicons name={icon} size={24} color={color} /><View style={{ flex: 1 }}><Body style={{ fontWeight: '700' }}>{n.titulo}</Body>{n.mensaje && <Muted>{n.mensaje}</Muted>}<Muted style={{ fontSize: 11, marginTop: 2 }}>{fmtDateTime(n.created_at)}</Muted></View>
              {!n.leida && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: t.primary }} />}</Row></Card>) })}
    </Screen>
  )
}
