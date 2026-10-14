<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

async function alGuardar() {
  await navigateTo('/usuarios')
}
</script>

<template>
  <main style="max-width: 64rem; margin: 2rem auto; padding: 0 1rem; font-family: sans-serif;">
    <p><NuxtLink to="/usuarios">← Usuarios</NuxtLink></p>
    <h1>Nuevo usuario</h1>
    <UsuarioForm @guardado="alGuardar" />
  </main>
</template>
