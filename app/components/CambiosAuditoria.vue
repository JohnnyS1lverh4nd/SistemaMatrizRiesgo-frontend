<script setup lang="ts">
import type { RegistroAuditoria } from '~/types/api'

// Campos que cambiaron en un registro de auditoría: "antes → después".
const props = defineProps<{ registro: RegistroAuditoria }>()

// Campos técnicos que no aportan a quien lee el historial.
const OCULTOS = new Set(['id', 'deleted_at', 'matriz_id', 'riesgo_id', 'proceso_id', 'user_id', 'orden', 'ruta', 'sha256'])

const filas = computed(() => {
  const antes = props.registro.valores_anteriores ?? {}
  const despues = props.registro.valores_nuevos ?? {}
  return [...new Set([...Object.keys(antes), ...Object.keys(despues)])]
    .filter(campo => !OCULTOS.has(campo))
    .map(campo => ({ campo, antes: antes[campo], despues: despues[campo] }))
})
</script>

<template>
  <p v-if="registro.descripcion" class="text-sm">
    {{ registro.descripcion }}
  </p>
  <dl v-if="filas.length" class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
    <template v-for="fila in filas" :key="fila.campo">
      <dt class="text-muted">
        {{ etiquetaCampo(fila.campo) }}
      </dt>
      <dd class="min-w-0 break-words">
        <template v-if="registro.valores_anteriores">
          <span class="text-muted line-through">{{ valorLegible(fila.antes) }}</span>
          <span class="mx-1 text-muted">→</span>
        </template>
        <span>{{ valorLegible(fila.despues) }}</span>
      </dd>
    </template>
  </dl>
</template>
