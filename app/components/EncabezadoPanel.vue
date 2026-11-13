<script setup lang="ts">
/**
 * Barra superior de cada pantalla (UDashboardNavbar) con el acceso a Perfil
 * siempre en la esquina superior derecha, después de las acciones propias
 * de la página. Las páginas la usan igual que UDashboardNavbar: `title` y los
 * slots #leading (p. ej. volver) y #right (acciones).
 */
defineProps<{ title?: string }>()

const slots = defineSlots<{
  leading?: () => unknown
  right?: () => unknown
}>()
</script>

<template>
  <UDashboardNavbar :title="title">
    <template v-if="slots.leading" #leading>
      <slot name="leading" />
    </template>

    <template #right>
      <slot name="right" />
      <USeparator v-if="slots.right" orientation="vertical" class="mx-1 h-6" />
      <UButton
        to="/perfil"
        icon="infotep:perfil"
        color="neutral"
        variant="ghost"
        active-variant="soft"
        aria-label="Perfil"
        data-tour="perfil"
      >
        <!-- En pantallas estrechas queda solo el icono (con aria-label). -->
        <span class="hidden sm:inline">Perfil</span>
      </UButton>
    </template>
  </UDashboardNavbar>
</template>
