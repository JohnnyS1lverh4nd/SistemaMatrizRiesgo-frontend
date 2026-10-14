<template>
  <!-- UApp: contexto de Nuxt UI (notificaciones, modales, tooltips). -->
  <UApp :locale="es">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AvisoInactividad />
  </UApp>
</template>

<script setup lang="ts">
import { es } from '@nuxt/ui/locale'
</script>
