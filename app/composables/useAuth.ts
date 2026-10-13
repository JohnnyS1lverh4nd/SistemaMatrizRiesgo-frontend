import { FetchError } from 'ofetch'

interface Role {
  id: number
  nombre: string
  slug: string
}

interface DepartamentoAsignado {
  id: number
  nombre: string
  slug: string
}

// Forma de App\Http\Resources\UserResource. El rol solo sirve para adaptar
// la interfaz: los permisos reales siempre se comprueban en Laravel.
export interface User {
  id: number
  name: string
  email: string
  role: Role | null
  departamentos: DepartamentoAsignado[]
}

export function useAuth() {
  const { api, asegurarCsrfCookie } = useApi()

  const user = useState<User | null>('auth:user', () => null)
  // true cuando ya se consultó /api/user al menos una vez (haya sesión o no).
  const resuelto = useState<boolean>('auth:resuelto', () => false)

  const autenticado = computed(() => user.value !== null)

  async function fetchUser(): Promise<User | null> {
    try {
      const response = await api<{ data: User }>('/api/user')
      user.value = response.data
    } catch (error) {
      if (error instanceof FetchError && error.statusCode === 401) {
        user.value = null
      } else {
        throw error
      }
    } finally {
      resuelto.value = true
    }

    return user.value
  }

  async function login(email: string, password: string) {
    // Laravel regenera la sesión al iniciar sesión: se pide una cookie CSRF nueva.
    await asegurarCsrfCookie()
    await api('/login', { method: 'POST', body: { email, password } })
    await fetchUser()
  }

  async function logout() {
    try {
      await api('/logout', { method: 'POST' })
    } finally {
      user.value = null
    }
  }

  return { user, resuelto, autenticado, login, logout, fetchUser }
}
