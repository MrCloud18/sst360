import { useState } from 'react'
import { Alert, Image, Pressable, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth, useT } from '../lib/auth'
import { uploadImage } from '../lib/upload'
import { CATEGORIAS_REPORTE } from '../lib/shared'
import { Btn, Chip, Chips, Input, Muted, Row, Screen } from '../components/ui'

// RF-T07 reporte de acción/condición subestándar · RF-T08 evidencias (cámara o galería)
export default function Reportar() {
  const { profile } = useAuth(); const t = useT(); const router = useRouter()
  const [tipo, setTipo] = useState<'accion' | 'condicion'>('condicion')
  const [sev, setSev] = useState<'leve' | 'moderado' | 'critico'>('leve')
  const [cat, setCat] = useState<string | null>(null); const [desc, setDesc] = useState('')
  const [fotos, setFotos] = useState<string[]>([]); const [busy, setBusy] = useState(false)

  async function camera() {
    const p = await ImagePicker.requestCameraPermissionsAsync()
    if (!p.granted) return Alert.alert('Permiso necesario', 'Permite el acceso a la cámara para tomar la evidencia.')
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 }); if (!r.canceled) setFotos((f) => [...f, r.assets[0].uri].slice(0, 5))
  }
  async function gallery() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 5, quality: 0.8 })
    if (!r.canceled) setFotos((f) => [...f, ...r.assets.map((a) => a.uri)].slice(0, 5))
  }
  async function enviar() {
    if (!cat) return Alert.alert('Falta información', 'Selecciona una categoría.')
    if (desc.trim().length < 10) return Alert.alert('Falta información', 'Describe el riesgo con más detalle (mínimo 10 caracteres).')
    setBusy(true)
    try {
      const paths: string[] = []
      for (const uri of fotos) paths.push(await uploadImage('reportes-evidencias', profile!.id, uri))
      const { error } = await supabase.from('reportes_subestandar').insert({
        trabajador_id: profile!.id, area_id: profile!.area_id, tipo, categoria: cat, severidad: sev, descripcion: desc.trim(), evidencias_urls: paths,
      })
      if (error) throw error
      Alert.alert('Reporte enviado', 'Tu supervisor fue notificado. ¡Gracias por cuidar la seguridad!', [{ text: 'OK', onPress: () => router.back() }])
    } catch (e: any) { Alert.alert('No se pudo enviar', e?.message ?? 'Error inesperado') } finally { setBusy(false) }
  }
  return (
    <Screen>
      <Pressable onPress={() => Alert.alert('Adjuntar fotografía', undefined, [{ text: 'Cámara', onPress: camera }, { text: 'Galería', onPress: gallery }, { text: 'Cancelar', style: 'cancel' }])}
        style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.border, borderRadius: 16, padding: 22, alignItems: 'center', gap: 6 }} accessibilityRole="button">
        <Ionicons name="camera-outline" size={36} color={t.muted} /><Muted>Adjuntar fotografía ({fotos.length}/5)</Muted></Pressable>
      {!!fotos.length && <Row style={{ flexWrap: 'wrap' }}>{fotos.map((u, i) => (
        <Pressable key={u} onPress={() => setFotos(fotos.filter((_, k) => k !== i))} accessibilityLabel="Quitar foto"><Image source={{ uri: u }} style={{ width: 64, height: 64, borderRadius: 10 }} />
          <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: t.danger, borderRadius: 10 }}><Ionicons name="close" size={16} color="#fff" /></View></Pressable>))}</Row>}
      <Muted>¿Qué estás reportando?</Muted>
      <Chips><Chip text="Condición subestándar" active={tipo === 'condicion'} onPress={() => setTipo('condicion')} /><Chip text="Acción subestándar" active={tipo === 'accion'} onPress={() => setTipo('accion')} /></Chips>
      <Muted>Severidad</Muted>
      <Chips>{(['leve', 'moderado', 'critico'] as const).map((s) => <Chip key={s} text={s === 'critico' ? 'Crítico' : s[0].toUpperCase() + s.slice(1)} active={sev === s} color={s === 'critico' ? t.danger : s === 'moderado' ? t.warn : t.ok} onPress={() => setSev(s)} />)}</Chips>
      <Muted>Categoría</Muted>
      <Chips>{CATEGORIAS_REPORTE.map((c) => <Chip key={c} text={c} active={cat === c} onPress={() => setCat(c)} />)}</Chips>
      <Input label="Descripción del reporte" value={desc} onChangeText={setDesc} multiline placeholder="¿Qué viste y dónde? (ej.: cable expuesto en sector 2)" />
      <Btn title="Enviar reporte" onPress={enviar} loading={busy} />
    </Screen>
  )
}
