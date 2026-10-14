/**
 * Cliente HTTP único para la API Laravel (Sanctum SPA con cookies de sesión).
 *
 * - Envía siempre las cookies (`credentials: 'include'`).
 * - Pide JSON, para que Laravel responda errores como JSON y no con redirecciones.
 * - En peticiones que modifican datos, obtiene la cookie XSRF-TOKEN si falta
 *   y la reenvía en la cabecera X-XSRF-TOKEN (protección CSRF de Laravel).
 */
const METODOS_SEGUROS = ['GET', 'HEAD', 'OPTIONS']

function leerCookie(nombre: string): string | null {
  if (import.meta.server) {
    return null
  }

  const match = document.cookie.match(new RegExp('(^|;\\s*)' + nombre + '=([^;]+)'))

  return match?.[2] ? decodeURIComponent(match[2]) : null
}

export function useApi() {
  const apiBase = useRuntimeConfig().public.apiBase
  const nuxtApp = useNuxtApp()
  // Mismo estado que useAuth (no se importa useAuth para evitar la dependencia circular).
  const user = useState('auth:user')

  async function asegurarCsrfCookie() {
    if (!leerCookie('XSRF-TOKEN')) {
      await $fetch('/sanctum/csrf-cookie', {
        baseURL: apiBase,
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
    }
  }

  const api = $fetch.create({
    baseURL: apiBase,
    credentials: 'include',
    headers: { Accept: 'application/json' },
    async onRequest({ options }) {
      const metodo = (options.method ?? 'GET').toUpperCase()

      if (METODOS_SEGUROS.includes(metodo)) {
        return
      }

      await asegurarCsrfCookie()

      const token = leerCookie('XSRF-TOKEN')
      if (token) {
        options.headers.set('X-XSRF-TOKEN', token)
      }
    },
    onResponse({ response }) {
      // Cualquier respuesta correcta renovó la sesión en Laravel.
      if (response.ok) {
        marcarContactoServidor()
      }
    },
    async onResponseError({ response }) {
      // La sesión venció en el servidor mientras el usuario la tenía abierta.
      if (response.status === 401 && user.value !== null) {
        user.value = null
        await nuxtApp.runWithContext(() =>
          navigateTo({ path: '/login', query: { motivo: 'sesion-expirada' } }),
        )
      }
    },
  })

  return { api, asegurarCsrfCookie }
}
