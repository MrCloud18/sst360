import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
import { userFields } from '@/lib/fields'
import { getRole } from '@/lib/role'
export default async function Page() {
  const admin = (await getRole()) === 'administrador'
  return (<><PageHeader title="Trabajadores" subtitle={admin ? 'Gestión de trabajadores (RF-A05)' : 'Personal bajo tu responsabilidad (RF-S03)'} />
    <CrudModule table="profiles" title="Trabajadores" fields={userFields(true)} filter={{ rol: 'trabajador' }} defaults={{ rol: 'trabajador' }}
      orderBy="nombre_completo" asc createVia="/api/admin/users" canCreate={admin} canEdit={admin} canDelete={false} hideTitle /></>)
}
