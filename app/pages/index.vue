<script setup lang="ts">
import type { Coleccion, DatosDashboard, Departamento } from '~/types/api'

/**
 * Dashboard (RF-6): situación actual (ediciones vigentes) dentro del alcance
 * del usuario. Las cifras las calcula Laravel; aquí solo se presentan.
 */
const { user } = useAuth()
const { api } = useApi()

const datos = ref<DatosDashboard | null>(null)
const cargando = ref(false)
const error = ref<string | null>(null)

const departamentos = ref<Departamento[]>([])
const departamentoId = ref<number | undefined>(undefined)

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    const query = departamentoId.value ? { departamento_id: departamentoId.value } : {}
    datos.value = (await api<{ data: DatosDashboard }>('/api/dashboard', { query })).data
  } catch (e) {
    error.value = mensajeDeErrorApi(e)
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargar()
  try {
    departamentos.value = (await api<Coleccion<Departamento>>('/api/departamentos', { query: { activo: 1 } })).data
  } catch {
    // Sin el filtro el dashboard sigue funcionando con todo su alcance.
  }
})

watch(departamentoId, cargar)

const opcionesDepartamento = computed(() => [
  { label: 'Todos mis departamentos', value: undefined },
  ...departamentos.value.map(d => ({ label: d.nombre, value: d.id })),
])

const niveles = computed(() => datos.value?.por_nivel.map(f => f.nivel) ?? [])

// Enlaces del dashboard al reporte detallado, conservando el filtro activo.
function reporte(extra: Record<string, string | number>) {
  const query = { ...(departamentoId.value ? { departamento_id: departamentoId.value } : {}), ...extra }
  return { path: '/reportes', query }
}
</script>

<template>
  <UDashboardPanel id="inicio">
    <template #header>
      <UDashboardNavbar title="Inicio">
        <template #right>
          <UButton to="/reportes" icon="i-lucide-file-search" label="Reporte de riesgos" color="neutral" variant="ghost" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-lg font-semibold">
            Hola, {{ user?.name }}
          </p>
          <p class="text-sm text-muted">
            Situación actual: riesgos de las ediciones vigentes{{ user?.role?.slug === 'encargado-departamento' || user?.role?.slug === 'encargado-seguimiento' ? ' de sus departamentos' : '' }}.
          </p>
        </div>
        <UFormField v-if="departamentos.length > 1" label="Departamento" name="departamento_id">
          <USelect v-model="departamentoId" :items="opcionesDepartamento" class="w-64" />
        </UFormField>
      </div>

      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

      <p v-if="!datos && cargando" class="text-sm text-muted">
        Cargando…
      </p>

      <!-- Al recargar se mantiene lo anterior atenuado (sin saltos de diseño). -->
      <div v-if="datos" class="space-y-4 transition-opacity" :class="{ 'opacity-60': cargando }">
        <UAlert
          v-if="datos.total_riesgos === 0"
          color="neutral"
          variant="subtle"
          icon="i-lucide-info"
          title="Aún no hay riesgos en ediciones vigentes."
          description="Publique una edición de matriz para ver aquí sus indicadores."
        />

        <!-- Indicadores -->
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardIndicador etiqueta="Riesgos vigentes" :valor="datos.total_riesgos" icono="i-lucide-shield-alert" />
          <DashboardIndicador
            etiqueta="Críticos y altos pendientes"
            :valor="datos.prioritarios_pendientes"
            descripcion="Tratamiento no cumplido"
            icono="i-lucide-siren"
            :to="reporte({ prioritarios: 1 })"
            alerta
          />
          <DashboardIndicador
            etiqueta="Seguimientos atrasados"
            :valor="datos.seguimientos_atrasados"
            descripcion="Sin seguimiento en el plazo de su periodicidad"
            icono="i-lucide-clock-alert"
            :to="reporte({ atrasados: 1 })"
            alerta
          />
          <DashboardIndicador
            etiqueta="Tratamientos cumplidos"
            :valor="datos.por_estado_tratamiento.cumplido"
            :descripcion="`de ${datos.total_riesgos} riesgos`"
            icono="i-lucide-circle-check"
            :to="reporte({ estado_tratamiento: 'cumplido' })"
          />
        </div>

        <div class="grid gap-4 xl:grid-cols-3">
          <UCard>
            <template #header>
              <h2 class="font-semibold">
                Riesgos por nivel
              </h2>
            </template>
            <DashboardDistribucionNiveles :datos="datos.por_nivel" />
          </UCard>

          <UCard class="xl:col-span-2">
            <template #header>
              <h2 class="font-semibold">
                Mapa de calor
              </h2>
              <p class="text-xs text-muted">
                Número de riesgos en cada combinación de probabilidad e impacto.
              </p>
            </template>
            <DashboardMapaCalorRiesgos :celdas="datos.mapa_calor" />
          </UCard>
        </div>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Estado del tratamiento
            </h2>
          </template>
          <dl class="grid grid-cols-3 gap-4">
            <NuxtLink
              v-for="(total, estado) in datos.por_estado_tratamiento"
              :key="estado"
              :to="reporte({ estado_tratamiento: estado })"
              class="rounded-md p-2 hover:bg-elevated"
            >
              <dt class="flex items-center gap-2 text-sm text-muted">
                <UBadge :label="ESTADOS_TRATAMIENTO[estado].label" :color="ESTADOS_TRATAMIENTO[estado].color" variant="subtle" />
              </dt>
              <dd class="mt-1 text-2xl font-semibold">
                {{ total }}
              </dd>
            </NuxtLink>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Por departamento
            </h2>
            <p class="text-xs text-muted">
              Riesgos vigentes por nivel y procesos que aún no tienen una edición vigente.
            </p>
          </template>
          <DashboardTablaDepartamentos :filas="datos.por_departamento" :niveles="niveles" />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
