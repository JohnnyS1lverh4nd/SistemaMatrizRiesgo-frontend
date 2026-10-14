import { ROL_ADMINISTRADOR, ROL_AUDITOR } from '~/types/api'

/**
 * Registro de auditoría: Administrador y Auditor. Solo mejora la navegación;
 * la API responde 403 a cualquier otro rol.
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()
  const rol = user.value?.role?.slug

  if (rol !== ROL_ADMINISTRADOR && rol !== ROL_AUDITOR) {
    return navigateTo('/')
  }
})
