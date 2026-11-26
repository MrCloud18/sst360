import { useState } from 'react'
import { Image, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth, useT } from '../lib/auth'
import { useLoad } from '../lib/hooks'
import { fmtDateTime, label } from '../lib/format'
import { signedUrls } from '../lib/upload'
import { Badge, Body, Card, Empty, ErrorBox, Loading, LocationMap, Muted, Row, Screen, toneOf } from '../components/ui'

// RF-T04 · Historial de asistencia con foto y ubicación
export default function Historial() {
  const { profile } = useAuth(); const t = useT(); const [open, setOpen] = useState<string | null>(null)
  const { data, loading, error, reload } = useLoad(async () => {
    const { data, error } = await supabase.from('asistencias').select('*').eq('trabajador_id', profile!.id).order('fecha_hora', { ascending: false }).limit(60)
    if (error) throw error
    return { rows: data ?? [], urls: await signedUrls('asistencias-fotos', (data ?? []).map((x: any) => x.foto_url)) }
  }, [profile?.id])
  return (
    <Screen onRefresh={reload}>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : !data?.rows.length ? <Empty text="Todavía no has registrado asistencia." icon="time-outline" /> :
        data.rows.map((x: any) => (
          <Card key={x.id} onPress={() => setOpen(open === x.id ? null : x.id)} style={{ gap: 10 }}>
            <Row>{data.urls[x.foto_url] ? <Image source={{ uri: data.urls[x.foto_url] }} style={{ width: 56, height: 56, borderRadius: 10 }} /> : <Ionicons name="person-circle" size={56} color={t.muted} />}
              <View style={{ flex: 1, gap: 3 }}><Body style={{ fontWeight: '600' }}>{label(x.tipo)}</Body><Muted>{fmtDateTime(x.fecha_hora)}</Muted>{x.direccion_texto && <Muted>{x.direccion_texto}</Muted>}</View>
              <Badge text={label(x.estado)} tone={toneOf(x.estado)} /></Row>
            {open === x.id && <LocationMap lat={x.latitud} lng={x.longitud} />}
          </Card>))}
    </Screen>
  )
}
