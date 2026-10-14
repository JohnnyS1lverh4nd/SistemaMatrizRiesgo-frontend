<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CatalogoActivable, Coleccion, Departamento, EstadoTratamiento, FilaReporteRiesgo, NivelRiesgo, Paginado, Proceso } from '~/types/api'

/**
 * Reporte de riesgos con los filtros del RF-6. Los filtros viven en la URL:
 * un reporte filtrado se puede volver a abrir o compartir.
 */
const route = useRoute()
const router = useRouter()
const { api } = useApi()

interface Filtros {
  departamento_id?: number
  proceso_id?: number
  factor_id?: number
  nivel_id?: number
  responsable: string
  estado_tratamiento?: EstadoTratamiento
  desde: string
  hasta: string
  prioritarios: boolean
  atrasados: boolean
}

function desdeUrl(): Filtros {
  const q = route.query
  const numero = (v: unknown) => (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined)
  const texto = (v: unknown) => (typeof v === 'string' ? v : '')
  return {
    departamento_id: numero(q.departamento_id),
    proceso_id: numero(q.proceso_id),
    factor_id: numero(q.factor_id),
    nivel_id: numero(q.nivel_id),
    responsable: texto(q.responsable),
    estado_tratamiento: (texto(q.estado_tratamiento) || undefined) as EstadoTratamiento | undefined,
    desde: texto(q.desde),
    hasta: texto(q.hasta),
    prioritarios: q.prioritarios === '1',
    atrasados: q.atrasados === '1',
  }
}

const filtros = reactive<Filtros>(desdeUrl())
const pagina = ref(Number(route.query.page) || 1)

// --- Datos ---------------------------------------------------------------------

const filas = ref<FilaReporteRiesgo[]>([])
const total = ref(0)
const porPagina = ref(50)
const cargando = ref(false)
const error = ref<string | null>(null)

function consulta(): Record<string, string | number> {
  const q: Record<string, string | number> = {}
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === '' || valor === false) {
      continue
    }
    q[clave] = valor === true ? 1 : valor
  }
  if (pagina.value > 1) {
    q.page = pagina.value
  }
  return q
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    const respuesta = await api<Paginado<FilaReporteRiesgo>>('/api/reportes/riesgos', { query: consulta() })
    filas.value = respuesta.data
    total.value = respuesta.meta.total
    porPagina.value = respuesta.meta.per_page
  } catch (e) {
    const validacion = erroresDeValidacion(e)
    error.value = validacion ? Object.values(validacion).flat()[0] ?? 'Revise los filtros.' : mensajeDeErrorApi(e)
  } finally {
    cargando.value = false
  }
}

function aplicar() {
  pagina.value = 1
  router.replace({ query: consulta() })
  cargar()
}

function limpiar() {
  Object.assign(filtros, {
    departamento_id: undefined, proceso_id: undefined, factor_id: undefined, nivel_id: undefined,
    responsable: '', estado_tratamiento: undefined, desde: '', hasta: '', prioritarios: false, atrasados: false,
  })
  aplicar()
}

watch(pagina, () => {
  router.replace({ query: consulta() })
  cargar()
})

// --- Opciones de los filtros ---------------------------------------------------

const departamentos = ref<Departamento[]>([])
const procesos = ref<Proceso[]>([])
const factores = ref<CatalogoActivable[]>([])
const niveles = ref<NivelRiesgo[]>([])

async function cargarProcesos() {
  procesos.value = filtros.departamento_id
    ? (await api<Coleccion<Proceso>>(`/api/departamentos/${filtros.departamento_id}/procesos`)).data
    : []
}

watch(() => filtros.departamento_id, async (nuevo, anterior) => {
  if (anterior !== undefined) {
    filtros.proceso_id = undefined
  }
  await cargarProcesos()
})

onMounted(async () => {
  cargar()
  try {
    const [d, f, n] = await Promise.all([
      api<Coleccion<Departamento>>('/api/departamentos'),
      api<Coleccion<CatalogoActivable>>('/api/factores-riesgo'),
      api<Coleccion<NivelRiesgo>>('/api/niveles-riesgo'),
    ])
    departamentos.value = d.data
    factores.value = f.data
    niveles.value = [...n.data].sort((a, b) => b.orden - a.orden)
    await cargarProcesos()
  } catch {
    // Los filtros quedan vacíos; el reporte se muestra igual.
  }
})

const todos = <T extends { id: number, nombre: string }>(lista: T[], etiqueta: string) => [
  { label: etiqueta, value: undefined },
  ...lista.map(e => ({ label: e.nombre, value: e.id })),
]

const columnas: TableColumn<FilaReporteRiesgo>[] = [
  { id: 'nivel', header: 'Nivel' },
  { accessorKey: 'descripcion', header: 'Riesgo' },
  { id: 'ubicacion', header: 'Departamento / proceso' },
  { accessorKey: 'responsable', header: 'Responsable' },
  { accessorKey: 'estado_tratamiento', header: 'Tratamiento' },
  { id: 'seguimiento', header: 'Seguimiento' },
  { id: 'acciones', header: '' },
]

function fecha(iso: string | null) {
  return iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}
</script>

<template>
  <UDashboardPanel id="reportes">
    <template #header>
      <UDashboardNavbar title="Reporte de riesgos" />
    </template>

    <template #body>
      <!-- Una sola fila de filtros sobre los resultados. -->
      <form class="grid gap-3 rounded-lg border border-default p-4 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="aplicar">
        <UFormField label="Departamento" name="departamento_id">
          <USelect v-model="filtros.departamento_id" :items="todos(departamentos, 'Todos')" class="w-full" />
        </UFormField>
        <UFormField label="Proceso" name="proceso_id">
          <USelect
            v-model="filtros.proceso_id"
            :items="todos(procesos, filtros.departamento_id ? 'Todos' : 'Elija un departamento')"
            :disabled="!filtros.departamento_id"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Factor" name="factor_id">
          <USelect v-model="filtros.factor_id" :items="todos(factores, 'Todos')" class="w-full" />
        </UFormField>
        <UFormField label="Nivel" name="nivel_id">
          <USelect v-model="filtros.nivel_id" :items="todos(niveles, 'Todos')" class="w-full" />
        </UFormField>
        <UFormField label="Responsable" name="responsable">
          <UInput v-model="filtros.responsable" placeholder="Contiene…" class="w-full" />
        </UFormField>
        <UFormField label="Tratamiento" name="estado_tratamiento">
          <USelect v-model="filtros.estado_tratamiento" :items="[{ label: 'Todos', value: undefined }, ...OPCIONES_ESTADO_TRATAMIENTO]" class="w-full" />
        </UFormField>
        <UFormField label="Revisión desde" name="desde" help="Con periodo se incluyen ediciones archivadas.">
          <UInput v-model="filtros.desde" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Revisión hasta" name="hasta">
          <UInput v-model="filtros.hasta" type="date" class="w-full" />
        </UFormField>
        <div class="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-4">
          <USwitch v-model="filtros.prioritarios" label="Solo críticos y altos pendientes" />
          <USwitch v-model="filtros.atrasados" label="Solo seguimientos atrasados" />
          <div class="ml-auto flex gap-2">
            <UButton label="Limpiar" color="neutral" variant="ghost" @click="limpiar" />
            <UButton type="submit" icon="i-lucide-filter" label="Aplicar filtros" />
          </div>
        </div>
      </form>

      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

      <p class="text-sm text-muted" aria-live="polite">
        {{ total }} {{ total === 1 ? 'riesgo' : 'riesgos' }}{{ filtros.desde || filtros.hasta ? ' (incluye ediciones archivadas del periodo)' : ' en ediciones vigentes' }}
      </p>

      <UTable
        :data="filas"
        :columns="columnas"
        :loading="cargando"
        empty="No hay riesgos con esos filtros."
        class="text-sm transition-opacity"
        :class="{ 'opacity-60': cargando && filas.length }"
      >
        <template #nivel-cell="{ row }">
          <div class="flex items-center gap-1">
            <NivelRiesgoBadge :nivel="row.original.nivel" />
            <UIcon v-if="row.original.ajustado" name="i-lucide-hand" class="size-4 text-muted" aria-label="Nivel ajustado manualmente" />
          </div>
        </template>
        <template #descripcion-cell="{ row }">
          <div class="min-w-56 max-w-md whitespace-normal">
            <p class="font-medium">
              {{ row.original.descripcion }}
            </p>
            <p class="line-clamp-1 text-xs text-muted">
              {{ row.original.actividad }}
            </p>
          </div>
        </template>
        <template #ubicacion-cell="{ row }">
          <div class="min-w-40 whitespace-normal">
            <p>{{ row.original.departamento.nombre }}</p>
            <p class="text-xs text-muted">
              {{ row.original.proceso.nombre }} · {{ row.original.matriz.nombre }}
            </p>
          </div>
        </template>
        <template #responsable-cell="{ row }">
          <span class="line-clamp-2 min-w-32 whitespace-normal">{{ row.original.responsable ?? '—' }}</span>
        </template>
        <template #estado_tratamiento-cell="{ row }">
          <UBadge
            :label="ESTADOS_TRATAMIENTO[row.original.estado_tratamiento].label"
            :color="ESTADOS_TRATAMIENTO[row.original.estado_tratamiento].color"
            variant="subtle"
          />
        </template>
        <template #seguimiento-cell="{ row }">
          <div class="whitespace-nowrap text-xs">
            <UBadge v-if="row.original.seguimiento.atrasado" label="Atrasado" color="error" variant="subtle" icon="i-lucide-clock-alert" />
            <p v-if="row.original.seguimiento.vence" class="mt-1 text-muted">
              Vence: {{ fecha(row.original.seguimiento.vence) }}
            </p>
            <p class="text-muted">
              Último: {{ fecha(row.original.seguimiento.ultimo) }}
            </p>
          </div>
        </template>
        <template #acciones-cell="{ row }">
          <UButton
            :to="`/matrices/${row.original.matriz.id}`"
            icon="i-lucide-arrow-up-right"
            aria-label="Abrir la matriz del riesgo"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </template>
      </UTable>

      <div v-if="total > porPagina" class="flex justify-end">
        <UPagination v-model:page="pagina" :total="total" :items-per-page="porPagina" />
      </div>
    </template>
  </UDashboardPanel>
</template>
