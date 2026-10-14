<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const toast = useToast()

async function alGuardar() {
  toast.add({ title: 'Usuario creado', color: 'success', icon: 'i-lucide-check' })
  await navigateTo('/usuarios')
}
</script>

<template>
  <UDashboardPanel id="nuevo-usuario">
    <template #header>
      <UDashboardNavbar title="Nuevo usuario">
        <template #leading>
          <UButton to="/usuarios" icon="i-lucide-arrow-left" color="neutral" variant="ghost" aria-label="Volver a usuarios" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UsuarioForm @guardado="alGuardar" />
    </template>
  </UDashboardPanel>
</template>
