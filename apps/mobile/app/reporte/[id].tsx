import { useState } from 'react'
import { Alert, Image, Modal, Pressable, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useLoad } from '../../lib/hooks'
import { fmtDateTime, label } from '../../lib/format'
import { signedUrls } from '../../lib/upload'
import { Badge, Body, Btn, Card, ErrorBox, Input, Loading, Muted, Row, Screen, toneOf } from '../../components/ui'

// RF-S07/S08/S09 · Revisión, seguimiento (Pendiente → En proceso → Cerrado) y visor ampliable de evidencias
export default function Reporte() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { profile } = useAuth(); const router = useRouter()
  const [obs, setObs] = useState(''); const [busy, setBusy] = useState(false); const [zoom, setZoom] = useState<string | null>(null)
  const { data, loading, error, reload } = useLoad(async () => {
    const { data, error } = await supabase.from('reportes_subestandar').select('*,worker:profiles!trabajador_id(nombre_completo),area:areas(nombre)').eq('id', id).single()
    if (error) throw error
    return { r: data, urls: await signedUrls('reportes-evidencias', data.evidencias_urls ?? []) }
  }, [id])
  async function setEstado(estado: 'en_proceso' | 'cerrado') {
    if (estado === 'cerrado' && obs.trim().length < 5) return Alert.alert('Falta información', 'Describe las acciones tomadas para cerrar el caso.')
    setBusy(true)
    const { error } = await supabase.from('reportes_subestandar').update({ estado, supervisor_id: profile!.id, observaciones_cierre: obs.trim() || data?.r.observaciones_cierre || null }).eq('id', id)
    setBusy(false)
    if (error) return Alert.alert('No se pudo actualizar', error.message)
    if (estado === 'cerrado') router.back(); else reload()
  }
  if (loading) return <Loading />
  if (error || !data) return <Screen><ErrorBox msg={error ?? 'No encontrado'} onRetry={reload} /></Screen>
  const r = data.r
  return (
    <Screen>
      <Row style={{ flexWrap: 'wrap' }}>{(r.evidencias_urls ?? []).map((p: string) => data.urls[p] && (
        <Pressable key={p} onPress={() => setZoom(data.urls[p])}><Image source={{ uri: data.urls[p] }} style={{ width: 150, height: 110, borderRadius: 12 }} /></Pressable>))}</Row>
      {!r.evidencias_urls?.length && <Muted>Sin evidencias adjuntas.</Muted>}
      <Card style={{ gap: 6 }}><Row style={{ justifyContent: 'space-between' }}><Badge text={label(r.severidad)} tone={toneOf(r.severidad)} /><Badge text={label(r.estado)} tone={toneOf(r.estado)} /></Row>
        <Muted>Reportado por: {r.worker?.nombre_completo}</Muted><Muted>Área: {r.area?.nombre ?? '—'} · {label(r.tipo)} · {r.categoria}</Muted><Muted>{fmtDateTime(r.created_at)}</Muted>
        <Body>{r.descripcion}</Body>{r.observaciones_cierre && <Muted>Acciones tomadas: {r.observaciones_cierre}</Muted>}</Card>
      {r.estado !== 'cerrado' && (<>
        <Input label="Acciones tomadas / observaciones" value={obs} onChangeText={setObs} multiline />
        {r.estado === 'pendiente' && <Btn title="Marcar en proceso" variant="ghost" onPress={() => setEstado('en_proceso')} disabled={busy} />}
        <Btn title="Cerrar caso" onPress={() => setEstado('cerrado')} loading={busy} /></>)}
      <Modal visible={!!zoom} transparent animationType="fade" onRequestClose={() => setZoom(null)}>
        <Pressable onPress={() => setZoom(null)} style={{ flex: 1, backgroundColor: '#000000ee', justifyContent: 'center' }}>
          {zoom && <Image source={{ uri: zoom }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
          <View style={{ position: 'absolute', top: 50, right: 20 }}><Ionicons name="close-circle" size={36} color="#fff" /></View></Pressable></Modal>
    </Screen>
  )
}
