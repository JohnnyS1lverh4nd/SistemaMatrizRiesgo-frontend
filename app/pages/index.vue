<script setup lang="ts">
// Página de inicio: la navegación y el cierre de sesión están en el layout.
const { user } = useAuth()
</script>

<template>
  <UDashboardPanel id="inicio">
    <template #header>
      <UDashboardNavbar title="Inicio" />
    </template>

    <template #body>
      <div v-if="user" class="grid max-w-3xl gap-4 md:grid-cols-2">
        <UCard>
          <p class="text-sm text-muted">
            Bienvenido
          </p>
          <p class="text-lg font-semibold">
            {{ user.name }}
          </p>
          <p class="text-sm">
            {{ user.role?.nombre ?? 'Sin rol asignado' }}
          </p>
        </UCard>

        <UCard>
          <p class="mb-2 text-sm text-muted">
            Departamentos asignados
          </p>
          <div v-if="user.departamentos.length" class="flex flex-wrap gap-2">
            <UBadge
              v-for="departamento in user.departamentos"
              :key="departamento.id"
              :label="departamento.nombre"
              color="neutral"
              variant="subtle"
            />
          </div>
          <p v-else class="text-sm">
            Ninguno.
          </p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
