<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * Indicador (stat tile): una cifra destacada con su etiqueta. Opcionalmente
 * enlaza al reporte que la detalla.
 */
defineProps<{
  etiqueta: string
  valor: number
  descripcion?: string
  icono: string
  to?: RouteLocationRaw
  // Solo cuando la cifra indica algo que requiere atención y es mayor que 0.
  alerta?: boolean
}>()
</script>

<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'div'"
    :to="to"
    class="block rounded-lg border border-default bg-default p-4 transition-colors"
    :class="to ? 'hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary' : ''"
  >
    <div class="flex items-center justify-between gap-2 text-sm text-muted">
      <span>{{ etiqueta }}</span>
      <UIcon :name="icono" class="size-5" :class="alerta && valor > 0 ? 'text-error' : ''" aria-hidden="true" />
    </div>
    <!-- Cifra proporcional (no tabular) en tamaño destacado. -->
    <p class="mt-2 text-3xl font-semibold">
      {{ valor }}
    </p>
    <p v-if="descripcion" class="mt-1 text-xs text-muted">
      {{ descripcion }}
    </p>
  </component>
</template>
