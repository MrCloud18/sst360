import { useState } from 'react'
import { Alert, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { useAuth, useT } from '../lib/auth'
import { useLoad } from '../lib/hooks'
import { fmtDateTime, label } from '../lib/format'
import { loadTeam } from '../lib/team'
import { Badge, Body, Btn, Card, Chip, Chips, Empty, ErrorBox, H2, Input, Loading, Muted, Row, Screen, Section, toneOf } from '../components/ui'

// RF-S10 · Programar capacitaciones, inscribir al equipo y registrar cumplimiento
export default function GestionCap() {
  const { profile } = useAuth(); const t = useT()
  const [titulo, setTitulo] = useState(''); const [desc, setDesc] = useState(''); const [fecha, setFecha] = useState(''); const [busy, setBusy] = useState(false); const [openId, setOpenId] = useState<string | null>(null)
  const { data, loading, error, reload } = useLoad(async () => {
    const { data, error } = await supabase.from('capacitaciones').select('id,titulo,fecha_programada,asist:capacitacion_asistentes(id,estado,worker:profiles!trabajador_id(nombre_completo))').order('fecha_programada', { ascending: false }).limit(30)
    if (error) throw error; return data ?? []
  })
  async function crear() {
    const d = new Date(fecha.trim().replace(' ', 'T'))
    if (titulo.trim().length < 3 || isNaN(+d)) return Alert.alert('Revisa los datos', 'Escribe un título y una fecha válida con el formato AAAA-MM-DD HH:MM (ej.: 2026-12-05 09:00).')
    setBusy(true)
    try {
      const { data: cap, error } = await supabase.from('capacitaciones').insert({ titulo: titulo.trim(), descripcion: desc.trim() || null, fecha_programada: d.toISOString(), area_id: profile!.area_id, creado_por: profile!.id }).select().single()
      if (error) throw error
      const team = await loadTeam(profile!)
      if (team.length) { const { error: e2 } = await supabase.from('capacitacion_asistentes').insert(team.map((w: any) => ({ capacitacion_id: cap.id, trabajador_id: w.id }))); if (e2) throw e2 }
      setTitulo(''); setDesc(''); setFecha(''); reload()
      Alert.alert('Capacitación programada', `${team.length} trabajador(es) inscritos y notificados.`)
    } catch (e: any) { Alert.alert('No se pudo programar', e.message) } finally { setBusy(false) }
  }
  async function setEstado(id: string, estado: string) { const { error } = await supabase.from('capacitacion_asistentes').update({ estado }).eq('id', id); if (error) Alert.alert('Error', error.message); else reload() }
  return (
    <Screen onRefresh={reload}>
      <Card style={{ gap: 10 }}><H2>Programar capacitación</H2>
        <Input label="Título" value={titulo} onChangeText={setTitulo} /><Input label="Descripción (opcional)" value={desc} onChangeText={setDesc} />
        <Input label="Fecha y hora (AAAA-MM-DD HH:MM)" value={fecha} onChangeText={setFecha} placeholder="2026-12-05 09:00" autoCapitalize="none" />
        <Btn title="Programar e inscribir al equipo" onPress={crear} loading={busy} /></Card>
      <Section title="Sesiones" />
      {loading ? <Loading /> : error ? <ErrorBox msg={error} onRetry={reload} /> : !data?.length ? <Empty text="No hay capacitaciones." icon="school-outline" /> : data.map((c: any) => {
        const done = c.asist.filter((a: any) => a.estado === 'completado').length
        return (<Card key={c.id} onPress={() => setOpenId(openId === c.id ? null : c.id)} style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}><View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{c.titulo}</Body><Muted>{fmtDateTime(c.fecha_programada)}</Muted></View><Badge text={`${done}/${c.asist.length}`} tone={done === c.asist.length && done > 0 ? 'ok' : 'warn'} /></Row>
          {openId === c.id && c.asist.map((a: any) => (<View key={a.id} style={{ gap: 6, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 8 }}><Row style={{ justifyContent: 'space-between' }}><Body>{a.worker?.nombre_completo}</Body><Badge text={label(a.estado)} tone={toneOf(a.estado)} /></Row>
            <Chips><Chip text="Completó" active={a.estado === 'completado'} color={t.ok} onPress={() => setEstado(a.id, 'completado')} /><Chip text="Ausente" active={a.estado === 'ausente'} color={t.danger} onPress={() => setEstado(a.id, 'ausente')} /></Chips></View>))}
        </Card>) })}
    </Screen>
  )
}
