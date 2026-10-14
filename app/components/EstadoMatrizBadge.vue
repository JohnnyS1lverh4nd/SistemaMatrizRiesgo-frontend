<script setup lang="ts">
import type { EstadoMatriz } from '~/types/api'

const props = defineProps<{ estado: EstadoMatriz }>()

const estilos: Record<EstadoMatriz, { label: string, color: 'warning' | 'success' | 'neutral', icon: string }> = {
  borrador: { label: 'Borrador', color: 'warning', icon: 'i-lucide-pencil-line' },
  vigente: { label: 'Vigente', color: 'success', icon: 'i-lucide-badge-check' },
  archivada: { label: 'Archivada', color: 'neutral', icon: 'i-lucide-archive' },
}

const estilo = computed(() => estilos[props.estado])
</script>

<template>
  <UBadge :label="estilo.label" :color="estilo.color" :icon="estilo.icon" variant="subtle" />
</template>
