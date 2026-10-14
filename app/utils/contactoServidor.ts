/**
 * Momento (ms) de la última respuesta correcta de la API. Laravel renueva la
 * sesión en cada petición, así que este valor indica cuándo vence la sesión
 * en el servidor. Se comparte entre pestañas mediante localStorage: una
 * pestaña activa mantiene viva la sesión de las demás.
 */
const CLAVE = 'smr:ultimo-contacto-servidor'

let enMemoria = 0

export function marcarContactoServidor(momento = Date.now()): void {
  enMemoria = Math.max(enMemoria, momento)

  try {
    localStorage.setItem(CLAVE, String(enMemoria))
  } catch {
    // localStorage no disponible (modo privado, bloqueado): basta la memoria.
  }
}

export function ultimoContactoServidor(): number {
  let compartido = 0

  try {
    compartido = Number(localStorage.getItem(CLAVE)) || 0
  } catch {
    // Ver marcarContactoServidor.
  }

  return Math.max(enMemoria, compartido)
}
