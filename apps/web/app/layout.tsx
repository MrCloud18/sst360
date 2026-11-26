import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = { title: 'SST 360 · Administración', description: 'Plataforma integral de Seguridad y Salud en el Trabajo' }
export const viewport: Viewport = { themeColor: '#0F111A' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="es"><body>{children}</body></html>)
}
