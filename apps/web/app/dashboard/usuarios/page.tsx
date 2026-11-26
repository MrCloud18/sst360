import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
import { userFields } from '@/lib/fields'
export default function Page() {
  return (<><PageHeader title="Usuarios y Roles" subtitle="Crea cuentas, asigna roles y activa o desactiva el acceso (RF-A03, A04, A17)" />
    <CrudModule table="profiles" title="Usuarios" fields={userFields()} orderBy="nombre_completo" asc createVia="/api/admin/users" canDelete={false} hideTitle /></>)
}
