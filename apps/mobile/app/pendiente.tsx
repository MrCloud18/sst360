import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth, useT } from '../lib/auth'
import { Btn, Card, Muted } from '../components/ui'

// Pantalla que ve quien se registró y aún no fue aprobado (o fue rechazado). Se actualiza sola cada 15 s.
export default function Pendiente() {
  const { profile, refreshProfile, signOut } = useAuth(); const t = useT(); const [busy, setBusy] = useState(false)
  const rejected = profile?.estado_cuenta === 'rechazado'
  useEffect(() => { const i = setInterval(() => { refreshProfile() }, 15000); return () => clearInterval(i) }, [refreshProfile])
  async function check() { setBusy(true); await refreshProfile(); setBusy(false) }
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', padding: 24, gap: 18 }}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Ionicons name={rejected ? 'close-circle' : 'hourglass-outline'} size={72} color={rejected ? t.danger : t.warn} />
        <Text style={{ fontSize: 24, fontWeight: '800', color: t.text, textAlign: 'center' }}>{rejected ? 'Solicitud rechazada' : 'Cuenta pendiente de aprobación'}</Text>
      </View>
      <Card style={{ gap: 6 }}>
        <Text style={{ color: t.text, fontWeight: '600' }}>{profile?.nombre_completo}</Text>
        <Muted>{profile?.email}{profile?.codigo_trabajador ? ` · ID ${profile.codigo_trabajador}` : ''}</Muted>
        <Muted>{rejected ? 'Un administrador rechazó tu solicitud. Si crees que es un error, comunícate con tu supervisor.' : 'Un administrador debe aprobar tu cuenta y asignarte área y supervisor. Te avisaremos aquí apenas esté lista; puedes cerrar la app y volver más tarde.'}</Muted>
      </Card>
      {!rejected && <Btn title="Actualizar estado" icon="refresh" onPress={check} loading={busy} />}
      <Btn title="Cerrar sesión" variant="ghost" onPress={signOut} />
    </View>
  )
}
