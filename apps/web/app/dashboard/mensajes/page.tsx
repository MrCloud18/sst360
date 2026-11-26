import { PageHeader } from '@/components/ui'
import ChatClient from './ChatClient'
export default function Page() {
  return (<><PageHeader title="Mensajería interna" subtitle="Conversaciones en tiempo real con trabajadores y supervisores (RF-A18, S17)" /><ChatClient /></>)
}
