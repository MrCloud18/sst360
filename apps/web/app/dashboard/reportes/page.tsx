import { PageHeader } from '@/components/ui'
import ReportesClient from './ReportesClient'
export default function Page() {
  return (<><PageHeader title="Reportes e indicadores SST" subtitle="Indicadores globales y exportación por rango de fechas (RF-A14, A15, S14, S15)"
    /><ReportesClient /></>)
}
