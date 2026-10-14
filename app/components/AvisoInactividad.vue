<script setup lang="ts">
/**
 * Cierre de sesión por inactividad (requisito no funcional del DRO).
 *
 * - La duración la fija Laravel (config/session.php) y llega en /api/user.
 * - El tiempo se mide desde la última respuesta de la API, que es lo que
 *   renueva la sesión en el servidor (ver utils/contactoServidor.ts).
 * - Si el usuario está activo (ratón, teclado, scroll) pero no hace
 *   peticiones, se envía un "latido" como mucho cada 30 s.
 * - Un minuto antes del vencimiento se muestra el aviso; el usuario debe
 *   confirmar con "Seguir conectado" (mover el ratón ya no basta).
 */
const AVISO_MS = 60_000
// Se cierra unos segundos antes que el servidor para que el logout aún sea válido.
const MARGEN_MS = 5_000
const LATIDO_MINIMO_MS = 30_000
const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'wheel', 'scroll', 'touchstart'] as const

const { user, sesionMinutos, logout } = useAuth()
const { api } = useApi()
const router = useRouter()

const restanteMs = ref(Number.POSITIVE_INFINITY)

const visible = computed(() => user.value !== null && restanteMs.value <= AVISO_MS)
const segundos = computed(() => Math.max(0, Math.ceil(restanteMs.value / 1000)))

let intervalo: ReturnType<typeof setInterval> | undefined
let ultimaRevisionActividad = 0
let latidoEnCurso = false
let cerrando = false

function actualizar() {
  if (user.value === null || !sesionMinutos.value) {
    restanteMs.value = Number.POSITIVE_INFINITY
    return
  }

  restanteMs.value = ultimoContactoServidor() + sesionMinutos.value * 60_000 - MARGEN_MS - Date.now()

  if (restanteMs.value <= 0) {
    cerrarPorInactividad()
  }
}

async function latido() {
  if (latidoEnCurso) {
    return
  }

  latidoEnCurso = true
  try {
    await api('/api/user')
  } catch {
    // Un 401 ya lo gestiona useApi (redirige al login).
  } finally {
    latidoEnCurso = false
    actualizar()
  }
}

function alDetectarActividad() {
  const ahora = Date.now()

  // mousemove dispara cientos de eventos: se revisa como mucho una vez por segundo.
  if (ahora - ultimaRevisionActividad < 1000) {
    return
  }
  ultimaRevisionActividad = ahora

  if (user.value === null || visible.value) {
    return
  }

  if (ahora - ultimoContactoServidor() >= LATIDO_MINIMO_MS) {
    latido()
  }
}

async function cerrarPorInactividad() {
  if (cerrando) {
    return
  }

  cerrando = true
  try {
    await logout()
  } catch {
    // Aunque el logout falle, la sesión local ya se limpió.
  } finally {
    cerrando = false
    await router.push({ path: '/login', query: { motivo: 'inactividad' } })
  }
}

async function cerrarAhora() {
  try {
    await logout()
  } finally {
    await router.push('/login')
  }
}

onMounted(() => {
  intervalo = setInterval(actualizar, 1000)
  EVENTOS_ACTIVIDAD.forEach(evento =>
    window.addEventListener(evento, alDetectarActividad, { passive: true }),
  )
})

onBeforeUnmount(() => {
  clearInterval(intervalo)
  EVENTOS_ACTIVIDAD.forEach(evento => window.removeEventListener(evento, alDetectarActividad))
})
</script>

<template>
  <!-- No se puede cerrar con Escape ni clic fuera: hay que elegir una acción. -->
  <UModal
    :open="visible"
    :dismissible="false"
    :close="false"
    title="Tu sesión está por cerrarse"
    description="Por inactividad, la sesión se cerrará automáticamente."
  >
    <template #body>
      <p class="text-center text-3xl font-semibold tabular-nums" aria-live="polite">
        {{ segundos }} s
      </p>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cerrar sesión" color="neutral" variant="ghost" @click="cerrarAhora" />
        <UButton label="Seguir conectado" icon="i-lucide-refresh-cw" autofocus @click="latido" />
      </div>
    </template>
  </UModal>
</template>
