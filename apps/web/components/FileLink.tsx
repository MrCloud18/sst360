'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Abre un archivo privado de Storage mediante URL firmada (válida 5 min)
export default function FileLink({ bucket, value, label = 'Ver' }: { bucket: string; value?: string | string[] | null; label?: string }) {
  const [busy, setBusy] = useState(false)
  const paths = Array.isArray(value) ? value : value ? [value] : []
  if (!paths.length) return <span className="text-mute">—</span>
  async function open(path: string) {
    setBusy(true)
    const { data, error } = await createClient().storage.from(bucket).createSignedUrl(path, 300)
    setBusy(false)
    if (error || !data) return alert('No se pudo abrir el archivo.')
    window.open(data.signedUrl, '_blank', 'noopener')
  }
  return (
    <span className="flex flex-wrap gap-2">
      {paths.map((p, i) => (
        <button key={p} disabled={busy} onClick={() => open(p)} className="text-cyan underline-offset-2 hover:underline">{label}{paths.length > 1 ? ` ${i + 1}` : ''}</button>
      ))}
    </span>
  )
}
