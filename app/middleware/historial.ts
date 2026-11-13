import { ROLES_HISTORIAL } from '~/types/api'

/**
 * Historial de movimientos: Encargados y Administrador. Solo mejora la
 * navegación; la API responde 403 a cualquier otro rol y limita los datos
 * a los departamentos del usuario.
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()

  if (!ROLES_HISTORIAL.includes(user.value?.role?.slug ?? '')) {
    return navigateTo('/')
  }
})
