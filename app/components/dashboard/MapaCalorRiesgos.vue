<script setup lang="ts">
import type { DatosDashboard } from '~/types/api'

/**
 * Mapa de calor: cuántos riesgos vigentes hay en cada combinación
 * Probabilidad × Impacto. El fondo es un tinte suave del color del nivel de
 * esa zona (nunca un bloque saturado); la cifra va en tinta normal y el nombre
 * del nivel acompaña siempre al color. Es una tabla real: se lee con lector de
 * pantalla y con teclado.
 */
const props = defineProps<{ celdas: DatosDashboard['mapa_calor'] }>()

const VALORES = [1, 2, 3, 4]
const filas = [...VALORES].reverse()

function celda(p: number, i: number) {
  return props.celdas.find(c => c.probabilidad === p && c.impacto === i)
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-separate border-spacing-0.5 text-sm">
      <caption class="sr-only">
        Número de riesgos vigentes por probabilidad (filas) e impacto (columnas)
      </caption>
      <thead>
        <tr>
          <th scope="col" class="w-24 p-1 text-left text-xs font-normal text-muted">
            Prob. ↓ · Impacto →
          </th>
          <th v-for="i in VALORES" :key="i" scope="col" class="p-1 text-xs font-medium text-muted">
            {{ i }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in filas" :key="p">
          <th scope="row" class="p-1 text-left text-xs font-medium text-muted">
            {{ p }}
          </th>
          <td v-for="i in VALORES" :key="i" class="p-0">
            <UTooltip
              v-if="celda(p, i)"
              :text="`Probabilidad ${p} × Impacto ${i}: ${celda(p, i)!.total} ${celda(p, i)!.total === 1 ? 'riesgo' : 'riesgos'} · ${celda(p, i)!.nivel.nombre}`"
            >
              <div
                tabindex="0"
                class="flex h-16 min-w-16 flex-col justify-between rounded-md border-l-4 p-2 focus-visible:outline-2 focus-visible:outline-primary"
                :style="{
                  borderLeftColor: celda(p, i)!.nivel.color,
                  // Tinte del color de la zona: ~15 % si hay riesgos, ~6 % si está vacía.
                  backgroundColor: `${celda(p, i)!.nivel.color}${celda(p, i)!.total ? '26' : '0f'}`,
                }"
              >
                <span class="text-lg font-semibold" :class="celda(p, i)!.total ? '' : 'text-dimmed'">
                  {{ celda(p, i)!.total }}
                </span>
                <span class="truncate text-[11px] text-muted">{{ celda(p, i)!.nivel.nombre }}</span>
              </div>
            </UTooltip>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
