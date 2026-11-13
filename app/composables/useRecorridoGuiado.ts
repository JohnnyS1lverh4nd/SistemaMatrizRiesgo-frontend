import type { DriveStep } from 'driver.js'
import type { EstadoTour, Item, User } from '~/types/api'

/**
 * Recorrido guiado con Driver.js.
 *
 * - Los pasos salen de utils/pasosTour.ts según el rol del usuario.
 * - Un paso con elemento solo lo señala si está visible (en móvil el menú
 *   lateral está oculto): si no, el paso se muestra centrado.
 * - El resultado se guarda en el servidor (PUT /api/perfil/tour), no en el
 *   navegador: terminar = completado; cerrar o saltar = omitido (si ya lo
 *   había completado alguna vez, sigue completado).
 * - Driver.js y sus estilos se cargan solo al iniciar el recorrido.
 */
export function useRecorridoGuiado() {
  const { user, sesionMinutos } = useAuth()
  const { api } = useApi()

  const activo = useState<boolean>('tour:activo', () => false)

  async function guardarEstado(estado: EstadoTour) {
    try {
      const respuesta = await api<Item<User>>('/api/perfil/tour', { method: 'PUT', body: { estado } })
      user.value = respuesta.data
    } catch {
      // Sin conexión o sesión caducada: se recuerda en memoria para no volver
      // a invitar en esta visita; el servidor lo sabrá la próxima vez.
      if (user.value) {
        user.value = { ...user.value, tour: { estado, actualizado_at: new Date().toISOString() } }
      }
    }
  }

  function pasos(): DriveStep[] {
    return pasosTour({
      rol: user.value?.role?.slug,
      nombreRol: user.value?.role?.nombre,
      minutosSesion: sesionMinutos.value,
    }).map((paso) => {
      const elemento = paso.elemento ? document.querySelector(paso.elemento) : null
      const visible = elemento !== null && elemento.getClientRects().length > 0

      return {
        element: visible ? elemento : undefined,
        popover: {
          title: escaparHtml(paso.titulo),
          description: escaparHtml(paso.descripcion),
          side: paso.id === 'perfil' ? 'bottom' : 'right',
          align: 'start',
        },
      }
    })
  }

  async function iniciar() {
    if (activo.value || !user.value || !import.meta.client) {
      return
    }
    activo.value = true

    const [{ driver }] = await Promise.all([
      import('driver.js'),
      // Orden: primero los estilos de Driver.js, después los nuestros.
      import('driver.js/dist/driver.css').then(() => import('~/assets/css/tour.css')),
    ])

    const estadoPrevio = user.value.tour?.estado ?? null

    const recorrido = driver({
      steps: pasos(),
      popoverClass: 'tour-infotep',
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      closeBtnLabel: 'Cerrar recorrido',
      showButtons: ['next', 'previous', 'close'],
      // Un clic fuera no debe cerrar el recorrido por accidente.
      overlayClickBehavior: 'none',
      // Durante el recorrido los elementos señalados no navegan.
      disableActiveInteraction: true,
      allowKeyboardControl: true,
      smoothScroll: true,
      stagePadding: 6,
      stageRadius: 8,
      onPopoverRender: (popover, { driver: actual }) => {
        if (actual.isLastStep()) {
          return
        }
        const saltar = document.createElement('button')
        saltar.type = 'button'
        saltar.className = 'tour-saltar'
        saltar.textContent = 'Saltar recorrido'
        saltar.addEventListener('click', () => actual.destroy())
        popover.footer.prepend(saltar)
      },
      onDestroyed: (_elemento, _paso, { reason }) => {
        activo.value = false

        const final: EstadoTour = reason === 'done' || estadoPrevio === 'completado' ? 'completado' : 'omitido'
        if (reason === 'done' || final !== estadoPrevio) {
          guardarEstado(final)
        }
      },
    })

    recorrido.drive()
  }

  return { iniciar, guardarEstado, activo }
}

function escaparHtml(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}
