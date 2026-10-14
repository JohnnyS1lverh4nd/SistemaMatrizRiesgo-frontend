<script setup lang="ts">
import type { NivelRiesgo } from '~/types/api'

/**
 * Riesgos por nivel: barras horizontales finas, de Crítico a Bajo. El color
 * del nivel (estado) siempre va con su nombre y su cifra: nunca solo.
 */
const props = defineProps<{ datos: { nivel: NivelRiesgo, total: number }[] }>()

const filas = computed(() => [...props.datos].sort((a, b) => b.nivel.orden - a.nivel.orden))
const maximo = computed(() => Math.max(1, ...props.datos.map(d => d.total)))
</script>

<template>
  <ul class="space-y-3" aria-label="Riesgos por nivel">
    <li v-for="fila in filas" :key="fila.nivel.id" class="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm">
      <span class="flex items-center gap-2">
        <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: fila.nivel.color }" aria-hidden="true" />
        {{ fila.nivel.nombre }}
      </span>
      <span class="h-2 rounded-full bg-elevated" aria-hidden="true">
        <span
          class="block h-2 rounded-full"
          :style="{ width: `${(fila.total / maximo) * 100}%`, backgroundColor: fila.nivel.color }"
        />
      </span>
      <span class="text-right tabular-nums">{{ fila.total }}</span>
    </li>
  </ul>
</template>
