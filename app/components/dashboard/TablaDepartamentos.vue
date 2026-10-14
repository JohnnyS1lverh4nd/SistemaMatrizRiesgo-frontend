<script setup lang="ts">
import type { DatosDashboard, NivelRiesgo } from '~/types/api'

/**
 * Consolidado por departamento/dirección (RF-6). Las cifras por nivel van en
 * columnas con nombre (la tabla es la vista accesible); la barra apilada es
 * un resumen visual con separación de 2 px entre segmentos.
 */
const props = defineProps<{
  filas: DatosDashboard['por_departamento']
  niveles: NivelRiesgo[]
}>()

const nivelesDesc = computed(() => [...props.niveles].sort((a, b) => b.orden - a.orden))
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="text-left text-xs text-muted">
        <tr class="border-b border-default">
          <th scope="col" class="py-2 pr-3 font-medium">
            Departamento
          </th>
          <th v-for="nivel in nivelesDesc" :key="nivel.id" scope="col" class="px-2 py-2 text-right font-medium">
            <span class="inline-flex items-center gap-1.5">
              <span class="size-2 rounded-full" :style="{ backgroundColor: nivel.color }" aria-hidden="true" />
              {{ nivel.nombre }}
            </span>
          </th>
          <th scope="col" class="px-2 py-2 text-right font-medium">
            Total
          </th>
          <th scope="col" class="w-40 px-2 py-2 font-medium">
            Distribución
          </th>
          <th scope="col" class="py-2 pl-2 text-right font-medium">
            Procesos sin vigente
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="fila in filas" :key="fila.departamento.id" class="border-b border-default last:border-0">
          <th scope="row" class="py-2 pr-3 text-left font-normal">
            <span class="font-medium">{{ fila.departamento.nombre }}</span>
            <span v-if="fila.departamento.direccion" class="block text-xs text-muted">{{ fila.departamento.direccion }}</span>
          </th>
          <td v-for="nivel in nivelesDesc" :key="nivel.id" class="px-2 py-2 text-right tabular-nums" :class="fila.por_nivel[nivel.slug] ? '' : 'text-dimmed'">
            {{ fila.por_nivel[nivel.slug] ?? 0 }}
          </td>
          <td class="px-2 py-2 text-right font-medium tabular-nums">
            {{ fila.total }}
          </td>
          <td class="px-2 py-2">
            <div v-if="fila.total" class="flex h-2 gap-0.5" aria-hidden="true">
              <template v-for="nivel in nivelesDesc" :key="nivel.id">
                <UTooltip v-if="fila.por_nivel[nivel.slug]" :text="`${nivel.nombre}: ${fila.por_nivel[nivel.slug]}`">
                  <span
                    class="h-2 rounded-sm first:rounded-l-full last:rounded-r-full"
                    :style="{ width: `${(fila.por_nivel[nivel.slug]! / fila.total) * 100}%`, backgroundColor: nivel.color }"
                  />
                </UTooltip>
              </template>
            </div>
            <span v-else class="text-xs text-dimmed">Sin riesgos vigentes</span>
          </td>
          <td class="py-2 pl-2 text-right tabular-nums">
            <UBadge v-if="fila.procesos_sin_vigente" :label="String(fila.procesos_sin_vigente)" color="warning" variant="subtle" icon="i-lucide-triangle-alert" />
            <span v-else class="text-dimmed">0</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
