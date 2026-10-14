<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CampoFormulario } from '~/components/FormularioModal.vue'
import type { Departamento } from '~/types/api'

definePageMeta({ middleware: 'admin' })

const { items: departamentos, cargando, error, recargar } = useListado<Departamento>('/api/departamentos')
const { alternar, procesando } = useAlternarActivo<Departamento>()

const columnas: TableColumn<Departamento>[] = [
  { accessorKey: 'nombre', header: 'Departamento' },
  { accessorKey: 'direccion', header: 'Dirección' },
  { accessorKey: 'activo', header: 'Estado' },
  { id: 'acciones', header: '' },
]

const campos: CampoFormulario[] = [
  { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
  { nombre: 'direccion', etiqueta: 'Dirección', ayuda: 'Tal como aparece en el encabezado de la matriz, p. ej. "Administración y Finanzas".' },
  { nombre: 'slug', etiqueta: 'Identificador', ayuda: 'Opcional al crear: se genera a partir del nombre.' },
]

const modalAbierto = ref(false)
const editando = ref<Departamento | null>(null)

function nuevo() {
  editando.value = null
  modalAbierto.value = true
}

function editar(departamento: Departamento) {
  editando.value = departamento
  modalAbierto.value = true
}

async function alternarEstado(departamento: Departamento) {
  if (await alternar(`/api/departamentos/${departamento.id}`, departamento)) {
    await recargar()
  }
}
</script>

<template>
  <UDashboardPanel id="departamentos">
    <template #header>
      <UDashboardNavbar title="Departamentos">
        <template #right>
          <UButton icon="i-lucide-plus" label="Nuevo departamento" @click="nuevo" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

      <UTable :data="departamentos" :columns="columnas" :loading="cargando" empty="No hay departamentos.">
        <template #direccion-cell="{ row }">
          {{ row.original.direccion ?? '—' }}
        </template>
        <template #activo-cell="{ row }">
          <EstadoActivo :activo="row.original.activo" />
        </template>
        <template #acciones-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              :to="`/departamentos/${row.original.id}`"
              icon="i-lucide-workflow"
              label="Procesos"
              color="neutral"
              variant="ghost"
              size="sm"
            />
            <UButton icon="i-lucide-pencil" label="Editar" color="neutral" variant="ghost" size="sm" @click="editar(row.original)" />
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
        :titulo="editando ? 'Editar departamento' : 'Nuevo departamento'"
        :campos="campos"
        :url="editando ? `/api/departamentos/${editando.id}` : '/api/departamentos'"
        :metodo="editando ? 'PUT' : 'POST'"
        :valores-iniciales="editando ?? undefined"
        @guardado="recargar"
      />
    </template>
  </UDashboardPanel>
</template>
