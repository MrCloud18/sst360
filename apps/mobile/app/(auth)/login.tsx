import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, View, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle, Defs, LinearGradient as LG, Stop } from 'react-native-svg'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'expo-router'
import { Btn, Input } from '../../components/ui'
import { useT } from '../../lib/auth'

export function Logo({ size = 72 }: { size?: number }) {
  return (<Svg width={size} height={size} viewBox="0 0 48 48"><Defs><LG id="g" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#7C3AED" /><Stop offset="1" stopColor="#06B6D4" /></LG></Defs>
    <Circle cx="24" cy="24" r="21" fill="none" stroke="url(#g)" strokeWidth="6" strokeDasharray="38 18" strokeLinecap="round" />
    <Circle cx="24" cy="24" r="10" fill="none" stroke="url(#g)" strokeWidth="5" strokeDasharray="20 12" strokeLinecap="round" transform="rotate(120 24 24)" /></Svg>)
}
export default function Login() {
  const t = useT(); const router = useRouter()
  const [user, setUser] = useState(''); const [pass, setPass] = useState(''); const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false); const [err, setErr] = useState<string | null>(null)

  async function submit() {
    setErr(null)
    if (!user.trim() || !pass) return setErr('Ingresa tu usuario y contraseña.')
    setLoading(true)
    try {
      let email = user.trim()
      if (!email.includes('@')) {
        const { data } = await supabase.rpc('email_por_codigo', { p_codigo: email })
        if (!data) throw new Error('bad')
        email = data as string
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) throw error
      // La redirección por rol la hace el Gate del layout raíz
    } catch (e: any) {
      setErr(e?.message?.includes('Network') ? 'Sin conexión. Revisa tu internet.' : 'Usuario o contraseña incorrectos.')
    } finally { setLoading(false) }
  }
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', padding: 24 }}>
      <View style={{ alignItems: 'center', marginBottom: 36, gap: 10 }}><Logo />
        <Text style={{ fontSize: 34, fontWeight: '800', color: t.text }}>SST <Text style={{ color: t.primary }}>360</Text></Text></View>
      <View style={{ gap: 14 }}>
        <Input placeholder="Usuario o ID de trabajador" value={user} onChangeText={setUser} autoCapitalize="none" autoCorrect={false} textContentType="username" />
        <View><Input placeholder="Contraseña" value={pass} onChangeText={setPass} secureTextEntry={!show} autoCapitalize="none" textContentType="password" />
          <Pressable onPress={() => setShow(!show)} style={{ position: 'absolute', right: 14, top: 13 }} accessibilityLabel="Mostrar u ocultar contraseña"><Ionicons name={show ? 'eye' : 'eye-off'} size={22} color={t.muted} /></Pressable></View>
        {err && <Text style={{ color: t.danger }} accessibilityRole="alert">{err}</Text>}
        <Btn title="Iniciar sesión" onPress={submit} loading={loading} />
        <Btn title="Crear cuenta" variant="ghost" onPress={() => router.push('/registro' as any)} />
        <Text onPress={() => Alert.alert('Recuperar contraseña', 'Solicita el restablecimiento a tu supervisor o administrador.')} style={{ textAlign: 'center', color: t.muted, marginTop: 10 }}>¿Olvidaste tu contraseña?</Text>
      </View>
    </KeyboardAvoidingView>
  )
}
