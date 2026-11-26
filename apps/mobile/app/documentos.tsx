import { Linking, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/auth'
import { useLoad } from '../lib/hooks'
import { fmtDate } from '../lib/format'
import { Body, Card, Empty, ErrorBox, Loading, Muted, Row, Screen } from '../components/ui'
import { View } from 'react-native'

// RF-T12 · Biblioteca de documentos SST (PDF con URL firmada)
export default function Documentos() {
  const t = useT()
  const { data, loading, error, reload } = useLoad(async () => { const { data, error } = await supabase.from('documentos_sst').select('*').order('created_at', { ascending: false }); if (error) throw error; return data ?? [] })
  async function open(d: any) {
    const { data, error } = await supabase.storage.from('documentos-sst').createSignedUrl(d.archivo_url, 600)
    if (error || !data) return Alert.alert('No se pudo abrir el documento', error?.message ?? 'Intenta nuevamente.')
    Linking.openURL(data.signedUrl)
  }
  const size = (b?: number | null) => (!b ? '' : b > 1e6 ? ` · ${(b / 1e6).toFixed(1)} MB` : ` · ${Math.round(b / 1e3)} KB`)
  return (
    <Screen onRefresh={reload}>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : !data?.length ? <Empty text="Tu organización aún no ha publicado documentos." icon="document-outline" /> :
        data.map((d: any) => (
          <Card key={d.id} onPress={() => open(d)}><Row><Ionicons name="document-text" size={30} color={t.primary} />
            <View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{d.titulo}</Body><Muted>{d.categoria ?? 'General'} · v{d.version}{size(d.tamano_bytes)} · {fmtDate(d.created_at)}</Muted></View>
            <Ionicons name="download-outline" size={22} color={t.primary} /></Row></Card>))}
    </Screen>
  )
}
