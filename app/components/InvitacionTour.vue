<script setup lang="ts">
/**
 * Invitación al recorrido guiado en el primer ingreso (estado del servidor
 * null). No bloquea el sistema:
 *   - «Comenzar recorrido»: lo inicia al cerrarse el modal.
 *   - «Ahora no»: se guarda como omitido (no se vuelve a invitar).
 *   - Cerrar con la X o Esc: no decide nada; se invita de nuevo en el
 *     próximo ingreso, pero no otra vez en esta visita.
 * Siempre se puede iniciar desde Ayuda.
 */
const { user } = useAuth()
const { iniciar, guardarEstado, activo } = useRecorridoGuiado()

// Ya se mostró en esta visita (no repetirla al cambiar de página).
const mostrada = useState<boolean>('tour:invitacion-mostrada', () => false)
const abierto = ref(false)
let comenzarAlCerrar = false

watch(
  () => user.value?.tour,
  (tour) => {
    if (tour && tour.estado === null && !mostrada.value && !activo.value) {
      mostrada.value = true
      abierto.value = true
    }
  },
  { immediate: true },
)

function comenzar() {
  comenzarAlCerrar = true
  abierto.value = false
}

function ahoraNo() {
  abierto.value = false
  guardarEstado('omitido')
}

// El recorrido empieza cuando el modal terminó de cerrarse: si no, su capa
// quedaría encima de los elementos señalados.
function alCerrar() {
  if (comenzarAlCerrar) {
    comenzarAlCerrar = false
    iniciar()
  }
}
</script>

<template>
  <UModal
    v-model:open="abierto"
    title="¿Le mostramos cómo usar el sistema?"
    description="Un recorrido breve por los módulos que su rol puede usar."
    @after:leave="alCerrar"
  >
    <template #body>
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-compass" class="mt-0.5 size-6 shrink-0 text-primary" />
        <p class="text-sm text-muted">
          Le señalaremos el menú, las matrices, los reportes y su perfil, paso a paso. Puede saltarlo en cualquier momento y repetirlo cuando quiera desde <strong class="text-default">Ayuda</strong>.
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Ahora no" color="neutral" variant="ghost" @click="ahoraNo" />
        <UButton label="Comenzar recorrido" icon="i-lucide-play" @click="comenzar" />
      </div>
    </template>
  </UModal>
</template>
