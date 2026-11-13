<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Item, Movimiento, OpcionesMovimientos, Paginado } from '~/types/api'

/**
 * Historial de movimientos por área: lo que hicieron todos los usuarios sobre
 * las matrices de los departamentos del usuario (el Administrador ve todos).
 * Solo lectura. La API limita siempre el alcance; los filtros solo acotan.
 */
definePageMeta({ middleware: 'historial' })

const { api } = useApi()

const movimientos = ref<Movimiento[]>([])
const pagina = ref(1)
const porPagina = ref(50)
const total = ref(0)
const cargando = ref(false)
const error = ref<string | null>(null)

const opciones = ref<OpcionesMovimientos | null>(null)

const filtros = reactive({
  desde: '',
  hasta: '',
  usuario_id: undefined as number | undefined,
  departamento_id: undefined as number | undefined,
  proceso_id: undefined as number | undefined,
  matriz_id: undefined as number | undefined,
  evento: undefined as string | undefined,
  entidad: undefined as string | undefined,
})

// --- Opciones de los filtros (encadenadas: departamento > proceso > edición) --

const opcionesUsuario = computed(() => (opciones.value?.usuarios ?? []).map(u => ({ label: u.name, value: u.id })))
const opcionesDepartamento = computed(() => (opciones.value?.departamentos ?? []).map(d => ({ label: d.nombre, value: d.id })))
const opcionesProceso = computed(() => (opciones.value?.procesos ?? [])
  .filter(p => !filtros.departamento_id || p.departamento_id === filtros.departamento_id)
  .map(p => ({ label: p.nombre, value: p.id })))
const opcionesMatriz = computed(() => {
  const procesosVisibles = new Set(opcionesProceso.value.map(p => p.value))
  return (opciones.value?.matrices ?? [])
    .filter(m => filtros.proceso_id ? m.proceso_id === filtros.proceso_id : procesosVisibles.has(m.proceso_id))
    .map(m => ({ label: m.nombre, value: m.id }))
})
const opcionesEvento = computed(() => (opciones.value?.eventos ?? [])
  .map(e => ({ label: EVENTOS_AUDITORIA[e]?.label ?? e, value: e })))
const opcionesEntidad = computed(() => (opciones.value?.entidades ?? [])
  .map(e => ({ label: ENTIDADES_AUDITORIA[e] ?? e, value: e })))

// Con un solo departamento el filtro no aporta nada.
const variosDepartamentos = computed(() => opcionesDepartamento.value.length > 1)

// Al cambiar el nivel superior, el inferior deja de ser válido.
watch(() => filtros.departamento_id, () => {
  filtros.proceso_id = undefined
})
watch(() => filtros.proceso_id, () => {
  filtros.matriz_id = undefined
})

// --- Carga --------------------------------------------------------------------

async function cargar() {
  cargando.value = true
  error.value = null

  // Solo se envían los filtros con valor.
  const query = Object.fromEntries(
    Object.entries({ ...filtros, page: pagina.value }).filter(([, v]) => v !== undefined && v !== ''),
  )

  try {
    const respuesta = await api<Paginado<Movimiento>>('/api/movimientos', { query })
    movimientos.value = respuesta.data
    porPagina.value = respuesta.meta.per_page
    total.value = respuesta.meta.total
  } catch (e) {
    error.value = erroresDeValidacion(e) ? 'Revise el rango de fechas: la fecha final no puede ser anterior a la inicial.' : mensajeDeErrorApi(e)
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
  Object.assign(filtros, {
    desde: '',
    hasta: '',
    usuario_id: undefined,
    departamento_id: undefined,
    proceso_id: undefined,
    matriz_id: undefined,
    evento: undefined,
    entidad: undefined,
  })
  aplicarFiltros()
}

const hayFiltros = computed(() => Object.values(filtros).some(v => v !== undefined && v !== ''))

watch(pagina, cargar)

onMounted(async () => {
  cargar()
  try {
    opciones.value = (await api<Item<OpcionesMovimientos>>('/api/movimientos/opciones')).data
  } catch {
    // Sin opciones los filtros de lista quedan vacíos; el listado sigue funcionando.
  }
})

// --- Tabla y detalle ------------------------------------------------------------

const columnas: TableColumn<Movimiento>[] = [
  { accessorKey: 'fecha', header: 'Fecha y hora' },
  { id: 'usuario', header: 'Usuario' },
  { id: 'accion', header: 'Acción' },
  { id: 'donde', header: 'Departamento / proceso' },
  { id: 'edicion', header: 'Edición' },
  { id: 'detalle', header: '' },
]

const detalle = reactive({ abierto: false, id: null as number | null })

function verDetalle(movimiento: Movimiento) {
  Object.assign(detalle, { abierto: true, id: movimiento.id })
}

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <UDashboardPanel id="historial">
    <template #header>
      <EncabezadoPanel title="Historial de movimientos" />
    </template>

    <template #body>
      <p class="text-sm text-muted">
        Cambios realizados por todos los usuarios sobre las matrices de sus departamentos. Los registros no se pueden modificar.
      </p>

      <form class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="aplicarFiltros">
        <UFormField label="Fecha inicial" name="desde">
          <UInput v-model="filtros.desde" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Fecha final" name="hasta">
          <UInput v-model="filtros.hasta" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Usuario" name="usuario_id">
          <USelect v-model="filtros.usuario_id" :items="opcionesUsuario" placeholder="Todos" class="w-full" />
        </UFormField>
        <UFormField label="Tipo de operación" name="evento">
          <USelect v-model="filtros.evento" :items="opcionesEvento" placeholder="Todas" class="w-full" />
        </UFormField>
        <UFormField v-if="variosDepartamentos" label="Departamento" name="departamento_id">
          <USelect v-model="filtros.departamento_id" :items="opcionesDepartamento" placeholder="Todos" class="w-full" />
        </UFormField>
        <UFormField label="Proceso (matriz)" name="proceso_id">
          <USelect v-model="filtros.proceso_id" :items="opcionesProceso" placeholder="Todos" class="w-full" />
        </UFormField>
        <UFormField label="Edición" name="matriz_id">
          <USelect v-model="filtros.matriz_id" :items="opcionesMatriz" placeholder="Todas" class="w-full" />
        </UFormField>
        <UFormField label="Registro afectado" name="entidad">
          <USelect v-model="filtros.entidad" :items="opcionesEntidad" placeholder="Todos" class="w-full" />
        </UFormField>

        <div class="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <UButton type="submit" icon="i-lucide-filter" label="Aplicar filtros" :loading="cargando" />
          <UButton v-if="hayFiltros" label="Limpiar" color="neutral" variant="ghost" @click="limpiarFiltros" />
          <span class="ms-auto text-sm text-muted">{{ total }} movimiento{{ total === 1 ? '' : 's' }}</span>
        </div>
      </form>

      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

      <UTable
        :data="movimientos"
        :columns="columnas"
        :loading="cargando"
        :empty="hayFiltros ? 'No hay movimientos con esos filtros.' : 'Todavía no hay movimientos en sus departamentos.'"
        class="text-sm"
      >
        <template #fecha-cell="{ row }">
          <span class="whitespace-nowrap">{{ fechaHora(row.original.fecha) }}</span>
        </template>
        <template #usuario-cell="{ row }">
          {{ row.original.usuario?.name ?? 'Sistema / sin sesión' }}
        </template>
        <template #accion-cell="{ row }">
          <div class="flex flex-col items-start gap-1">
            <UBadge
              :label="EVENTOS_AUDITORIA[row.original.evento]?.label ?? row.original.evento"
              :color="EVENTOS_AUDITORIA[row.original.evento]?.color ?? 'neutral'"
              variant="subtle"
            />
            <span class="whitespace-nowrap text-muted">{{ registroAfectado(row.original.entidad, row.original.entidad_id) }}</span>
          </div>
        </template>
        <template #donde-cell="{ row }">
          <div class="min-w-40 whitespace-normal">
            <p>{{ row.original.departamento?.nombre }}</p>
            <p v-if="row.original.proceso" class="text-muted">
              {{ row.original.proceso.nombre }}
            </p>
          </div>
        </template>
        <template #edicion-cell="{ row }">
          <span v-if="row.original.matriz" class="whitespace-nowrap">
            {{ row.original.matriz.nombre }}
            <UBadge v-if="row.original.matriz.descartada" label="Descartada" color="neutral" variant="outline" size="sm" />
          </span>
          <span v-else class="text-muted">—</span>
        </template>
        <template #detalle-cell="{ row }">
          <div class="flex justify-end">
            <UButton icon="i-lucide-eye" label="Ver detalle" color="neutral" variant="ghost" size="sm" @click="verDetalle(row.original)" />
          </div>
        </template>
      </UTable>

      <div v-if="total > porPagina" class="flex justify-end">
        <UPagination v-model:page="pagina" :total="total" :items-per-page="porPagina" />
      </div>

      <MovimientoDetalle v-model:open="detalle.abierto" :movimiento-id="detalle.id" />
    </template>
  </UDashboardPanel>
</template>
