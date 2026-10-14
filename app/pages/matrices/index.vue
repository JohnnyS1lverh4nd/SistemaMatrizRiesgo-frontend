<script setup lang="ts">
import type { Coleccion, Departamento, Proceso } from '~/types/api'

// Procesos de los departamentos que el usuario puede ver (la API ya filtra
// por alcance: los encargados solo reciben los suyos).
const { api } = useApi()

interface Grupo {
  departamento: Departamento
  procesos: Proceso[]
}

const grupos = ref<Grupo[]>([])
const cargando = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const departamentos = (await api<Coleccion<Departamento>>('/api/departamentos', { query: { activo: 1 } })).data
    grupos.value = await Promise.all(departamentos.map(async departamento => ({
      departamento,
      procesos: (await api<Coleccion<Proceso>>(`/api/departamentos/${departamento.id}/procesos`, { query: { activo: 1 } })).data,
    })))
  } catch (e) {
    error.value = mensajeDeErrorApi(e)
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <UDashboardPanel id="matrices">
    <template #header>
      <UDashboardNavbar title="Matrices de riesgo" />
    </template>

    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

      <p v-if="cargando" class="text-sm text-muted">
        Cargando…
      </p>

      <UAlert
        v-else-if="!grupos.length"
        color="neutral"
        variant="subtle"
        icon="i-lucide-info"
        title="No tiene departamentos asignados."
        description="Pida al Administrador que le asigne uno o más departamentos."
      />

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <UCard v-for="grupo in grupos" :key="grupo.departamento.id">
          <template #header>
            <p class="font-semibold">
              {{ grupo.departamento.nombre }}
            </p>
            <p v-if="grupo.departamento.direccion" class="text-sm text-muted">
              {{ grupo.departamento.direccion }}
            </p>
          </template>

          <p v-if="!grupo.procesos.length" class="text-sm text-muted">
            Sin procesos activos.
          </p>
          <ul v-else class="divide-y divide-default">
            <li v-for="proceso in grupo.procesos" :key="proceso.id">
              <ULink :to="`/procesos/${proceso.id}`" class="flex items-center justify-between py-2">
                <span>{{ proceso.nombre }}</span>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-muted" />
              </ULink>
            </li>
          </ul>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
