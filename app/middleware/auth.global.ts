/**
 * Protege todas las páginas salvo las marcadas con `definePageMeta({ public: true })`.
 *
 * Es solo una mejora de experiencia: aunque alguien salte este middleware,
 * la API rechaza (401/403) cualquier petición sin sesión o sin permiso.
 *
 * La app corre con `ssr: false`, así que este middleware siempre se ejecuta
 * en el navegador, donde están las cookies de sesión de la API.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { resuelto, autenticado, fetchUser } = useAuth()

  if (!resuelto.value) {
    try {
      await fetchUser()
    } catch {
      // API caída o error inesperado: se trata como sesión no disponible.
    }
  }

  if (to.meta.public) {
    // Un usuario con sesión no necesita ver el login.
    if (autenticado.value && to.path === '/login') {
      return navigateTo('/')
    }

    return
  }

  if (!autenticado.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
