export const fmtDate = (v?: string | null) => (v ? new Date(v.length <= 10 ? v + 'T00:00:00' : v).toLocaleDateString('es-PE') : '—')
export const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—'
export const toLocalInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16)
}
export function flatten(o: any, p = '', out: Record<string, any> = {}) {
  for (const [k, v] of Object.entries(o ?? {})) {
    const key = p ? `${p}.${k}` : k
    if (Array.isArray(v)) out[key] = v.join(' | ')
    else if (v && typeof v === 'object') flatten(v, key, out)
    else out[key] = v
  }
  return out
}
export function downloadCSV(rows: any[], name: string) {
  if (!rows.length) return
  const flat = rows.map((r) => flatten(r))
  const cols = Array.from(new Set(flat.flatMap((r) => Object.keys(r))))
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = '\uFEFF' + [cols.join(','), ...flat.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
}
