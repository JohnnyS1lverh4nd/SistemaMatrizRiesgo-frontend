<script setup lang="ts">
import type { Item, Movimiento } from '~/types/api'

/**
 * Detalle de un movimiento del historial: quién, cuándo, dónde, qué y los
 * valores anteriores y nuevos. Se pide a la API al abrir (GET
 * /api/movimientos/{id}), que vuelve a comprobar el alcance del usuario.
 */
const props = defineProps<{ movimientoId: number | null }>()
const abierto = defineModel<boolean>('open', { default: false })

const { api } = useApi()
const movimiento = ref<Movimiento | null>(null)
const cargando = ref(false)
const error = ref<string | null>(null)

watch([abierto, () => props.movimientoId], async ([valor, id]) => {
  if (!valor || !id) {
    return
  }

  cargando.value = true
  error.value = null
  movimiento.value = null
  try {
    movimiento.value = (await api<Item<Movimiento>>(`/api/movimientos/${id}`)).data
  } catch (e) {
    error.value = mensajeDeErrorApi(e)
  } finally {
    cargando.value = false
  }
}, { immediate: true })

const evento = computed(() => movimiento.value ? EVENTOS_AUDITORIA[movimiento.value.evento] : undefined)
const sinCambios = computed(() => !movimiento.value?.valores_anteriores && !movimiento.value?.valores_nuevos && !movimiento.value?.descripcion)

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-DO', { dateStyle: 'full', timeStyle: 'medium' })
}
</script>

<template>
  <USlideover v-model:open="abierto" title="Detalle del movimiento" :ui="{ content: 'max-w-xl' }">
    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />
      <p v-else-if="cargando || !movimiento" class="text-sm text-muted">
        Cargando…
      </p>

      <div v-else class="space-y-5">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge :label="evento?.label ?? movimiento.evento" :color="evento?.color ?? 'neutral'" variant="subtle" />
          <span class="font-medium">{{ registroAfectado(movimiento.entidad, movimiento.entidad_id) }}</span>
        </div>

        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt class="text-muted">
            Fecha y hora
          </dt>
          <dd>{{ fechaHora(movimiento.fecha) }}</dd>

          <dt class="text-muted">
            Usuario
          </dt>
          <dd>{{ movimiento.usuario?.name ?? 'Sistema / sin sesión' }}</dd>

          <dt class="text-muted">
            Departamento
          </dt>
          <dd>{{ movimiento.departamento?.nombre ?? '—' }}</dd>

          <dt class="text-muted">
            Proceso
          </dt>
          <dd>{{ movimiento.proceso?.nombre ?? '—' }}</dd>

          <dt class="text-muted">
            Edición
          </dt>
          <dd>
            <template v-if="movimiento.matriz">
              <ULink v-if="!movimiento.matriz.descartada" :to="`/matrices/${movimiento.matriz.id}`" class="text-primary underline-offset-2 hover:underline">
                {{ movimiento.matriz.nombre }}
              </ULink>
              <span v-else>{{ movimiento.matriz.nombre }} <span class="text-muted">(borrador descartado)</span></span>
            </template>
            <span v-else>—</span>
          </dd>
        </dl>

        <section class="space-y-2">
          <h3 class="text-sm font-semibold">
            Cambios registrados
          </h3>
          <p v-if="sinCambios" class="text-sm text-muted">
            Este movimiento no guarda valores (por ejemplo, una exportación o una eliminación).
          </p>
          <div v-else class="rounded-md border border-default p-3">
            <p v-if="movimiento.valores_anteriores && movimiento.valores_nuevos" class="mb-2 text-xs text-muted">
              Valor anterior tachado → valor nuevo.
            </p>
            <CambiosAuditoria :registro="movimiento" />
          </div>
        </section>
      </div>
    </template>
  </USlideover>
</template>
