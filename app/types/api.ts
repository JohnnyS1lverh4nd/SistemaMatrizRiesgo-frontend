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

export const ROL_ADMINISTRADOR = 'administrador'
