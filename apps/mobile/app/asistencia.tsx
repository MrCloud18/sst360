import { useEffect, useRef, useState } from 'react'
import { Alert, Linking, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuth, useT } from '../lib/auth'
import { startOfDay, fmtDateTime } from '../lib/format'
import { uploadImage } from '../lib/upload'
import { Btn, Card, LocationMap, Muted, Screen, Body, Badge } from '../components/ui'

// RF-T03 · Registro de asistencia con fotografía + GPS en tiempo real
export default function Asistencia() {
  const { profile } = useAuth(); const t = useT(); const router = useRouter()
  const [camPerm, askCam] = useCameraPermissions()
  const cam = useRef<CameraView>(null)
  const [loc, setLoc] = useState<Location.LocationObject | null>(null)
  const [locDenied, setLocDenied] = useState(false)
  const [next, setNext] = useState<'entrada' | 'salida'>('entrada')
  const [busy, setBusy] = useState(false); const [ready, setReady] = useState(false)

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined
    ;(async () => {
      const p = await Location.requestForegroundPermissionsAsync()
      if (!p.granted) return setLocDenied(true)
      setLoc(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null))
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, setLoc)
      const { data } = await supabase.from('asistencias').select('tipo').eq('trabajador_id', profile!.id).gte('fecha_hora', startOfDay()).order('fecha_hora', { ascending: false }).limit(1)
      setNext(data?.[0]?.tipo === 'entrada' ? 'salida' : 'entrada')
    })()
    return () => sub?.remove()
  }, [profile?.id])

  async function marcar() {
    if (!loc) return Alert.alert('Sin ubicación', 'Espera a que se obtenga tu ubicación GPS e inténtalo de nuevo.')
    setBusy(true)
    try {
      const photo = await cam.current?.takePictureAsync({ quality: 0.7, skipProcessing: true })
      if (!photo) throw new Error('No se pudo tomar la fotografía.')
      const path = await uploadImage('asistencias-fotos', profile!.id, photo.uri)
      let direccion: string | null = null
      try { const g = await Location.reverseGeocodeAsync(loc.coords); direccion = g[0] ? [g[0].street, g[0].district ?? g[0].city].filter(Boolean).join(', ') : null } catch {}
      const { data, error } = await supabase.from('asistencias').insert({
        trabajador_id: profile!.id, tipo: next, foto_url: path, latitud: loc.coords.latitude, longitud: loc.coords.longitude, direccion_texto: direccion,
      }).select().single()
      if (error) throw error
      Alert.alert(next === 'entrada' ? 'Entrada registrada' : 'Salida registrada', `${fmtDateTime(data.fecha_hora)}${data.estado === 'tardanza' ? '\nMarcada con tardanza.' : ''}`, [{ text: 'OK', onPress: () => router.back() }])
    } catch (e: any) {
      Alert.alert('No se pudo registrar', e?.message?.includes('Network') ? 'Sin conexión. Inténtalo cuando tengas internet.' : e?.message ?? 'Error inesperado')
    } finally { setBusy(false) }
  }

  if (!camPerm) return <Screen><Muted>Verificando permisos…</Muted></Screen>
  if (!camPerm.granted) return (
    <Screen><Card style={{ gap: 12 }}><Body style={{ fontWeight: '700' }}>Necesitamos tu cámara</Body><Muted>La fotografía es la evidencia de tu marcación de asistencia.</Muted>
      <Btn title="Permitir cámara" onPress={() => (camPerm.canAskAgain ? askCam() : Linking.openSettings())} /></Card></Screen>)
  if (locDenied) return (
    <Screen><Card style={{ gap: 12 }}><Body style={{ fontWeight: '700' }}>Necesitamos tu ubicación</Body><Muted>Activa el permiso de ubicación para verificar el lugar de tu marcación.</Muted>
      <Btn title="Abrir ajustes" onPress={() => Linking.openSettings()} /></Card></Screen>)
  return (
    <Screen>
      <View style={{ height: 320, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' }}>
        <CameraView ref={cam} style={{ flex: 1 }} facing="front" onCameraReady={() => setReady(true)} />
      </View>
      <Card style={{ gap: 8 }}><LocationMap lat={loc?.coords.latitude} lng={loc?.coords.longitude} />
        {!loc && <Muted>Obteniendo ubicación GPS…</Muted>}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Body>Fecha: {fmtDateTime(new Date().toISOString())}</Body>
          {loc && <Badge text={`±${Math.round(loc.coords.accuracy ?? 0)} m`} tone="info" />}</View></Card>
      <Btn title={next === 'entrada' ? 'Marcar entrada' : 'Marcar salida'} onPress={marcar} loading={busy} disabled={!ready || !loc} icon="camera" />
    </Screen>
  )
}
