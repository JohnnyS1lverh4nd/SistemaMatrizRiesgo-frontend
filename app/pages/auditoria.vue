<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Paginado, RegistroAuditoria } from '~/types/api'

definePageMeta({ middleware: 'auditoria' })

const { api } = useApi()

const registros = ref<RegistroAuditoria[]>([])
const pagina = ref(1)
const porPagina = ref(50)
const total = ref(0)
const cargando = ref(false)
const error = ref<string | null>(null)

const filtros = reactive({
  entidad: undefined as string | undefined,
  evento: undefined as string | undefined,
  desde: '',
  hasta: '',
})

const opcionesEntidad = Object.entries(ENTIDADES_AUDITORIA).map(([value, label]) => ({ label, value }))
const opcionesEvento = Object.entries(EVENTOS_AUDITORIA).map(([value, { label }]) => ({ label, value }))

async function cargar() {
  cargando.value = true
  error.value = null

  // Solo se envían los filtros con valor.
  const query = Object.fromEntries(
    Object.entries({ ...filtros, page: pagina.value }).filter(([, v]) => v !== undefined && v !== ''),
  )

  try {
    const respuesta = await api<Paginado<RegistroAuditoria>>('/api/auditoria', { query })
    registros.value = respuesta.data
    porPagina.value = respuesta.meta.per_page
    total.value = respuesta.meta.total
  } catch (e) {
    error.value = erroresDeValidacion(e) ? 'Revise el rango de fechas.' : mensajeDeErrorApi(e)
  } finally {
    cargando.value = false
  }
}

function aplicarFiltros() {
  if (pagina.value === 1) {
    cargar()
  } else {
    pagina.value = 1
  }
}

function limpiarFiltros() {
  Object.assign(filtros, { entidad: undefined, evento: undefined, desde: '', hasta: '' })
  aplicarFiltros()
}

watch(pagina, cargar)
onMounted(cargar)

const columnas: TableColumn<RegistroAuditoria>[] = [
  { accessorKey: 'fecha', header: 'Fecha' },
  { id: 'usuario', header: 'Usuario' },
  { accessorKey: 'evento', header: 'Operación' },
  { id: 'registro', header: 'Registro' },
  { id: 'cambios', header: 'Cambios' },
  { accessorKey: 'ip', header: 'IP' },
]

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'medium' })
}
</script>

<template>
  <UDashboardPanel id="auditoria">
    <template #header>
      <UDashboardNavbar title="Auditoría" />
    </template>

    <template #body>
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="aplicarFiltros">
        <UFormField label="Registro" name="entidad">
          <USelect v-model="filtros.entidad" :items="opcionesEntidad" placeholder="Todos" class="w-56" />
        </UFormField>
        <UFormField label="Operación" name="evento">
          <USelect v-model="filtros.evento" :items="opcionesEvento" placeholder="Todas" class="w-56" />
        </UFormField>
        <UFormField label="Desde" name="desde">
          <UInput v-model="filtros.desde" type="date" />
        </UFormField>
        <UFormField label="Hasta" name="hasta">
          <UInput v-model="filtros.hasta" type="date" />
        </UFormField>
        <UButton type="submit" icon="i-lucide-filter" label="Filtrar" />
        <UButton label="Limpiar" color="neutral" variant="ghost" @click="limpiarFiltros" />
      </form>

      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

      <UTable :data="registros" :columns="columnas" :loading="cargando" empty="No hay registros con esos filtros." class="text-sm">
        <template #fecha-cell="{ row }">
          <span class="whitespace-nowrap">{{ fechaHora(row.original.fecha) }}</span>
        </template>
        <template #usuario-cell="{ row }">
          {{ row.original.usuario?.name ?? 'Sistema / sin sesión' }}
        </template>
        <template #evento-cell="{ row }">
          <UBadge
            :label="EVENTOS_AUDITORIA[row.original.evento]?.label ?? row.original.evento"
            :color="EVENTOS_AUDITORIA[row.original.evento]?.color ?? 'neutral'"
            variant="subtle"
          />
        </template>
        <template #registro-cell="{ row }">
          <span v-if="row.original.entidad" class="whitespace-nowrap">
            {{ ENTIDADES_AUDITORIA[row.original.entidad] ?? row.original.entidad }}
            <span v-if="row.original.entidad_id" class="text-muted">#{{ row.original.entidad_id }}</span>
          </span>
        </template>
        <template #cambios-cell="{ row }">
          <div class="min-w-64 max-w-xl whitespace-normal">
            <CambiosAuditoria :registro="row.original" />
          </div>
        </template>
      </UTable>

      <div v-if="total > porPagina" class="flex justify-end">
        <UPagination v-model:page="pagina" :total="total" :items-per-page="porPagina" />
      </div>
    </template>
  </UDashboardPanel>
</template>
