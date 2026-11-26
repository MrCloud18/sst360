import { ReactNode } from 'react'
import { ActivityIndicator, Image, Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useT } from '../lib/auth'
import { gradient } from '../lib/theme'
import { WebView } from 'react-native-webview'

export function Screen({ children, onRefresh, refreshing = false, pad = true, bottom = 24 }: { children: ReactNode; onRefresh?: () => void; refreshing?: boolean; pad?: boolean; bottom?: number }) {
  const t = useT(); const ins = useSafeAreaInsets()
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: pad ? 16 : 0, paddingTop: 12, paddingBottom: bottom + ins.bottom, gap: 14 }}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} /> : undefined}>
      {children}
    </ScrollView>
  )
}
export const H1 = ({ children }: { children: ReactNode }) => { const t = useT(); return <Text style={{ fontSize: 24, fontWeight: '700', color: t.text }}>{children}</Text> }
export const H2 = ({ children }: { children: ReactNode }) => { const t = useT(); return <Text style={{ fontSize: 17, fontWeight: '600', color: t.text }}>{children}</Text> }
export const Muted = ({ children, style }: { children: ReactNode; style?: any }) => { const t = useT(); return <Text style={[{ fontSize: 13, color: t.muted }, style]}>{children}</Text> }
export const Body = ({ children, style }: { children: ReactNode; style?: any }) => { const t = useT(); return <Text style={[{ fontSize: 15, color: t.text }, style]}>{children}</Text> }

export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const t = useT()
  const s = [{ backgroundColor: t.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: t.border }, style]
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [...s, pressed && { opacity: 0.85 }]} accessibilityRole="button">{children}</Pressable> : <View style={s}>{children}</View>
}
export function Btn({ title, onPress, loading, disabled, variant = 'primary', icon }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger' | 'ok'; icon?: any }) {
  const t = useT(); const off = disabled || loading
  const inner = (c: string) => (<View style={styles.btnRow}>{loading ? <ActivityIndicator color={c} /> : <>{icon && <Ionicons name={icon} size={18} color={c} />}<Text style={{ color: c, fontWeight: '600', fontSize: 16 }}>{title}</Text></>}</View>)
  if (variant === 'primary') return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button" style={{ opacity: off ? 0.5 : 1 }}>
      <LinearGradient colors={gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>{inner('#fff')}</LinearGradient></Pressable>)
  const c = variant === 'danger' ? t.danger : variant === 'ok' ? t.ok : t.text
  return (<Pressable onPress={onPress} disabled={off} accessibilityRole="button" style={[styles.btn, { borderWidth: 1.5, borderColor: variant === 'ghost' ? t.border : c, opacity: off ? 0.5 : 1 }]}>{inner(c)}</Pressable>)
}
export function Badge({ text, tone = 'neutral' }: { text: string; tone?: 'ok' | 'warn' | 'danger' | 'info' | 'neutral' }) {
  const t = useT()
  const c = { ok: t.ok, warn: t.warn, danger: t.danger, info: t.secondary, neutral: t.muted }[tone]
  return <View style={{ backgroundColor: c + '26', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}><Text style={{ color: c, fontSize: 12, fontWeight: '600' }}>{text}</Text></View>
}
export const toneOf = (v?: string | null): any =>
  ['aprobado', 'cerrado', 'realizado', 'completado', 'puntual', 'asignado', 'leve'].includes(v ?? '') ? 'ok'
  : ['pendiente', 'en_revision', 'en_proceso', 'moderado', 'programado', 'tardanza', 'inscrito', 'enviado'].includes(v ?? '') ? 'warn'
  : ['rechazado', 'critico', 'vencido', 'ausente'].includes(v ?? '') ? 'danger' : 'neutral'

export function Kpi({ label, value, color, onPress, grad }: { label: string; value: ReactNode; color?: string; onPress?: () => void; grad?: boolean }) {
  const t = useT()
  const body = (<><Text style={{ fontSize: 12, color: grad ? '#fff' : t.muted }}>{label}</Text><Text style={{ fontSize: 26, fontWeight: '700', color: grad ? '#fff' : color ?? t.text, marginTop: 2 }}>{value}</Text></>)
  if (grad) return <LinearGradient colors={gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.kpi, { borderRadius: 16 }]}>{body}</LinearGradient>
  return <Card onPress={onPress} style={styles.kpi}>{body}</Card>
}
export const Loading = () => { const t = useT(); return <View style={{ padding: 40 }}><ActivityIndicator color={t.primary} size="large" /></View> }
export const Empty = ({ text, icon = 'file-tray-outline' }: { text: string; icon?: any }) => { const t = useT(); return <View style={{ alignItems: 'center', padding: 28, gap: 8 }}><Ionicons name={icon} size={36} color={t.muted} /><Muted style={{ textAlign: 'center' }}>{text}</Muted></View> }
export function ErrorBox({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  const t = useT()
  return <Card style={{ borderColor: t.danger }}><Text style={{ color: t.danger, fontWeight: '600' }}>No pudimos cargar la información</Text><Muted>{msg}</Muted>{onRetry && <View style={{ marginTop: 10 }}><Btn title="Reintentar" onPress={onRetry} variant="ghost" /></View>}</Card>
}
export function Input({ label, ...p }: TextInputProps & { label?: string }) {
  const t = useT()
  return (<View style={{ gap: 6 }}>{label && <Muted>{label}</Muted>}
    <TextInput placeholderTextColor={t.muted} {...p} style={[{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: t.text }, p.multiline && { minHeight: 90, textAlignVertical: 'top' }, p.style]} /></View>)
}
export function Chip({ text, active, onPress, color }: { text: string; active?: boolean; onPress: () => void; color?: string }) {
  const t = useT(); const c = color ?? t.primary
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1.5, borderColor: active ? c : t.border, backgroundColor: active ? c + '22' : 'transparent' }}><Text style={{ color: active ? c : t.text, fontWeight: '600', fontSize: 14 }}>{text}</Text></Pressable>
}
export const Chips = ({ children }: { children: ReactNode }) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>

export function Ring({ pct, size = 96, label }: { pct: number; size?: number; label?: string }) {
  const t = useT(); const r = (size - 14) / 2, c = 2 * Math.PI * r
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.border} strokeWidth={10} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.secondary} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={`${(c * Math.min(pct, 100)) / 100} ${c}`} />
      </Svg>
      <Text style={{ color: t.text, fontWeight: '700', fontSize: size / 4.2 }}>{label ?? `${Math.round(pct)}%`}</Text>
    </View>
  )
}
export function Bars({ data, height = 90 }: { data: { l: string; v: number }[]; height?: number }) {
  const t = useT(); const max = Math.max(...data.map((d) => d.v), 1)
  return (<View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: height + 22 }}>
    {data.map((d, i) => (<View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Text style={{ color: t.muted, fontSize: 10 }}>{d.v}</Text>
      <LinearGradient colors={gradient as any} style={{ width: '100%', height: Math.max((d.v / max) * height, 3), borderRadius: 4 }} />
      <Text style={{ color: t.muted, fontSize: 10 }}>{d.l}</Text></View>))}
  </View>)
}
export function Stepper({ steps, current, rejected }: { steps: string[]; current: number; rejected?: boolean }) {
  const t = useT()
  return (<View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
    {steps.map((s, i) => { const done = i <= current; const col = rejected && i === current ? t.danger : done ? t.primary : t.border
      return (<View key={s} style={{ flex: 1, alignItems: i === 0 ? 'flex-start' : i === steps.length - 1 ? 'flex-end' : 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          <View style={{ flex: 1, height: 3, backgroundColor: i === 0 ? 'transparent' : done ? t.primary : t.border }} />
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: col }} />
          <View style={{ flex: 1, height: 3, backgroundColor: i === steps.length - 1 ? 'transparent' : i < current ? t.primary : t.border }} /></View>
        <Text style={{ color: t.muted, fontSize: 11, marginTop: 4 }}>{s}</Text></View>) })}
  </View>)
}
export function Avatar({ uri, name, size = 40 }: { uri?: string | null; name?: string; size?: number }) {
  const t = useT()
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.border }} />
  return <LinearGradient colors={gradient as any} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: size / 2.3 }}>{(name ?? '?').slice(0, 1).toUpperCase()}</Text></LinearGradient>
}
export function Row({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const inner = <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>{children}</View>
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner
}
// Mapa: usa react-native-maps solo si hay llave de Google (Android) o en iOS; si no, muestra coordenadas con enlace.
export function LocationMap({ lat, lng, height = 160 }: { lat?: number | null; lng?: number | null; height?: number }) {
  const t = useT()
  if (lat == null || lng == null) return <Muted>Sin ubicación registrada.</Muted>
  const la = Number(lat), lo = Number(lng)
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"/>
<style>html,body,#m{height:100%;margin:0}</style></head><body><div id="m"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
<script>
var m=L.map('m',{zoomControl:false,dragging:false,scrollWheelZoom:false,touchZoom:false,doubleClickZoom:false}).setView([${la},${lo}],17);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m);
L.marker([${la},${lo}]).addTo(m);
</script></body></html>`
  const open = () => Linking.openURL(`https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=17/${la}/${lo}`)
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: t.border }}>
        <WebView originWhitelist={['*']} source={{ html, baseUrl: 'https://sst360.app' }} scrollEnabled={false} javaScriptEnabled />
      </View>
      <Text onPress={open} style={{ color: t.secondary, fontSize: 12 }}>{la.toFixed(5)}, {lo.toFixed(5)} · Abrir mapa completo</Text>
    </View>
  )
}
export const Section = ({ title, right }: { title: string; right?: ReactNode }) => <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}><H2>{title}</H2>{right}</View>

const styles = StyleSheet.create({
  btn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kpi: { flex: 1, minWidth: 100, padding: 14 },
})
