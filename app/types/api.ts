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
  codigo_referencia: string | null
  activo: boolean
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
