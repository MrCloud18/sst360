import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '../lib/auth'

const HOME: Record<string, string> = { trabajador: '/worker', supervisor: '/supervisor', administrador: '/admin' }
const FOLDER: Record<string, string> = { trabajador: 'worker', supervisor: 'supervisor', administrador: 'admin' }

function Gate() {
  const { session, profile, loading, theme } = useAuth()
  const segments = useSegments() as string[]
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!session) { if (!inAuth) router.replace('/login' as any); return }
    if (!profile) return
    // Cuenta registrada pero aún sin aprobar (o rechazada)
    if (!profile.activo) { if (segments[0] !== 'pendiente') router.replace('/pendiente' as any); return }
    const own = FOLDER[profile.rol]
    const roleFolders = ['worker', 'supervisor', 'admin']
    if (inAuth || segments.length === 0 || segments[0] === 'pendiente' || (roleFolders.includes(segments[0]) && segments[0] !== own)) router.replace(HOME[profile.rol] as any)
  }, [session, profile, loading, segments])

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F8' }}><ActivityIndicator size="large" color="#7C3AED" /></View>
  const header = { headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.text, headerTitleStyle: { fontWeight: '600' as const }, headerShadowVisible: false, headerBackTitle: 'Atrás' }
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack screenOptions={header}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="pendiente" options={{ headerShown: false }} />
        <Stack.Screen name="worker" options={{ headerShown: false }} />
        <Stack.Screen name="supervisor" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="asistencia" options={{ title: 'Registro de asistencia' }} />
        <Stack.Screen name="historial" options={{ title: 'Mi asistencia' }} />
        <Stack.Screen name="reportar" options={{ title: 'Reportar condición subestándar' }} />
        <Stack.Screen name="solicitar-epp" options={{ title: 'Solicitar EPP' }} />
        <Stack.Screen name="documentos" options={{ title: 'Documentos SST' }} />
        <Stack.Screen name="notificaciones" options={{ title: 'Notificaciones' }} />
        <Stack.Screen name="gestion-capacitaciones" options={{ title: 'Capacitaciones del equipo' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
        <Stack.Screen name="solicitud/[id]" options={{ title: 'Solicitud de EPP' }} />
        <Stack.Screen name="reporte/[id]" options={{ title: 'Validación de reporte' }} />
        <Stack.Screen name="trabajador/[id]" options={{ title: 'Detalle del trabajador' }} />
      </Stack>
    </>
  )
}
export default function Root() {
  return (<SafeAreaProvider><AuthProvider><Gate /></AuthProvider></SafeAreaProvider>)
}
