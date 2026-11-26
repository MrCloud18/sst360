import type { ReactNode } from 'react'

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7C3AED" /><stop offset="1" stopColor="#06B6D4" /></linearGradient></defs>
      <circle cx="24" cy="24" r="21" fill="none" stroke="url(#lg)" strokeWidth="6" strokeDasharray="38 18" strokeLinecap="round" />
      <circle cx="24" cy="24" r="10" fill="none" stroke="url(#lg)" strokeWidth="5" strokeDasharray="20 12" strokeLinecap="round" transform="rotate(120 24 24)" />
    </svg>
  )
}
export const Brand = ({ size = 28 }: { size?: number }) => (
  <div className="flex items-center gap-2"><Logo size={size} /><span className="text-xl font-semibold">SST <span className="text-violet">360</span></span></div>
)
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-line bg-surface p-5 ${className}`}>{children}</div>
)
export const Kpi = ({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: string }) => (
  <Card><p className="text-sm text-mute">{label}</p><p className={`mt-1 text-3xl font-semibold ${tone ?? ''}`}>{value}</p>{hint && <div className="mt-2 text-xs">{hint}</div>}</Card>
)
const TONES: Record<string, string> = {
  ok: 'bg-ok/15 text-ok', warn: 'bg-warn/15 text-warn', danger: 'bg-danger/15 text-danger',
  info: 'bg-cyan/15 text-cyan', neutral: 'bg-white/10 text-mute',
}
export const Badge = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone] ?? TONES.neutral}`}>{children}</span>
)
export function toneOf(v: any): string {
  const s = String(v)
  if (['aprobado', 'cerrado', 'realizado', 'completado', 'puntual', 'asignado', 'leve', 'true'].includes(s)) return 'ok'
  if (['pendiente', 'en_revision', 'en_proceso', 'moderado', 'programado', 'tardanza', 'inscrito', 'enviado'].includes(s)) return 'warn'
  if (['rechazado', 'critico', 'vencido', 'ausente', 'false'].includes(s)) return 'danger'
  return 'neutral'
}
export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-semibold">{title}</h1>{subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}</div>
    <div className="no-print flex gap-2">{actions}</div>
  </div>
)
export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-mute hover:text-ink" aria-label="Cerrar">✕</button></div>
        {children}
      </div>
    </div>
  )
}
export const Empty = ({ text = 'Sin registros todavía.' }: { text?: string }) => <p className="py-10 text-center text-sm text-mute">{text}</p>
export const Spinner = () => <div className="py-10 text-center text-sm text-mute">Cargando…</div>
