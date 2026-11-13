<script setup lang="ts">
import type { Coleccion, Departamento, Proceso } from '~/types/api'

// Procesos (cada uno con su matriz) de los departamentos que el usuario puede
// ver: la API ya filtra por alcance, los encargados solo reciben los suyos.
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
      // Los inactivos solo los ve quien puede reactivarlos (su creador o el Administrador).
      procesos: (await api<Coleccion<Proceso>>(`/api/departamentos/${departamento.id}/procesos`)).data
        .filter(proceso => proceso.activo || proceso.permisos.editar),
    })))
  } catch (e) {
    error.value = mensajeDeErrorApi(e)
  } finally {
    cargando.value = false
  }
})

// --- Nueva matriz (= nuevo proceso del departamento) -------------------------

const nuevaMatriz = reactive({ abierto: false, departamento: null as Departamento | null })

function crearMatriz(departamento: Departamento) {
  Object.assign(nuevaMatriz, { abierto: true, departamento })
}

async function matrizCreada(proceso: Proceso) {
  await navigateTo(`/procesos/${proceso.id}`)
}
</script>

<template>
  <UDashboardPanel id="matrices">
    <template #header>
      <EncabezadoPanel title="Matrices de riesgo" />
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
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-semibold">
                  {{ grupo.departamento.nombre }}
                </p>
                <p v-if="grupo.departamento.direccion" class="text-sm text-muted">
                  {{ grupo.departamento.direccion }}
                </p>
              </div>
              <UButton
                v-if="grupo.departamento.permisos.crear_proceso"
                icon="i-lucide-plus"
                label="Nueva matriz"
                size="sm"
                variant="soft"
                class="shrink-0"
                @click="crearMatriz(grupo.departamento)"
              />
            </div>
          </template>

          <p v-if="!grupo.procesos.length" class="text-sm text-muted">
            Sin procesos activos.
          </p>
          <ul v-else class="divide-y divide-default">
            <li v-for="proceso in grupo.procesos" :key="proceso.id">
              <ULink :to="`/procesos/${proceso.id}`" class="flex items-center justify-between gap-2 py-2">
                <span :class="{ 'text-muted': !proceso.activo }">{{ proceso.nombre }}</span>
                <span class="flex shrink-0 items-center gap-2">
                  <EstadoActivo v-if="!proceso.activo" :activo="false" />
                  <UIcon name="i-lucide-chevron-right" class="size-4 text-muted" />
                </span>
              </ULink>
            </li>
          </ul>
        </UCard>
      </div>

      <NuevaMatrizModal
        v-if="nuevaMatriz.departamento"
        v-model:open="nuevaMatriz.abierto"
        :departamento="nuevaMatriz.departamento"
        @creado="matrizCreada"
      />
    </template>
  </UDashboardPanel>
</template>
