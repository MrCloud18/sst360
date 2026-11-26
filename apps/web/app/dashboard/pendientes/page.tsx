import { PageHeader } from '@/components/ui'
import PendientesClient from './PendientesClient'
export default function Page() {
  return (<><PageHeader title="Cuentas pendientes" subtitle="Personas que se registraron desde la app. Asigna rol, área y supervisor para aprobarlas (RF-A03, A04)." /><PendientesClient /></>)
}
