import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
export default function Page() {
  return (<><PageHeader title="Configuración del sistema" subtitle="Horario de tolerancia, alertas de vencimiento y otros parámetros (RF-A16). El valor es JSON." />
    <CrudModule table="configuracion_sistema" title="Parámetros" hideTitle pk="clave" orderBy="clave" asc stamp={{ actualizado_por: 'uid' }} fields={[
      { key: 'clave', label: 'Clave', required: true, lockOnEdit: true }, { key: 'valor', label: 'Valor (JSON)', type: 'json', required: true, def: '{}' },
      { key: 'descripcion', label: 'Descripción', type: 'textarea' }]} /></>)
}
