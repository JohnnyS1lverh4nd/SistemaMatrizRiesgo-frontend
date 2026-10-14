<script setup lang="ts">
defineProps<{ activo: boolean }>()
</script>

<template>
  <UBadge
    :label="activo ? 'Activo' : 'Inactivo'"
    :color="activo ? 'success' : 'neutral'"
    variant="subtle"
  />
</template>
