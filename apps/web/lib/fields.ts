import type { Field } from '@/components/CrudModule'
import { ROLES } from '@/lib/shared'

export const trabajadorRef = (key = 'trabajador_id', label = 'Trabajador', extra: Partial<Field> = {}): Field =>
  ({ key, label, ref: { table: 'profiles', label: 'nombre_completo' }, ...extra })
export const supervisorRef = (key = 'supervisor_id', label = 'Supervisor', extra: Partial<Field> = {}): Field =>
  ({ key, label, ref: { table: 'profiles', label: 'nombre_completo', filter: { rol: 'supervisor' } }, ...extra })
export const areaRef = (key = 'area_id', label = 'Área', extra: Partial<Field> = {}): Field =>
  ({ key, label, ref: { table: 'areas', label: 'nombre' }, ...extra })
export const eppRef = (extra: Partial<Field> = {}): Field => ({ key: 'epp_id', label: 'EPP', ref: { table: 'epp_catalogo', label: 'nombre' }, ...extra })
export const opt = (...v: string[]) => v.map((x) => ({ value: x, label: x.replace('_', ' ') }))

export const userFields = (hideRol = false): Field[] => [
  { key: 'nombre_completo', label: 'Nombre completo', required: true },
  { key: 'codigo_trabajador', label: 'Código / ID' },
  { key: 'email', label: 'Correo', createOnly: true, required: true },
  { key: 'password', label: 'Contraseña inicial (mín. 8)', type: 'password', createOnly: true, hideInTable: true, required: true },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'rol', label: 'Rol', type: 'select', options: opt(...ROLES), hideInForm: hideRol },
  areaRef(),
  supervisorRef(),
  { key: 'estado_cuenta', label: 'Cuenta', readOnly: true },
  { key: 'activo', label: 'Activo', type: 'checkbox', def: true },
]
