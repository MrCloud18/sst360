// Fuente única de tokens, constantes y tipos. Se copia a apps/web/lib/shared y apps/mobile/lib/shared con: node scripts/sync-shared.mjs
export const colors = {
  violet: '#7C3AED', cyan: '#06B6D4',
  darkBg: '#0F111A', darkSurface: '#181B28', darkBorder: '#272B3F',
  lightBg: '#F3F4F8', lightSurface: '#FFFFFF', lightBorder: '#E5E7EB',
  textLight: '#111827', textDark: '#F8FAFC',
  muted: '#6B7280', mutedDark: '#9CA3AF',
  ok: '#10B981', warn: '#F59E0B', danger: '#EF4444',
} as const

export type Rol = 'trabajador' | 'supervisor' | 'administrador'
export const ROLES: Rol[] = ['trabajador', 'supervisor', 'administrador']

export const CATEGORIAS_REPORTE = ['Orden y limpieza', 'EPP', 'Eléctrico', 'Trabajo en altura', 'Maquinaria', 'Químicos', 'Ergonomía', 'Otro']
export const SEVERIDADES = ['leve', 'moderado', 'critico'] as const
export const ESTADOS_SOLICITUD = ['enviado', 'en_revision', 'aprobado', 'rechazado'] as const

export interface Profile {
  id: string; nombre_completo: string; codigo_trabajador: string | null; email: string | null; telefono: string | null
  rol: Rol; estado_cuenta: 'pendiente' | 'aprobado' | 'rechazado'; area_id: string | null; supervisor_id: string | null; avatar_url: string | null; activo: boolean
}
export interface Asistencia { id: string; trabajador_id: string; tipo: 'entrada' | 'salida'; fecha_hora: string; foto_url: string | null; latitud: number | null; longitud: number | null; direccion_texto: string | null; estado: 'puntual' | 'tardanza' }
export interface EppSolicitud { id: string; trabajador_id: string; epp_id: string; tipo_solicitud: string; motivo: string | null; estado: string; revisado_por: string | null; comentario_revision: string | null; created_at: string }
export interface ReporteSubestandar { id: string; trabajador_id: string; area_id: string | null; tipo: 'accion' | 'condicion'; categoria: string | null; severidad: 'leve' | 'moderado' | 'critico'; descripcion: string; evidencias_urls: string[]; estado: 'pendiente' | 'en_proceso' | 'cerrado'; supervisor_id: string | null; observaciones_cierre: string | null; created_at: string }
export interface Notificacion { id: string; usuario_id: string; titulo: string; mensaje: string | null; tipo: string; leida: boolean; referencia_id: string | null; created_at: string }
export interface Mensaje { id: string; remitente_id: string; destinatario_id: string; contenido: string; leido: boolean; created_at: string }
