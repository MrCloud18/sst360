export const fmtDate = (v?: string | null) => (v ? new Date(v.length <= 10 ? v + 'T00:00:00' : v).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const fmtTime = (v?: string | null) => (v ? new Date(v).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—')
export const fmtDateTime = (v?: string | null) => (v ? `${fmtDate(v)} ${fmtTime(v)}` : '—')
export const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString() }
export const label = (s?: string | null) => (s ? s.replace('_', ' ').replace(/^./, (c) => c.toUpperCase()) : '—')
