<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CampoFormulario } from '~/components/FormularioModal.vue'
import type { CatalogoActivable } from '~/types/api'

/**
 * Factores de riesgo y periodicidades: alta, edición y desactivación
 * (nunca se borran: riesgos históricos los referencian).
 */
const props = defineProps<{
  url: string
  singular: string
}>()

const { items, cargando, error, recargar } = useListado<CatalogoActivable>(() => props.url)
const { alternar, procesando } = useAlternarActivo<CatalogoActivable>()

const columnas: TableColumn<CatalogoActivable>[] = [
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'slug', header: 'Identificador' },
  { accessorKey: 'activo', header: 'Estado' },
  { id: 'acciones', header: '' },
]

const campos: CampoFormulario[] = [
  { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
  { nombre: 'slug', etiqueta: 'Identificador', ayuda: 'Opcional al crear: se genera a partir del nombre.' },
]

const modalAbierto = ref(false)
const editando = ref<CatalogoActivable | null>(null)

function abrir(registro: CatalogoActivable | null) {
  editando.value = registro
  modalAbierto.value = true
}

async function alternarEstado(registro: CatalogoActivable) {
  if (await alternar(`${props.url}/${registro.id}`, registro)) {
    await recargar()
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm text-muted">
        Los registros inactivos dejan de ofrecerse en los formularios, pero se conservan en el histórico.
      </p>
      <UButton icon="i-lucide-plus" :label="`Nuevo ${singular}`" @click="abrir(null)" />
    </div>

    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

    <UTable :data="items" :columns="columnas" :loading="cargando" empty="Sin registros.">
      <template #activo-cell="{ row }">
        <EstadoActivo :activo="row.original.activo" />
      </template>
      <template #acciones-cell="{ row }">
        <div class="flex justify-end gap-1">
          <UButton icon="i-lucide-pencil" label="Editar" color="neutral" variant="ghost" size="sm" @click="abrir(row.original)" />
          <UButton
            :icon="row.original.activo ? 'i-lucide-circle-off' : 'i-lucide-circle-check'"
            :label="row.original.activo ? 'Desactivar' : 'Activar'"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="procesando === row.original.id"
            @click="alternarEstado(row.original)"
          />
        </div>
      </template>
    </UTable>

    <FormularioModal
      v-model:open="modalAbierto"
      :titulo="editando ? `Editar ${singular}` : `Nuevo ${singular}`"
      :campos="campos"
      :url="editando ? `${url}/${editando.id}` : url"
      :metodo="editando ? 'PUT' : 'POST'"
      :valores-iniciales="editando ?? undefined"
      @guardado="recargar"
    />
  </div>
</template>
