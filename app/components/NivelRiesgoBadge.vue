<script setup lang="ts">
import type { NivelRiesgo } from '~/types/api'

// Color definido por el Administrador en el catálogo de niveles.
const props = defineProps<{ nivel: NivelRiesgo | null }>()

const TEXTO_OSCURO = '#111827'
const TEXTO_CLARO = '#ffffff'

function luminancia(hex: string): number {
  const [r, g, b] = [0, 2, 4]
    .map(i => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contraste(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

// Elige el color de texto con mayor contraste (WCAG) sobre el fondo, para que
// el nivel sea legible con cualquier color que configure el Administrador.
const colorTexto = computed(() => {
  const hex = props.nivel?.color.replace('#', '') ?? ''
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return TEXTO_OSCURO
  }

  const fondo = luminancia(hex)
  return contraste(fondo, luminancia(TEXTO_OSCURO.slice(1))) >= contraste(fondo, 1)
    ? TEXTO_OSCURO
    : TEXTO_CLARO
})
</script>

<template>
  <span
    v-if="nivel"
    class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
    :style="{ backgroundColor: nivel.color, color: colorTexto }"
  >
    {{ nivel.nombre }}
  </span>
  <span v-else class="text-xs text-muted">Sin evaluar</span>
</template>
