'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, Empty } from '@/components/ui'
import { fmtDateTime } from '@/lib/utils'

export default function ChatClient() {
  const sb = useMemo(() => createClient(), [])
  const [me, setMe] = useState<string | null>(null)
  const [people, setPeople] = useState<any[]>([])
  const [sel, setSel] = useState<any | null>(null)
  const [msgs, setMsgs] = useState<any[]>([])
  const [unread, setUnread] = useState<Record<string, number>>({})
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const selRef = useRef<any>(null); selRef.current = sel

  useEffect(() => {
    let ch: any
    ;(async () => {
      const { data: { user } } = await sb.auth.getUser(); if (!user) return
      setMe(user.id)
      const { data } = await sb.from('profiles').select('id,nombre_completo,rol').eq('activo', true).neq('id', user.id).order('nombre_completo')
      setPeople(data ?? [])
      const { data: un } = await sb.from('mensajes').select('remitente_id').eq('destinatario_id', user.id).eq('leido', false)
      const c: Record<string, number> = {}; (un ?? []).forEach((m: any) => (c[m.remitente_id] = (c[m.remitente_id] ?? 0) + 1)); setUnread(c)
      ch = sb.channel('web-mensajes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `destinatario_id=eq.${user.id}` }, (pl: any) => {
        const m = pl.new
        if (selRef.current?.id === m.remitente_id) { setMsgs((s) => [...s, m]); sb.from('mensajes').update({ leido: true }).eq('id', m.id).then(() => {}) }
        else setUnread((u) => ({ ...u, [m.remitente_id]: (u[m.remitente_id] ?? 0) + 1 }))
      }).subscribe()
    })()
    return () => { if (ch) sb.removeChannel(ch) }
  }, [sb])

  async function open(p: any) {
    setSel(p); setMsgs([])
    const { data } = await sb.from('mensajes').select('*')
      .or(`and(remitente_id.eq.${me},destinatario_id.eq.${p.id}),and(remitente_id.eq.${p.id},destinatario_id.eq.${me})`).order('created_at').limit(300)
    setMsgs(data ?? [])
    await sb.from('mensajes').update({ leido: true }).eq('remitente_id', p.id).eq('destinatario_id', me!).eq('leido', false)
    setUnread((u) => ({ ...u, [p.id]: 0 }))
  }
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(e: React.FormEvent) {
    e.preventDefault(); const t = text.trim(); if (!t || !sel || !me) return
    setText('')
    const { data, error } = await sb.from('mensajes').insert({ remitente_id: me, destinatario_id: sel.id, contenido: t }).select().single()
    if (error) { setText(t); return alert('No se pudo enviar: ' + error.message) }
    setMsgs((s) => [...s, data])
  }
  const list = people.filter((p) => p.nombre_completo.toLowerCase().includes(q.toLowerCase()))
  return (
    <Card className="flex h-[calc(100vh-12rem)] min-h-[420px] overflow-hidden p-0">
      <div className="flex w-72 shrink-0 flex-col border-r border-line">
        <div className="p-3"><input className="input" placeholder="Buscar persona…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar persona" /></div>
        <ul className="flex-1 overflow-y-auto">
          {list.map((p) => (
            <li key={p.id}><button onClick={() => open(p)} className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-white/5 ${sel?.id === p.id ? 'bg-white/5' : ''}`}>
              <span><span className="block font-medium">{p.nombre_completo}</span><span className="text-xs capitalize text-mute">{p.rol}</span></span>
              {!!unread[p.id] && <span className="rounded-full bg-violet px-2 py-0.5 text-xs">{unread[p.id]}</span>}</button></li>
          ))}
        </ul>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {!sel ? <Empty text="Selecciona una conversación." /> : (<>
          <div className="border-b border-line p-4 font-medium">{sel.nombre_completo} <span className="text-xs capitalize text-mute">· {sel.rol}</span></div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.remitente_id === me ? 'justify-end' : ''}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${m.remitente_id === me ? 'bg-violet' : 'bg-white/10'}`}>{m.contenido}
                  <p className="mt-1 text-[10px] opacity-60">{fmtDateTime(m.created_at)}</p></div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
            <input className="input" placeholder="Escribe un mensaje…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Mensaje" />
            <button className="btn btn-primary" aria-label="Enviar"><Send size={16} /></button></form>
        </>)}
      </div>
    </Card>
  )
}
