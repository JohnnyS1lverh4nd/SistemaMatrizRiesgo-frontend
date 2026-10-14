<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

definePageMeta({ middleware: 'admin' })

const pestanas: TabsItem[] = [
  { label: 'Factores de riesgo', icon: 'i-lucide-tags', slot: 'factores' as const },
  { label: 'Periodicidades', icon: 'i-lucide-calendar-clock', slot: 'periodicidades' as const },
  { label: 'Niveles de riesgo', icon: 'i-lucide-gauge', slot: 'niveles' as const },
  { label: 'Escalas P / I', icon: 'i-lucide-ruler', slot: 'escalas' as const },
  { label: 'Matriz de calor', icon: 'i-lucide-grid-3x3', slot: 'matriz' as const },
]

const matriz = useTemplateRef<{ refrescar: () => Promise<void> }>('matriz')
</script>

<template>
  <UDashboardPanel id="catalogos">
    <template #header>
      <UDashboardNavbar title="Catálogos" />
    </template>

    <template #body>
      <!-- unmount-on-hide=false: la matriz conserva su estado al cambiar de pestaña. -->
      <UTabs :items="pestanas" variant="link" :unmount-on-hide="false" class="w-full">
        <template #factores>
          <CatalogosCatalogoActivable url="/api/factores-riesgo" singular="factor" class="pt-4" />
        </template>
        <template #periodicidades>
          <CatalogosCatalogoActivable url="/api/periodicidades" singular="periodicidad" class="pt-4" />
        </template>
        <template #niveles>
          <CatalogosNivelesRiesgo class="pt-4" @cambiado="matriz?.refrescar()" />
        </template>
        <template #escalas>
          <CatalogosEscalasNivel class="pt-4" />
        </template>
        <template #matriz>
          <CatalogosMatrizCalorEditor ref="matriz" class="pt-4" />
        </template>
      </UTabs>
    </template>
  </UDashboardPanel>
</template>
