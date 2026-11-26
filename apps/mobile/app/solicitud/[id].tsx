import { useState } from 'react'
import { Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useLoad } from '../../lib/hooks'
import { fmtDateTime, label } from '../../lib/format'
import { Badge, Body, Btn, Card, ErrorBox, Input, Loading, Muted, Screen, Stepper, toneOf } from '../../components/ui'

// RF-S06 · Aprobar o rechazar solicitud de EPP (con comentario; el trabajador recibe notificación por trigger)
export default function Solicitud() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { profile } = useAuth(); const router = useRouter()
  const [comentario, setComentario] = useState(''); const [busy, setBusy] = useState(false)
  const { data, loading, error, reload } = useLoad(async () => {
    const { data, error } = await supabase.from('epp_solicitudes').select('*,worker:profiles!trabajador_id(nombre_completo,codigo_trabajador),epp:epp_catalogo(nombre,stock_disponible)').eq('id', id).single()
    if (error) throw error; return data
  }, [id])
  async function setEstado(estado: 'en_revision' | 'aprobado' | 'rechazado') {
    if (estado === 'rechazado' && comentario.trim().length < 3) return Alert.alert('Falta el motivo', 'Indica el motivo del rechazo en el comentario.')
    setBusy(true)
    const { error } = await supabase.from('epp_solicitudes').update({ estado, revisado_por: profile!.id, comentario_revision: comentario.trim() || null }).eq('id', id)
    setBusy(false)
    if (error) return Alert.alert('No se pudo actualizar', error.message)
    if (estado === 'en_revision') reload(); else router.back()
  }
  if (loading) return <Loading />
  if (error || !data) return <Screen><ErrorBox msg={error ?? 'No encontrada'} onRetry={reload} /></Screen>
  const closed = ['aprobado', 'rechazado'].includes(data.estado)
  return (
    <Screen>
      <Card style={{ gap: 6 }}><Body style={{ fontWeight: '700', fontSize: 18 }}>{data.epp?.nombre}</Body>
        <Muted>Solicitante: {data.worker?.nombre_completo} {data.worker?.codigo_trabajador ? `(${data.worker.codigo_trabajador})` : ''}</Muted>
        <Muted>Tipo: {label(data.tipo_solicitud)} · {fmtDateTime(data.created_at)}</Muted><Muted>Stock disponible: {data.epp?.stock_disponible}</Muted>
        <Body>Motivo: {data.motivo ?? '—'}</Body>
        <Stepper steps={data.estado === 'rechazado' ? ['Enviado', 'En revisión', 'Rechazado'] : ['Enviado', 'En revisión', 'Aprobado']} current={data.estado === 'enviado' ? 0 : data.estado === 'en_revision' ? 1 : 2} rejected={data.estado === 'rechazado'} />
        <Badge text={label(data.estado)} tone={toneOf(data.estado)} /></Card>
      {closed ? <Card><Muted>Comentario de revisión: {data.comentario_revision ?? '—'}</Muted></Card> : (<>
        <Input label="Comentario (obligatorio al rechazar)" value={comentario} onChangeText={setComentario} multiline />
        {data.estado === 'enviado' && <Btn title="Marcar en revisión" variant="ghost" onPress={() => setEstado('en_revision')} disabled={busy} />}
        <Btn title="Aprobar solicitud" onPress={() => setEstado('aprobado')} loading={busy} />
        <Btn title="Rechazar" variant="danger" onPress={() => setEstado('rechazado')} disabled={busy} /></>)}
    </Screen>
  )
}
