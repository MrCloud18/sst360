import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
import Tabs from '@/components/Tabs'
import { areaRef, opt, trabajadorRef } from '@/lib/fields'
import { getRole } from '@/lib/role'
export default async function Page() {
  const admin = (await getRole()) === 'administrador'
  return (<><PageHeader title="Capacitaciones" subtitle="Programación y control de asistentes (RF-A09, S10)" />
    <Tabs tabs={[
      { label: 'Sesiones', content: <CrudModule table="capacitaciones" title="Capacitaciones" hideTitle orderBy="fecha_programada" stamp={{ creado_por: 'uid' }} canDelete={admin} fields={[
        { key: 'titulo', label: 'Título', required: true }, { key: 'descripcion', label: 'Descripción', type: 'textarea' },
        { key: 'fecha_programada', label: 'Fecha y hora', type: 'datetime', required: true }, areaRef()]} /> },
      { label: 'Asistentes', content: <CrudModule table="capacitacion_asistentes" title="Asistentes" hideTitle canDelete={admin} fields={[
        { key: 'capacitacion_id', label: 'Capacitación', required: true, ref: { table: 'capacitaciones', label: 'titulo' } },
        trabajadorRef('trabajador_id', 'Trabajador', { required: true }),
        { key: 'estado', label: 'Estado', type: 'select', options: opt('inscrito', 'completado', 'pendiente', 'ausente'), def: 'inscrito' }]} /> },
    ]} /></>)
}
