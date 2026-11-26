import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
import { opt, trabajadorRef } from '@/lib/fields'
import { getRole } from '@/lib/role'
export default async function Page() {
  const admin = (await getRole()) === 'administrador'
  return (<><PageHeader title="Revisiones Médicas" subtitle="Exámenes ocupacionales programados, pendientes y realizados (RF-A10, S11)" />
    <CrudModule table="revisiones_medicas" title="Revisiones médicas" hideTitle orderBy="fecha_programada" canCreate={admin} canDelete={admin} fields={[
      trabajadorRef('trabajador_id', 'Trabajador', { required: true }), { key: 'tipo_examen', label: 'Tipo de examen', required: true },
      { key: 'fecha_programada', label: 'Fecha', type: 'date', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: opt('programado', 'pendiente', 'realizado'), def: 'programado' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea' }]} /></>)
}
