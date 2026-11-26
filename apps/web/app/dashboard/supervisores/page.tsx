import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
import { userFields } from '@/lib/fields'
export default function Page() {
  return (<><PageHeader title="Supervisores" subtitle="Gestión de supervisores y sus áreas (RF-A06)" />
    <CrudModule table="profiles" title="Supervisores" fields={userFields(true)} filter={{ rol: 'supervisor' }} defaults={{ rol: 'supervisor' }}
      orderBy="nombre_completo" asc createVia="/api/admin/users" canDelete={false} hideTitle /></>)
}
