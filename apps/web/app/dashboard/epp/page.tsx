import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
import Tabs from '@/components/Tabs'
import { eppRef, opt, trabajadorRef } from '@/lib/fields'
import { getRole } from '@/lib/role'
export default async function Page() {
  const admin = (await getRole()) === 'administrador'
  return (<><PageHeader title="Equipos de Protección Personal" subtitle="Catálogo, asignaciones y solicitudes (RF-A08, S05, S06)" />
    <Tabs tabs={[
      { label: 'Catálogo', content: <CrudModule table="epp_catalogo" title="Catálogo EPP" hideTitle orderBy="nombre" asc canCreate={admin} canEdit={admin} canDelete={admin} fields={[
        { key: 'nombre', label: 'Nombre', required: true }, { key: 'categoria', label: 'Categoría' }, { key: 'descripcion', label: 'Descripción', type: 'textarea', hideInTable: true },
        { key: 'vida_util_dias', label: 'Vida útil (días)', type: 'number', def: 365 }, { key: 'stock_disponible', label: 'Stock', type: 'number', def: 0 }]} /> },
      { label: 'Asignaciones', content: <CrudModule table="epp_asignaciones" title="Asignaciones" hideTitle canCreate={admin} canDelete={admin} fields={[
        trabajadorRef('trabajador_id', 'Trabajador', { required: true }), eppRef({ required: true }),
        { key: 'fecha_asignacion', label: 'Asignado el', type: 'date' }, { key: 'fecha_vencimiento', label: 'Vence', type: 'date' },
        { key: 'estado', label: 'Estado', type: 'select', options: opt('asignado', 'vencido', 'devuelto'), def: 'asignado' }]} /> },
      { label: 'Solicitudes', content: <CrudModule table="epp_solicitudes" title="Solicitudes de EPP" hideTitle canCreate={false} canDelete={false} stamp={{ revisado_por: 'uid' }} fields={[
        trabajadorRef('trabajador_id', 'Trabajador', { readOnly: true }), eppRef({ readOnly: true }),
        { key: 'tipo_solicitud', label: 'Tipo', readOnly: true }, { key: 'motivo', label: 'Motivo', readOnly: true },
        { key: 'estado', label: 'Estado', type: 'select', options: opt('enviado', 'en_revision', 'aprobado', 'rechazado') },
        { key: 'comentario_revision', label: 'Comentario de revisión', type: 'textarea' }]} /> },
    ]} /></>)
}
