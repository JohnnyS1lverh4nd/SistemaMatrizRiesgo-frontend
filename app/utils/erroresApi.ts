import { FetchError } from 'ofetch'

export type ErroresPorCampo = Record<string, string[]>

/**
 * Errores de validación (422) de Laravel, por campo: { email: ['...'] }.
 * Devuelve null si el error no es de validación.
 */
export function erroresDeValidacion(error: unknown): ErroresPorCampo | null {
  if (error instanceof FetchError && error.statusCode === 422) {
    return error.data?.errors ?? {}
  }

  return null
}

/**
 * Mensaje general para errores que no son de validación.
 */
export function mensajeDeErrorApi(error: unknown): string {
  if (error instanceof FetchError) {
    switch (error.statusCode) {
      case 401:
        return 'Tu sesión ha expirado. Vuelve a iniciar sesión.'
      case 403:
        // Las Policies devuelven motivos concretos ("Solo se pueden publicar
        // ediciones en borrador."); el mensaje por defecto de Laravel viene en inglés.
        return typeof error.data?.message === 'string' && error.data.message !== 'This action is unauthorized.'
          ? error.data.message
          : 'No tienes permiso para realizar esta acción.'
      case 404:
        return 'El registro no existe.'
      case 429:
        return 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.'
    }
  }

  return 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
}
