import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
import { areaRef, opt, supervisorRef, trabajadorRef } from '@/lib/fields'
import { getRole } from '@/lib/role'
export default async function Page() {
  const admin = (await getRole()) === 'administrador'
  return (<><PageHeader title="Acciones y Condiciones Subestándar" subtitle="Seguimiento, reasignación y auditoría de cierres (RF-A20, S07-S09)" />
    <CrudModule table="reportes_subestandar" title="Reportes" hideTitle canCreate={false} canDelete={admin} fields={[
      trabajadorRef('trabajador_id', 'Reportado por', { readOnly: true }), { key: 'tipo', label: 'Tipo', readOnly: true }, { key: 'categoria', label: 'Categoría', readOnly: true },
      { key: 'severidad', label: 'Severidad', type: 'select', options: opt('leve', 'moderado', 'critico') },
      { key: 'descripcion', label: 'Descripción', readOnly: true },
      { key: 'evidencias_urls', label: 'Evidencias', type: 'files', bucket: 'reportes-evidencias', readOnly: true },
      { key: 'estado', label: 'Estado', type: 'select', options: opt('pendiente', 'en_proceso', 'cerrado') },
      areaRef(), supervisorRef('supervisor_id', 'Responsable'),
      { key: 'observaciones_cierre', label: 'Observaciones / acciones tomadas', type: 'textarea' }]} /></>)
}
