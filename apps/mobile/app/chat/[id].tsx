import { useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useAuth, useT } from '../../lib/auth'
import { fmtTime } from '../../lib/format'
import { Empty, Loading } from '../../components/ui'

// Chat en tiempo real con Supabase Realtime (RF-T16, S17, A18)
export default function Chat() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  const { profile } = useAuth(); const t = useT(); const ins = useSafeAreaInsets()
  const [msgs, setMsgs] = useState<any[]>([]); const [text, setText] = useState(''); const [loading, setLoading] = useState(true)
  const list = useRef<FlatList>(null); const me = profile!.id

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data } = await supabase.from('mensajes').select('*')
        .or(`and(remitente_id.eq.${me},destinatario_id.eq.${id}),and(remitente_id.eq.${id},destinatario_id.eq.${me})`).order('created_at').limit(300)
      if (alive) { setMsgs(data ?? []); setLoading(false) }
      await supabase.from('mensajes').update({ leido: true }).eq('remitente_id', id).eq('destinatario_id', me).eq('leido', false)
    })()
    const ch = supabase.channel(`chat-${me}-${id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `destinatario_id=eq.${me}` }, (p: any) => {
      if (p.new.remitente_id !== id) return
      setMsgs((s) => (s.some((m) => m.id === p.new.id) ? s : [...s, p.new]))
      supabase.from('mensajes').update({ leido: true }).eq('id', p.new.id).then(() => {})
    }).subscribe()
    return () => { alive = false; supabase.removeChannel(ch) }
  }, [id, me])

  async function send() {
    const c = text.trim(); if (!c) return
    setText('')
    const { data, error } = await supabase.from('mensajes').insert({ remitente_id: me, destinatario_id: id, contenido: c }).select().single()
    if (error) { setText(c); return }
    setMsgs((s) => [...s, data])
  }
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: name ?? 'Chat' }} />
      {loading ? <Loading /> : (
        <FlatList ref={list} data={msgs} keyExtractor={(m) => m.id} contentContainerStyle={{ padding: 14, gap: 8, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Empty text="Aún no hay mensajes. Escribe el primero." icon="chatbubble-outline" />}
          renderItem={({ item: m }) => { const mine = m.remitente_id === me
            return (<View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <View style={{ maxWidth: '80%', backgroundColor: mine ? t.primary : t.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, borderWidth: mine ? 0 : 1, borderColor: t.border }}>
                <Text style={{ color: mine ? '#fff' : t.text, fontSize: 15 }}>{m.contenido}</Text>
                <Text style={{ color: mine ? '#ffffffaa' : t.muted, fontSize: 10, alignSelf: 'flex-end', marginTop: 2 }}>{fmtTime(m.created_at)}{mine && (m.leido ? ' ✓✓' : ' ✓')}</Text></View></View>) }} />)}
      <View style={{ flexDirection: 'row', gap: 8, padding: 10, paddingBottom: 10 + ins.bottom, backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.border }}>
        <TextInput value={text} onChangeText={setText} placeholder="Escribe un mensaje…" placeholderTextColor={t.muted} multiline
          style={{ flex: 1, backgroundColor: t.bg, color: t.text, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, maxHeight: 110 }} />
        <Pressable onPress={send} accessibilityLabel="Enviar" style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="send" size={18} color="#fff" /></Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
