import { useState } from 'react'
import { Alert, Image, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useLoad } from '../../lib/hooks'
import { fmtDate, fmtDateTime, label } from '../../lib/format'
import { signedUrls } from '../../lib/upload'
import { Avatar, Badge, Body, Btn, Card, ErrorBox, H2, Input, Loading, LocationMap, Muted, Row, Screen, Section, toneOf } from '../../components/ui'

// RF-S03 perfil · RF-S04 seguimiento de asistencia (foto + GPS + línea de tiempo) · RF-S05 revisión de EPP · RF-S12 observaciones
export default function Trabajador() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { profile } = useAuth()
  const [nota, setNota] = useState(''); const [busy, setBusy] = useState(false)
  const { data, loading, error, reload } = useLoad(async () => {
    const [p, a, e, o] = await Promise.all([
      supabase.from('profiles').select('*,area:areas(nombre)').eq('id', id).single(),
      supabase.from('asistencias').select('*').eq('trabajador_id', id).order('fecha_hora', { ascending: false }).limit(15),
      supabase.from('epp_asignaciones').select('id,estado,fecha_vencimiento,epp:epp_catalogo(nombre)').eq('trabajador_id', id),
      supabase.from('observaciones_sst').select('*').eq('trabajador_id', id).order('created_at', { ascending: false }).limit(20)])
    if (p.error) throw p.error
    return { p: p.data, a: a.data ?? [], e: e.data ?? [], o: o.data ?? [], urls: await signedUrls('asistencias-fotos', (a.data ?? []).map((x: any) => x.foto_url)) }
  }, [id])
  async function guardar() {
    if (nota.trim().length < 3) return
    setBusy(true)
    const { error } = await supabase.from('observaciones_sst').insert({ trabajador_id: id, supervisor_id: profile!.id, nota: nota.trim() })
    setBusy(false); if (error) return Alert.alert('No se pudo guardar', error.message)
    setNota(''); reload()
  }
  if (loading) return <Loading />
  if (error || !data) return <Screen><ErrorBox msg={error ?? 'No encontrado'} onRetry={reload} /></Screen>
  const last = data.a[0]
  return (
    <Screen>
      <Card><Row><Avatar name={data.p.nombre_completo} uri={data.p.avatar_url} size={60} /><View style={{ flex: 1 }}><H2>{data.p.nombre_completo}</H2><Muted>{data.p.codigo_trabajador ?? ''} · {data.p.area?.nombre ?? 'Sin área'}</Muted><Muted>{data.p.telefono ?? 'Sin teléfono'}</Muted></View></Row></Card>
      <Section title="Última marcación" />
      {!last ? <Muted>Sin registros de asistencia.</Muted> : (
        <Card style={{ gap: 8 }}>
          <Row>{data.urls[last.foto_url] && <Image source={{ uri: data.urls[last.foto_url] }} style={{ width: 72, height: 72, borderRadius: 12 }} />}
            <View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{label(last.tipo)} · {fmtDateTime(last.fecha_hora)}</Body><Muted>{last.direccion_texto ?? 'Ubicación verificada por GPS'}</Muted></View><Badge text={label(last.estado)} tone={toneOf(last.estado)} /></Row>
          <LocationMap lat={last.latitud} lng={last.longitud} /></Card>)}
      <Section title="Línea de tiempo" />
      {data.a.slice(0, 8).map((x: any) => (<Row key={x.id}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: x.tipo === 'entrada' ? '#10B981' : '#06B6D4' }} /><Body style={{ flex: 1 }}>{label(x.tipo)}</Body><Muted>{fmtDateTime(x.fecha_hora)}</Muted></Row>))}
      <Section title="EPP asignado" />
      {!data.e.length ? <Muted>Sin EPP asignado.</Muted> : data.e.map((x: any) => (<Card key={x.id}><Row><Body style={{ flex: 1, fontWeight: '600' }}>{x.epp?.nombre}</Body><Muted>{x.fecha_vencimiento ? `Vence ${fmtDate(x.fecha_vencimiento)}` : ''}</Muted><Badge text={label(x.estado)} tone={toneOf(x.estado)} /></Row></Card>))}
      <Section title="Observaciones SST" />
      <Input value={nota} onChangeText={setNota} multiline placeholder="Registrar una observación sobre este trabajador…" />
      <Btn title="Guardar observación" onPress={guardar} loading={busy} disabled={nota.trim().length < 3} />
      {data.o.map((x: any) => (<Card key={x.id}><Body>{x.nota}</Body><Muted style={{ fontSize: 11 }}>{fmtDateTime(x.created_at)}</Muted></Card>))}
    </Screen>
  )
}
