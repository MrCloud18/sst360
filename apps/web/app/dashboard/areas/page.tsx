import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
export default function Page() {
  return (<><PageHeader title="Áreas" subtitle="Áreas y departamentos de la organización (RF-A07)" />
    <CrudModule table="areas" title="Áreas" hideTitle orderBy="nombre" asc fields={[
      { key: 'nombre', label: 'Nombre', required: true }, { key: 'descripcion', label: 'Descripción', type: 'textarea' },
      { key: 'activa', label: 'Activa', type: 'checkbox', def: true }]} /></>)
}
