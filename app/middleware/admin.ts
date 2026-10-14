import { ROL_ADMINISTRADOR } from '~/types/api'

/**
 * Páginas solo para Administrador: definePageMeta({ middleware: 'admin' }).
 * Solo mejora la navegación; la API responde 403 a cualquier otro rol.
 * Se ejecuta después de auth.global, que ya cargó el usuario.
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()

  if (user.value?.role?.slug !== ROL_ADMINISTRADOR) {
    return navigateTo('/')
  }
})
