import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
import Tabs from '@/components/Tabs'
import { eppRef, trabajadorRef } from '@/lib/fields'
export default function Page() {
  return (<><PageHeader title="Consulta de registros" subtitle="Asistencias con foto y GPS, solicitudes y observaciones (RF-A11, S04)" />
    <Tabs tabs={[
      { label: 'Asistencias', content: <CrudModule table="asistencias" title="Asistencias" hideTitle orderBy="fecha_hora" canCreate={false} canEdit={false} canDelete={false} fields={[
        trabajadorRef(), { key: 'tipo', label: 'Tipo' }, { key: 'fecha_hora', label: 'Fecha y hora', type: 'datetime' }, { key: 'estado', label: 'Estado' },
        { key: 'foto_url', label: 'Foto', type: 'upload', bucket: 'asistencias-fotos' },
        { key: 'direccion_texto', label: 'Ubicación' }, { key: 'latitud', label: 'Lat' }, { key: 'longitud', label: 'Lng' }]} /> },
      { label: 'Solicitudes EPP', content: <CrudModule table="epp_solicitudes" title="Solicitudes" hideTitle canCreate={false} canEdit={false} canDelete={false} fields={[
        trabajadorRef(), eppRef(), { key: 'tipo_solicitud', label: 'Tipo' }, { key: 'estado', label: 'Estado' }, { key: 'created_at', label: 'Fecha', type: 'datetime' }]} /> },
      { label: 'Observaciones', content: <CrudModule table="observaciones_sst" title="Observaciones" hideTitle canCreate={false} canEdit={false} canDelete={false} fields={[
        trabajadorRef(), trabajadorRef('supervisor_id', 'Supervisor'), { key: 'nota', label: 'Nota' }, { key: 'created_at', label: 'Fecha', type: 'datetime' }]} /> },
    ]} /></>)
}
