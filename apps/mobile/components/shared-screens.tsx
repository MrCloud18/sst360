import { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth, useT } from '../lib/auth'
import { useLoad } from '../lib/hooks'
import { uploadImage } from '../lib/upload'
import { Avatar, Badge, Btn, Card, Empty, ErrorBox, H2, Input, Loading, Muted, Row, Screen, Body } from './ui'

// ---- Lista de contactos de mensajería (RF-T16, S17, A18) ----
export function MensajesScreen() {
  const { profile } = useAuth(); const t = useT(); const router = useRouter()
  const { data, loading, error, reload } = useLoad(async () => {
    let q = supabase.from('profiles').select('id,nombre_completo,rol,avatar_url').eq('activo', true).neq('id', profile!.id).order('nombre_completo')
    if (profile!.rol === 'trabajador') q = q.neq('rol', 'trabajador')           // trabajador ↔ supervisor / administrador
    if (profile!.rol === 'supervisor') q = q.neq('id', profile!.id)
    const [people, un] = await Promise.all([q, supabase.from('mensajes').select('remitente_id').eq('destinatario_id', profile!.id).eq('leido', false)])
    if (people.error) throw people.error
    const counts: Record<string, number> = {}; (un.data ?? []).forEach((m: any) => (counts[m.remitente_id] = (counts[m.remitente_id] ?? 0) + 1))
    return { people: people.data ?? [], counts }
  }, [profile?.id])
  return (
    <Screen onRefresh={reload}>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : !data?.people.length ? <Empty text="No hay contactos disponibles." icon="chatbubbles-outline" /> :
        data.people.map((p: any) => (
          <Card key={p.id} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: p.id, name: p.nombre_completo } } as any)}>
            <Row><Avatar name={p.nombre_completo} uri={p.avatar_url} /><View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{p.nombre_completo}</Body><Muted>{p.rol}</Muted></View>
              {!!data.counts[p.id] && <View style={{ backgroundColor: t.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ color: '#fff', fontSize: 12 }}>{data.counts[p.id]}</Text></View>}
              <Ionicons name="chevron-forward" size={18} color={t.muted} /></Row></Card>))}
    </Screen>
  )
}

// ---- Perfil: editar teléfono, avatar, contraseña, cerrar sesión (RF-T13, T15, S16, A19) ----
export function PerfilScreen() {
  const { profile, refreshProfile, signOut } = useAuth()
  const [tel, setTel] = useState(profile?.telefono ?? ''); const [pass, setPass] = useState(''); const [busy, setBusy] = useState(false)
  const { data: extra } = useLoad(async () => {
    const [a, s] = await Promise.all([
      profile!.area_id ? supabase.from('areas').select('nombre').eq('id', profile!.area_id).single() : Promise.resolve({ data: null } as any),
      profile!.supervisor_id ? supabase.from('profiles').select('nombre_completo').eq('id', profile!.supervisor_id).single() : Promise.resolve({ data: null } as any)])
    return { area: a.data?.nombre, sup: s.data?.nombre_completo }
  }, [profile?.id])

  async function saveTel() {
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ telefono: tel || null }).eq('id', profile!.id)
    setBusy(false); if (error) return Alert.alert('Error', error.message)
    await refreshProfile(); Alert.alert('Listo', 'Teléfono actualizado.')
  }
  async function changeAvatar() {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!p.granted) return Alert.alert('Permiso necesario', 'Permite el acceso a tus fotos para cambiar el avatar.')
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 })
    if (r.canceled) return
    setBusy(true)
    try {
      const path = await uploadImage('avatars', profile!.id, r.assets[0].uri)
      const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile!.id)
      if (error) throw error; await refreshProfile()
    } catch (e: any) { Alert.alert('No se pudo subir la foto', e.message) } finally { setBusy(false) }
  }
  async function changePass() {
    if (pass.length < 8) return Alert.alert('Contraseña débil', 'Usa al menos 8 caracteres.')
    setBusy(true); const { error } = await supabase.auth.updateUser({ password: pass }); setBusy(false)
    if (error) return Alert.alert('Error', error.message)
    setPass(''); Alert.alert('Listo', 'Contraseña actualizada.')
  }
  if (!profile) return <Loading />
  return (
    <Screen>
      <Card><Row><Avatar name={profile.nombre_completo} uri={profile.avatar_url} size={72} />
        <View style={{ flex: 1, gap: 2 }}><H2>{profile.nombre_completo}</H2><Muted>Rol: {profile.rol}</Muted>{profile.codigo_trabajador && <Muted>ID: {profile.codigo_trabajador}</Muted>}
          {extra?.area && <Muted>Área: {extra.area}</Muted>}{extra?.sup && <Muted>Supervisor: {extra.sup}</Muted>}</View></Row>
        <View style={{ marginTop: 12 }}><Btn title="Cambiar foto" icon="camera" variant="ghost" onPress={changeAvatar} disabled={busy} /></View></Card>
      <Card style={{ gap: 12 }}><H2>Datos de contacto</H2><Muted>{profile.email}</Muted>
        <Input label="Teléfono" value={tel} onChangeText={setTel} keyboardType="phone-pad" placeholder="999 999 999" />
        <Btn title="Guardar teléfono" onPress={saveTel} loading={busy} /></Card>
      <Card style={{ gap: 12 }}><H2>Cambiar contraseña</H2>
        <Input label="Nueva contraseña (mín. 8)" value={pass} onChangeText={setPass} secureTextEntry autoCapitalize="none" />
        <Btn title="Actualizar contraseña" variant="ghost" onPress={changePass} disabled={busy} /></Card>
      <Btn title="Cerrar sesión" variant="danger" icon="log-out-outline" onPress={() => Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Salir', style: 'destructive', onPress: signOut }])} />
    </Screen>
  )
}
