<script setup lang="ts">
import type { Coleccion, RegistroAuditoria } from '~/types/api'

/**
 * Historial de cambios de un riesgo o de una edición (auditoría, RF-9).
 * La API decide quién puede verlo: quien puede ver ese registro.
 */
const props = defineProps<{ titulo: string, url: string | null }>()
const abierto = defineModel<boolean>('open', { default: false })

const { api } = useApi()
const registros = ref<RegistroAuditoria[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)

watch(abierto, async (valor) => {
  if (!valor || !props.url) {
    return
  }
  cargando.value = true
  error.value = null
  try {
    registros.value = (await api<Coleccion<RegistroAuditoria>>(props.url)).data
  } catch (e) {
    error.value = mensajeDeErrorApi(e)
  } finally {
    cargando.value = false
  }
})

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<template>
  <USlideover v-model:open="abierto" :title="titulo" description="Quién cambió qué y cuándo." :ui="{ content: 'max-w-xl' }">
    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />
      <p v-else-if="cargando" class="text-sm text-muted">
        Cargando…
      </p>
      <p v-else-if="!registros.length" class="text-sm text-muted">
        Sin cambios registrados.
      </p>
      <ol v-else class="space-y-3">
        <li v-for="registro in registros" :key="registro.id" class="space-y-2 rounded-md border border-default p-3">
          <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              <span class="font-medium">{{ registro.usuario?.name ?? 'Sistema' }}</span>
              <span class="text-muted"> · {{ fechaHora(registro.fecha) }}</span>
            </span>
            <UBadge
              :label="EVENTOS_AUDITORIA[registro.evento]?.label ?? registro.evento"
              :color="EVENTOS_AUDITORIA[registro.evento]?.color ?? 'neutral'"
              variant="subtle"
            />
          </div>
          <CambiosAuditoria :registro="registro" />
        </li>
      </ol>
    </template>
  </USlideover>
</template>
