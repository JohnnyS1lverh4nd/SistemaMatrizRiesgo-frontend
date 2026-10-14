<script setup lang="ts">
/**
 * Confirmación de acciones con consecuencias (publicar, archivar, descartar).
 * El componente padre hace la petición en @confirmar y cierra el modal.
 */
defineProps<{
  titulo: string
  descripcion: string
  etiqueta: string
  color?: 'primary' | 'error' | 'warning' | 'neutral'
  procesando?: boolean
}>()

const emit = defineEmits<{ confirmar: [] }>()
const abierto = defineModel<boolean>('open', { default: false })
</script>

<template>
  <UModal v-model:open="abierto" :title="titulo" :description="descripcion">
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="abierto = false" />
        <UButton :label="etiqueta" :color="color ?? 'primary'" :loading="procesando" @click="emit('confirmar')" />
      </div>
    </template>
  </UModal>
</template>
