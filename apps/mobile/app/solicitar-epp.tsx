import { useState } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useLoad } from '../lib/hooks'
import { Btn, Chip, Chips, ErrorBox, Input, Loading, Muted, Screen } from '../components/ui'

// RF-T06 · Solicitud de EPP (nuevo / reposición / cambio)
export default function SolicitarEpp() {
  const { profile } = useAuth(); const router = useRouter()
  const [tipo, setTipo] = useState<'nuevo' | 'reposicion' | 'cambio'>('reposicion'); const [epp, setEpp] = useState<string | null>(null); const [motivo, setMotivo] = useState(''); const [busy, setBusy] = useState(false)
  const { data, loading, error, reload } = useLoad(async () => { const { data, error } = await supabase.from('epp_catalogo').select('id,nombre').order('nombre'); if (error) throw error; return data ?? [] })
  async function send() {
    if (!epp) return Alert.alert('Falta información', 'Selecciona el equipo que necesitas.')
    if (motivo.trim().length < 5) return Alert.alert('Falta información', 'Cuéntanos brevemente el motivo.')
    setBusy(true)
    const { error } = await supabase.from('epp_solicitudes').insert({ trabajador_id: profile!.id, epp_id: epp, tipo_solicitud: tipo, motivo: motivo.trim() })
    setBusy(false)
    if (error) return Alert.alert('No se pudo enviar', error.message)
    Alert.alert('Solicitud enviada', 'Tu supervisor la revisará pronto.', [{ text: 'OK', onPress: () => router.back() }])
  }
  return (
    <Screen>
      <Muted>Tipo de solicitud</Muted>
      <Chips>{(['nuevo', 'reposicion', 'cambio'] as const).map((x) => <Chip key={x} text={x === 'reposicion' ? 'Reposición' : x[0].toUpperCase() + x.slice(1)} active={tipo === x} onPress={() => setTipo(x)} />)}</Chips>
      <Muted>Equipo</Muted>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : <Chips>{data!.map((x: any) => <Chip key={x.id} text={x.nombre} active={epp === x.id} onPress={() => setEpp(x.id)} />)}</Chips>}
      <Input label="Motivo" value={motivo} onChangeText={setMotivo} multiline placeholder="Ej.: las botas se desgastaron / talla incorrecta" />
      <Btn title="Enviar solicitud" onPress={send} loading={busy} />
    </Screen>
  )
}
