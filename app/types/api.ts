// Formas de las respuestas de la API Laravel (App\Http\Resources\*).

export interface Role {
  id: number
  nombre: string
  slug: string
  descripcion?: string | null
}

export interface DepartamentoResumen {
  id: number
  nombre: string
  slug: string
}

export interface Departamento extends DepartamentoResumen {
  direccion: string | null
  activo: boolean
}

export interface Proceso {
  id: number
  departamento_id: number
  nombre: string
  slug: string
  descripcion: string | null
  activo: boolean
  permisos: { crear_matriz: boolean }
}

export type EstadoMatriz = 'borrador' | 'vigente' | 'archivada'

// MatrizResource: una edición de la matriz de un proceso.
export interface Matriz {
  id: number
  proceso_id: number
  nombre: string
  fecha_revision: string
  estado: EstadoMatriz
  edicion_anterior_id: number | null
  publicada_at: string | null
  archivada_at: string | null
  created_at: string | null
  // Calculados por la Policy; solo sirven para mostrar u ocultar acciones.
  permisos: {
    editar: boolean
    publicar: boolean
    archivar: boolean
    descartar: boolean
    clonar: boolean
  }
}

// Factores de riesgo y periodicidades: catálogos que se desactivan, no se borran.
export interface CatalogoActivable {
  id: number
  nombre: string
  slug: string
  activo: boolean
}

export interface NivelRiesgo {
  id: number
  nombre: string
  slug: string
  color: string
  orden: number
}

export interface EscalaNivel {
  id: number
  tipo: 'probabilidad' | 'impacto'
  valor: number
  nombre: string
  descripcion: string | null
}

export interface MatrizCalorCelda {
  id: number
  probabilidad: number
  impacto: number
  nivel_riesgo: NivelRiesgo
}

export type EstadoTratamiento = 'pendiente' | 'en_progreso' | 'cumplido'

// RiesgoResource: una fila de la matriz (columnas del Excel, RF-3).
export interface Riesgo {
  id: number
  matriz_id: number
  riesgo_origen_id: number | null
  orden: number
  actividad: string
  descripcion: string
  factores: { id: number, nombre: string }[]
  causas: string | null
  control_actual: string | null
  probabilidad: number | null
  impacto: number | null
  nivel_calculado: NivelRiesgo | null
  nivel_ajustado: NivelRiesgo | null
  justificacion_ajuste: string | null
  // El que rige: ajustado si existe; si no, el calculado.
  nivel: NivelRiesgo | null
  sintoma: string | null
  tratamiento: string | null
  responsable: string | null
  periodicidad: { id: number, nombre: string } | null
  estado_tratamiento: EstadoTratamiento
  permisos: { editar: boolean, eliminar: boolean, registrar_seguimiento: boolean }
}

// SeguimientoResource: entrada del histórico (no se edita; se anula con motivo).
export interface Seguimiento {
  id: number
  riesgo_id: number
  fecha: string
  descripcion: string
  estado_tratamiento_anterior: EstadoTratamiento | null
  estado_tratamiento_nuevo: EstadoTratamiento | null
  registrado_por: { id: number, name: string }
  registrado_at: string | null
  anulado: boolean
  anulado_at: string | null
  anulado_por: { id: number, name: string } | null
  motivo_anulacion: string | null
  evidencias: { id: number, nombre: string, mime: string, tamano: number }[]
  permisos: { anular: boolean }
}

// UserResource. El rol solo sirve para adaptar la interfaz: los permisos
// reales siempre se comprueban en Laravel.
export interface User {
  id: number
  name: string
  email: string
  activo: boolean
  role: Role | null
  departamentos: DepartamentoResumen[]
}

// GET /api/user
export interface UsuarioActual {
  data: User
  meta: {
    sesion_minutos: number
  }
}

export interface Item<T> {
  data: T
}

export interface Coleccion<T> {
  data: T[]
}

export interface Paginado<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// GET /api/dashboard (solo ediciones vigentes, en el alcance del usuario).
export interface DatosDashboard {
  total_riesgos: number
  por_nivel: { nivel: NivelRiesgo, total: number }[]
  mapa_calor: { probabilidad: number, impacto: number, nivel: NivelRiesgo, total: number }[]
  por_estado_tratamiento: Record<EstadoTratamiento, number>
  prioritarios_pendientes: number
  seguimientos_atrasados: number
  por_departamento: {
    departamento: { id: number, nombre: string, direccion: string | null }
    total: number
    por_nivel: Record<string, number>
    procesos_con_vigente: number
    procesos_sin_vigente: number
  }[]
}

// GET /api/reportes/riesgos
export interface FilaReporteRiesgo {
  id: number
  orden: number
  actividad: string
  descripcion: string
  factores: { id: number, nombre: string }[]
  probabilidad: number | null
  impacto: number | null
  nivel: NivelRiesgo | null
  ajustado: boolean
  responsable: string | null
  periodicidad: string | null
  estado_tratamiento: EstadoTratamiento
  seguimiento: { ultimo: string | null, vence: string | null, atrasado: boolean }
  matriz: { id: number, nombre: string, estado: EstadoMatriz, fecha_revision: string }
  proceso: { id: number, nombre: string }
  departamento: { id: number, nombre: string, direccion: string | null }
}

// GET /api/matrices/{base}/comparar/{nueva}
export interface ResumenRiesgoComparado {
  id: number
  orden: number
  descripcion: string
  nivel: NivelRiesgo | null
}

export interface ComparacionEdiciones {
  base: { id: number, nombre: string, fecha_revision: string }
  nueva: { id: number, nombre: string, fecha_revision: string }
  agregados: ResumenRiesgoComparado[]
  cerrados: ResumenRiesgoComparado[]
  cambios_nivel: {
    riesgo_base_id: number
    riesgo_nuevo_id: number
    descripcion: string
    probabilidad_anterior: number | null
    impacto_anterior: number | null
    probabilidad_nueva: number | null
    impacto_nuevo: number | null
    nivel_anterior: NivelRiesgo | null
    nivel_nuevo: NivelRiesgo | null
    tendencia: 'sube' | 'baja'
  }[]
  resumen: { agregados: number, cerrados: number, suben: number, bajan: number, sin_cambio: number }
}

export const ROL_ADMINISTRADOR = 'administrador'
export const ROL_AUDITOR = 'auditor'

// AuditoriaResource: entrada del registro de auditoría (solo lectura).
export interface RegistroAuditoria {
  id: number
  fecha: string
  evento: string
  entidad: string | null
  entidad_id: number | null
  usuario: { id: number, name: string } | null
  ip: string | null
  user_agent: string | null
  descripcion: string | null
  valores_anteriores: Record<string, unknown> | null
  valores_nuevos: Record<string, unknown> | null
}
