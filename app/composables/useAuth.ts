import { FetchError } from 'ofetch'
import type { UsuarioActual, User } from '~/types/api'

export function useAuth() {
  const { api, asegurarCsrfCookie } = useApi()

  const user = useState<User | null>('auth:user', () => null)
  // true cuando ya se consultó /api/user al menos una vez (haya sesión o no).
  const resuelto = useState<boolean>('auth:resuelto', () => false)
  // Minutos de inactividad tras los que Laravel cierra la sesión (config/session.php).
  const sesionMinutos = useState<number | null>('auth:sesion-minutos', () => null)

  const autenticado = computed(() => user.value !== null)

  async function fetchUser(): Promise<User | null> {
    try {
      const response = await api<UsuarioActual>('/api/user')
      user.value = response.data
      sesionMinutos.value = response.meta.sesion_minutos
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

  return { user, resuelto, autenticado, sesionMinutos, login, logout, fetchUser }
}
