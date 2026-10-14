<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CampoFormulario } from '~/components/FormularioModal.vue'
import type { Departamento, Item, Proceso } from '~/types/api'

definePageMeta({ middleware: 'admin' })

const route = useRoute()
const { api } = useApi()

const departamentoId = computed(() => String(route.params.id))
const departamento = ref<Departamento | null>(null)
const errorDepartamento = ref<string | null>(null)

const { items: procesos, cargando, error, recargar } = useListado<Proceso>(
  () => `/api/departamentos/${departamentoId.value}/procesos`,
)
const { alternar, procesando } = useAlternarActivo<Proceso>()

onMounted(async () => {
  try {
    departamento.value = (await api<Item<Departamento>>(`/api/departamentos/${departamentoId.value}`)).data
  } catch (e) {
    errorDepartamento.value = mensajeDeErrorApi(e)
  }
})

const columnas: TableColumn<Proceso>[] = [
  { accessorKey: 'nombre', header: 'Proceso' },
  { accessorKey: 'descripcion', header: 'Descripción' },
  { accessorKey: 'activo', header: 'Estado' },
  { id: 'acciones', header: '' },
]

const campos: CampoFormulario[] = [
  { nombre: 'nombre', etiqueta: 'Nombre del proceso', requerido: true, ayuda: 'Como en el encabezado de la matriz, p. ej. "SP 4.3. Abastecimiento".' },
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea' },
  { nombre: 'slug', etiqueta: 'Identificador', ayuda: 'Opcional al crear: se genera a partir del nombre.' },
]

const modalAbierto = ref(false)
const editando = ref<Proceso | null>(null)

function nuevo() {
  editando.value = null
  modalAbierto.value = true
}

function editar(proceso: Proceso) {
  editando.value = proceso
  modalAbierto.value = true
}

async function alternarEstado(proceso: Proceso) {
  if (await alternar(`/api/procesos/${proceso.id}`, proceso)) {
    await recargar()
  }
}
</script>

<template>
  <UDashboardPanel id="procesos">
    <template #header>
      <UDashboardNavbar :title="departamento ? `Procesos · ${departamento.nombre}` : 'Procesos'">
        <template #leading>
          <UButton to="/departamentos" icon="i-lucide-arrow-left" color="neutral" variant="ghost" aria-label="Volver a departamentos" />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Nuevo proceso"
            :disabled="departamento?.activo === false"
            @click="nuevo"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert v-if="errorDepartamento || error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorDepartamento ?? error ?? ''" />
      <UAlert
        v-if="departamento && !departamento.activo"
        color="warning"
        variant="subtle"
        icon="i-lucide-info"
        title="Este departamento está inactivo: no se pueden crear procesos nuevos."
      />

      <UTable :data="procesos" :columns="columnas" :loading="cargando" empty="Este departamento no tiene procesos.">
        <template #descripcion-cell="{ row }">
          <span class="line-clamp-2 whitespace-normal">{{ row.original.descripcion ?? '—' }}</span>
        </template>
        <template #activo-cell="{ row }">
          <EstadoActivo :activo="row.original.activo" />
        </template>
        <template #acciones-cell="{ row }">
          <div class="flex justify-end gap-1">
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
        :titulo="editando ? 'Editar proceso' : 'Nuevo proceso'"
        :campos="campos"
        :url="editando ? `/api/procesos/${editando.id}` : `/api/departamentos/${departamentoId}/procesos`"
        :metodo="editando ? 'PUT' : 'POST'"
        :valores-iniciales="editando ?? undefined"
        @guardado="recargar"
      />
    </template>
  </UDashboardPanel>
</template>
