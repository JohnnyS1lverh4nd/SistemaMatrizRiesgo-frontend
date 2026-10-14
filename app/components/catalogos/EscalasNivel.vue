<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CampoFormulario } from '~/components/FormularioModal.vue'
import type { EscalaNivel } from '~/types/api'

// Escalas 1–4 de Probabilidad e Impacto: fijas; se editan nombre y descripción.
const { items, cargando, error, recargar } = useListado<EscalaNivel>('/api/escalas-nivel')

const probabilidad = computed(() => items.value.filter(e => e.tipo === 'probabilidad'))
const impacto = computed(() => items.value.filter(e => e.tipo === 'impacto'))

const columnas: TableColumn<EscalaNivel>[] = [
  { accessorKey: 'valor', header: 'Valor' },
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'descripcion', header: 'Descripción' },
  { id: 'acciones', header: '' },
]

const campos: CampoFormulario[] = [
  { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', ayuda: 'Criterio para elegir este valor al evaluar un riesgo.' },
]

const modalAbierto = ref(false)
const editando = ref<EscalaNivel | null>(null)

function editar(escala: EscalaNivel) {
  editando.value = escala
  modalAbierto.value = true
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">
      Los valores 1 a 4 son fijos (la matriz de calor es de 4 × 4). Puede cambiar el nombre y la descripción de cada uno.
    </p>

    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

    <div class="grid gap-6 lg:grid-cols-2">
      <section v-for="grupo in [{ titulo: 'Probabilidad', filas: probabilidad }, { titulo: 'Impacto', filas: impacto }]" :key="grupo.titulo">
        <h3 class="mb-2 font-semibold">
          {{ grupo.titulo }}
        </h3>
        <UTable :data="grupo.filas" :columns="columnas" :loading="cargando">
          <template #descripcion-cell="{ row }">
            <span class="line-clamp-2 whitespace-normal">{{ row.original.descripcion ?? '—' }}</span>
          </template>
          <template #acciones-cell="{ row }">
            <div class="flex justify-end">
              <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" :aria-label="`Editar ${row.original.nombre}`" @click="editar(row.original)" />
            </div>
          </template>
        </UTable>
      </section>
    </div>

    <FormularioModal
      v-model:open="modalAbierto"
      :titulo="editando ? `Editar ${editando.tipo} ${editando.valor}` : 'Editar escala'"
      :campos="campos"
      :url="`/api/escalas-nivel/${editando?.id}`"
      metodo="PUT"
      :valores-iniciales="editando ?? undefined"
      @guardado="recargar"
    />
  </div>
</template>
