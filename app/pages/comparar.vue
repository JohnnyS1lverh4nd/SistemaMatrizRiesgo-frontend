<script setup lang="ts">
import type { Coleccion, ComparacionEdiciones, Item, Matriz, Proceso } from '~/types/api'

/**
 * Comparación de dos ediciones de un proceso (RF-5): riesgos agregados,
 * cerrados y cambios de nivel. /comparar?proceso=ID[&base=ID&nueva=ID]
 */
const route = useRoute()
const router = useRouter()
const { api } = useApi()

const procesoId = Number(route.query.proceso)
const proceso = ref<Proceso | null>(null)
const ediciones = ref<Matriz[]>([])
const base = ref<number | undefined>(Number(route.query.base) || undefined)
const nueva = ref<number | undefined>(Number(route.query.nueva) || undefined)

const resultado = ref<ComparacionEdiciones | null>(null)
const cargando = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    proceso.value = (await api<Item<Proceso>>(`/api/procesos/${procesoId}`)).data
    // Más recientes primero; los borradores no se comparan.
    ediciones.value = (await api<Coleccion<Matriz>>(`/api/procesos/${procesoId}/matrices`)).data.filter(e => e.estado !== 'borrador')
    nueva.value ??= ediciones.value[0]?.id
    base.value ??= ediciones.value[1]?.id
    await comparar()
  } catch (e) {
    error.value = mensajeDeErrorApi(e)
  }
})

async function comparar() {
  if (!base.value || !nueva.value || base.value === nueva.value) {
    resultado.value = null
    return
  }
  cargando.value = true
  error.value = null
  router.replace({ query: { proceso: procesoId, base: base.value, nueva: nueva.value } })
  try {
    resultado.value = (await api<{ data: ComparacionEdiciones }>(`/api/matrices/${base.value}/comparar/${nueva.value}`)).data
  } catch (e) {
    error.value = erroresDeValidacion(e)?.matriz?.[0] ?? mensajeDeErrorApi(e)
  } finally {
    cargando.value = false
  }
}

watch([base, nueva], comparar)

const opciones = computed(() => ediciones.value.map(e => ({ label: `${e.nombre} (${e.estado})`, value: e.id })))
</script>

<template>
  <UDashboardPanel id="comparar">
    <template #header>
      <UDashboardNavbar :title="proceso ? `Comparar ediciones · ${proceso.nombre}` : 'Comparar ediciones'">
        <template #leading>
          <UButton :to="`/procesos/${procesoId}`" icon="i-lucide-arrow-left" color="neutral" variant="ghost" aria-label="Volver al proceso" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

      <UAlert
        v-if="!error && ediciones.length < 2 && proceso"
        color="neutral"
        variant="subtle"
        icon="i-lucide-info"
        title="Hacen falta al menos dos ediciones publicadas para comparar."
      />

      <div v-else class="flex flex-wrap items-end gap-3">
        <UFormField label="Edición base (anterior)" name="base">
          <USelect v-model="base" :items="opciones" class="w-72" />
        </UFormField>
        <UIcon name="i-lucide-arrow-right" class="mb-2 size-5 text-muted" aria-hidden="true" />
        <UFormField label="Edición a comparar (nueva)" name="nueva">
          <USelect v-model="nueva" :items="opciones" class="w-72" />
        </UFormField>
      </div>

      <div v-if="resultado" class="space-y-4 transition-opacity" :class="{ 'opacity-60': cargando }">
        <!-- Resumen -->
        <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <DashboardIndicador etiqueta="Agregados" :valor="resultado.resumen.agregados" icono="i-lucide-plus-circle" />
          <DashboardIndicador etiqueta="Cerrados" :valor="resultado.resumen.cerrados" icono="i-lucide-check-circle-2" />
          <DashboardIndicador etiqueta="Suben de nivel" :valor="resultado.resumen.suben" icono="i-lucide-trending-up" alerta />
          <DashboardIndicador etiqueta="Bajan de nivel" :valor="resultado.resumen.bajan" icono="i-lucide-trending-down" />
          <DashboardIndicador etiqueta="Sin cambio de nivel" :valor="resultado.resumen.sin_cambio" icono="i-lucide-equal" />
        </div>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Cambios de nivel
            </h2>
          </template>
          <p v-if="!resultado.cambios_nivel.length" class="text-sm text-muted">
            Ningún riesgo cambió de nivel.
          </p>
          <ul v-else class="divide-y divide-default">
            <li v-for="cambio in resultado.cambios_nivel" :key="cambio.riesgo_nuevo_id" class="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
              <span class="font-medium">{{ cambio.descripcion }}</span>
              <span class="flex items-center gap-2">
                <span class="text-xs text-muted">P{{ cambio.probabilidad_anterior }}×I{{ cambio.impacto_anterior }}</span>
                <NivelRiesgoBadge :nivel="cambio.nivel_anterior" />
                <UIcon
                  :name="cambio.tendencia === 'sube' ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
                  class="size-4"
                  :class="cambio.tendencia === 'sube' ? 'text-error' : 'text-success'"
                  :aria-label="cambio.tendencia === 'sube' ? 'Sube' : 'Baja'"
                />
                <NivelRiesgoBadge :nivel="cambio.nivel_nuevo" />
                <span class="text-xs text-muted">P{{ cambio.probabilidad_nueva }}×I{{ cambio.impacto_nuevo }}</span>
              </span>
            </li>
          </ul>
        </UCard>

        <div class="grid gap-4 lg:grid-cols-2">
          <UCard v-for="grupo in [{ titulo: 'Riesgos agregados', filas: resultado.agregados, vacio: 'No se agregaron riesgos.' }, { titulo: 'Riesgos cerrados', filas: resultado.cerrados, vacio: 'No se cerró ningún riesgo.' }]" :key="grupo.titulo">
            <template #header>
              <h2 class="font-semibold">
                {{ grupo.titulo }}
              </h2>
            </template>
            <p v-if="!grupo.filas.length" class="text-sm text-muted">
              {{ grupo.vacio }}
            </p>
            <ul v-else class="divide-y divide-default">
              <li v-for="riesgo in grupo.filas" :key="riesgo.id" class="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{{ riesgo.descripcion }}</span>
                <NivelRiesgoBadge :nivel="riesgo.nivel" />
              </li>
            </ul>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
