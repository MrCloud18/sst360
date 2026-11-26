import { PageHeader } from '@/components/ui'
import NotificacionesClient from './NotificacionesClient'
export default function Page() {
  return (<><PageHeader title="Notificaciones SST" subtitle="Envía avisos globales, por área o por rol (RF-A12, S13)" /><NotificacionesClient /></>)
}
