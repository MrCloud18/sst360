import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useT } from '../../lib/auth'
import { Btn, Input, Muted } from '../../components/ui'
import { Logo } from './login'

// Autorregistro: la cuenta queda PENDIENTE hasta que un administrador la apruebe en la web.
export default function Registro() {
  const t = useT(); const router = useRouter(); const ins = useSafeAreaInsets()
  const [nombre, setNombre] = useState(''); const [codigo, setCodigo] = useState(''); const [email, setEmail] = useState('')
  const [pass, setPass] = useState(''); const [pass2, setPass2] = useState(''); const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false); const [err, setErr] = useState<string | null>(null)

  async function submit() {
    setErr(null)
    const mail = email.trim().toLowerCase(), cod = codigo.trim(), nom = nombre.trim().replace(/\s+/g, ' ')
    if (nom.length < 3) return setErr('Escribe tu nombre completo.')
    if (cod.length < 3) return setErr('Escribe tu ID de trabajador.')
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setErr('Escribe un correo válido.')
    if (pass.length < 8) return setErr('La contraseña debe tener al menos 8 caracteres.')
    if (pass !== pass2) return setErr('Las contraseñas no coinciden.')
    setLoading(true)
    try {
      const { data: libre, error: e0 } = await supabase.rpc('codigo_disponible', { p_codigo: cod })
      if (e0) throw e0
      if (libre === false) { setLoading(false); return setErr('Ese ID de trabajador ya está registrado. Si es tuyo, contacta a tu supervisor.') }
      const { data, error } = await supabase.auth.signUp({ email: mail, password: pass, options: { data: { nombre_completo: nom, codigo_trabajador: cod } } })
      if (error) throw error
      if (!data.session) {
        // El proyecto exige confirmar el correo antes de iniciar sesión
        Alert.alert('Revisa tu correo', 'Te enviamos un enlace para confirmar tu correo. Luego inicia sesión; tu cuenta quedará pendiente de aprobación.', [{ text: 'OK', onPress: () => router.replace('/login' as any) }])
      }
      // Con sesión activa, el Gate del layout raíz te lleva a la pantalla "Cuenta pendiente"
    } catch (e: any) {
      const m = String(e?.message ?? '')
      setErr(/registered|already/i.test(m) ? 'Ese correo ya tiene una cuenta. Inicia sesión.' : /network/i.test(m) ? 'Sin conexión. Revisa tu internet.' : /rate|limit/i.test(m) ? 'Demasiados intentos. Espera unos minutos.' : 'No se pudo crear la cuenta. ' + m)
    } finally { setLoading(false) }
  }
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 24 + ins.top, paddingBottom: 40 + ins.bottom, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" style={{ alignSelf: 'flex-start' }}><Ionicons name="arrow-back" size={26} color={t.text} /></Pressable>
        <View style={{ alignItems: 'center', gap: 6 }}><Logo size={56} /><Text style={{ fontSize: 26, fontWeight: '800', color: t.text }}>Crear cuenta</Text>
          <Muted style={{ textAlign: 'center' }}>Tu cuenta será revisada por un administrador antes de poder usarla.</Muted></View>
        <Input label="Nombre completo" value={nombre} onChangeText={setNombre} autoCapitalize="words" textContentType="name" />
        <Input label="ID de trabajador" value={codigo} onChangeText={setCodigo} autoCapitalize="characters" autoCorrect={false} />
        <Input label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} textContentType="emailAddress" />
        <View><Input label="Contraseña (mín. 8 caracteres)" value={pass} onChangeText={setPass} secureTextEntry={!show} autoCapitalize="none" textContentType="newPassword" />
          <Pressable onPress={() => setShow(!show)} style={{ position: 'absolute', right: 14, top: 36 }} accessibilityLabel="Mostrar u ocultar contraseña"><Ionicons name={show ? 'eye' : 'eye-off'} size={22} color={t.muted} /></Pressable></View>
        <Input label="Repite la contraseña" value={pass2} onChangeText={setPass2} secureTextEntry={!show} autoCapitalize="none" textContentType="newPassword" />
        {err && <Text style={{ color: t.danger }} accessibilityRole="alert">{err}</Text>}
        <Btn title="Enviar solicitud" onPress={submit} loading={loading} />
        <Text onPress={() => router.back()} style={{ textAlign: 'center', color: t.muted, marginTop: 6 }}>¿Ya tienes cuenta? Inicia sesión</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
