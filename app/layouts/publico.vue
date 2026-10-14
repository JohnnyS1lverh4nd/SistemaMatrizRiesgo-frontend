<template>
  <!-- Páginas sin sesión: login y recuperación de contraseña. -->
  <main class="flex min-h-screen items-center justify-center bg-muted p-4">
    <div class="w-full max-w-sm">
      <div class="mb-6 flex items-center justify-center gap-2">
        <UIcon name="i-lucide-shield-alert" class="size-6 text-primary" />
        <span class="text-lg font-semibold">Matrices de Riesgo · INFOTEP</span>
      </div>
      <slot />
    </div>
  </main>
</template>
