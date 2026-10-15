<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CatalogosRiesgo } from '~/components/RiesgoFormulario.vue'
import type {
  CatalogoActivable, Coleccion, Departamento, EscalaNivel,
  Item, Matriz, MatrizCalorCelda, NivelRiesgo, Proceso, Riesgo,
} from '~/types/api'

/**
 * Una edición de matriz con sus riesgos, presentada como el Excel
 * institucional: encabezado (Dirección, Proceso, fecha) y una fila por riesgo.
 */
const route = useRoute()
const { api } = useApi()
const toast = useToast()

const matrizId = computed(() => Number(route.params.id))
const matriz = ref<Matriz | null>(null)
const proceso = ref<Proceso | null>(null)
const departamento = ref<Departamento | null>(null)
const errorCarga = ref<string | null>(null)

const { items: riesgos, cargando, error, recargar } = useListado<Riesgo>(() => `/api/matrices/${matrizId.value}/riesgos`)

const catalogos = reactive<CatalogosRiesgo>({ factores: [], periodicidades: [], niveles: [], escalas: [], celdas: [] })

onMounted(async () => {
  try {
    matriz.value = (await api<Item<Matriz>>(`/api/matrices/${matrizId.value}`)).data
    proceso.value = (await api<Item<Proceso>>(`/api/procesos/${matriz.value.proceso_id}`)).data
    departamento.value = (await api<Item<Departamento>>(`/api/departamentos/${proceso.value.departamento_id}`)).data

    const [factores, periodicidades, niveles, escalas, celdas] = await Promise.all([
      api<Coleccion<CatalogoActivable>>('/api/factores-riesgo', { query: { activo: 1 } }),
      api<Coleccion<CatalogoActivable>>('/api/periodicidades', { query: { activo: 1 } }),
      api<Coleccion<NivelRiesgo>>('/api/niveles-riesgo'),
      api<Coleccion<EscalaNivel>>('/api/escalas-nivel'),
      api<Coleccion<MatrizCalorCelda>>('/api/matriz-calor-celdas'),
    ])
    Object.assign(catalogos, {
      factores: factores.data,
      periodicidades: periodicidades.data,
      niveles: niveles.data,
      escalas: escalas.data,
      celdas: celdas.data,
    })
  } catch (e) {
    errorCarga.value = mensajeDeErrorApi(e)
  }
})

const puedeEditar = computed(() => matriz.value?.permisos.editar ?? false)
const sinEvaluar = computed(() => riesgos.value.filter(r => r.probabilidad === null).length)

const columnas: TableColumn<Riesgo>[] = [
  { accessorKey: 'orden', header: '#' },
  { accessorKey: 'actividad', header: 'Actividad' },
  { accessorKey: 'descripcion', header: 'Riesgo' },
  { id: 'factores', header: 'Factor' },
  { accessorKey: 'probabilidad', header: 'P' },
  { accessorKey: 'impacto', header: 'I' },
  { id: 'nivel', header: 'Nivel' },
  { accessorKey: 'responsable', header: 'Responsable' },
  { accessorKey: 'estado_tratamiento', header: 'Tratamiento' },
  { id: 'acciones', header: '' },
]

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
}

// --- Panel del riesgo -------------------------------------------------------

const panel = reactive({ abierto: false, riesgo: null as Riesgo | null, soloLectura: false })

function abrir(riesgo: Riesgo | null) {
  Object.assign(panel, {
    abierto: true,
    riesgo,
    soloLectura: riesgo !== null && !riesgo.permisos.editar,
  })
}

// --- Historial de cambios (auditoría) ----------------------------------------

const historial = reactive({ abierto: false, titulo: '', url: null as string | null })

// --- Exportación (formato institucional RT-01-NI-ONA-156) -------------------

const exportando = ref(false)

async function exportarPdf() {
  if (!matriz.value) {
    return
  }
  exportando.value = true
  try {
    // Petición autenticada: misma sesión y permisos que el resto de la API.
    const archivo = await api<Blob>(`/api/matrices/${matriz.value.id}/exportar/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(archivo)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `Matriz de riesgos - ${proceso.value?.nombre ?? ''} - ${matriz.value.nombre}.pdf`
    enlace.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    toast.add({ title: mensajeDeErrorApi(e), color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    exportando.value = false
  }
}

function verHistorial(titulo: string, url: string) {
  Object.assign(historial, { abierto: true, titulo, url })
}

// --- Seguimiento (ediciones publicadas) -------------------------------------

const seguimiento = reactive({ abierto: false, riesgo: null as Riesgo | null })

// --- Eliminar ---------------------------------------------------------------

const eliminacion = reactive({ abierto: false, procesando: false, riesgo: null as Riesgo | null })

async function eliminar() {
  if (!eliminacion.riesgo) {
    return
  }

  eliminacion.procesando = true
  try {
    await api(`/api/riesgos/${eliminacion.riesgo.id}`, { method: 'DELETE' })
    toast.add({ title: 'Riesgo eliminado', color: 'success', icon: 'i-lucide-check' })
    eliminacion.abierto = false
    await recargar()
  } catch (e) {
    toast.add({ title: mensajeDeErrorApi(e), color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    eliminacion.procesando = false
  }
}
</script>

<template>
  <UDashboardPanel id="matriz">
    <template #header>
      <UDashboardNavbar :title="matriz ? `Matriz de riesgos · ${matriz.nombre}` : 'Matriz de riesgos'">
        <template #leading>
          <UButton
            :to="proceso ? `/procesos/${proceso.id}` : '/matrices'"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            aria-label="Volver a las ediciones del proceso"
          />
        </template>
        <template #right>
          <UButton
            v-if="matriz"
            icon="i-lucide-file-down"
            label="Exportar PDF"
            color="neutral"
            variant="ghost"
            :loading="exportando"
            @click="exportarPdf"
          />
          <UButton
            v-if="matriz"
            icon="i-lucide-history"
            label="Historial"
            color="neutral"
            variant="ghost"
            @click="verHistorial(`Historial · ${matriz.nombre}`, `/api/matrices/${matriz.id}/historial`)"
          />
          <UButton v-if="puedeEditar" icon="i-lucide-plus" label="Nuevo riesgo" @click="abrir(null)" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert v-if="errorCarga || error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorCarga ?? error ?? ''" />

      <!-- Encabezado de la matriz institucional -->
      <UCard v-if="matriz">
        <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt class="text-muted">
              Dirección
            </dt>
            <dd class="font-medium">
              {{ departamento?.direccion ?? departamento?.nombre ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Proceso
            </dt>
            <dd class="font-medium">
              {{ proceso?.nombre ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Fecha de revisión
            </dt>
            <dd class="font-medium">
              {{ formatearFecha(matriz.fecha_revision) }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Estado
            </dt>
            <dd>
              <EstadoMatrizBadge :estado="matriz.estado" />
            </dd>
          </div>
        </dl>
      </UCard>

      <UAlert
        v-if="matriz?.estado === 'borrador' && sinEvaluar > 0"
        color="warning"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :title="`${sinEvaluar} ${sinEvaluar === 1 ? 'riesgo está' : 'riesgos están'} sin evaluar: no se podrá publicar la edición hasta completar su probabilidad e impacto.`"
      />
      <UAlert
        v-if="matriz && matriz.estado !== 'borrador'"
        color="neutral"
        variant="subtle"
        icon="i-lucide-lock"
        title="Esta edición está publicada o archivada: sus riesgos no se pueden modificar."
        description="Para reevaluarlos, cree una nueva edición a partir de esta desde la página del proceso."
      />

      <UTable :data="riesgos" :columns="columnas" :loading="cargando" empty="Esta edición aún no tiene riesgos." class="text-sm">
        <template #actividad-cell="{ row }">
          <span class="line-clamp-3 min-w-40 whitespace-normal">{{ row.original.actividad }}</span>
        </template>
        <template #descripcion-cell="{ row }">
          <span class="line-clamp-3 min-w-48 whitespace-normal font-medium">{{ row.original.descripcion }}</span>
        </template>
        <template #factores-cell="{ row }">
          {{ row.original.factores.map(f => f.nombre).join(' / ') || '—' }}
        </template>
        <template #probabilidad-cell="{ row }">
          {{ row.original.probabilidad ?? '—' }}
        </template>
        <template #impacto-cell="{ row }">
          {{ row.original.impacto ?? '—' }}
        </template>
        <template #nivel-cell="{ row }">
          <div class="flex items-center gap-1">
            <NivelRiesgoBadge :nivel="row.original.nivel" />
            <UTooltip
              v-if="row.original.nivel_ajustado"
              :text="`Ajustado manualmente (calculado: ${row.original.nivel_calculado?.nombre}). ${row.original.justificacion_ajuste}`"
            >
              <UIcon name="i-lucide-hand" class="size-4 text-muted" aria-label="Nivel ajustado manualmente" />
            </UTooltip>
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
        <template #acciones-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              v-if="matriz && matriz.estado !== 'borrador'"
              icon="i-lucide-clipboard-list"
              label="Seguimiento"
              color="neutral"
              variant="soft"
              size="sm"
              @click="Object.assign(seguimiento, { abierto: true, riesgo: row.original })"
            />
            <UButton
              :icon="row.original.permisos.editar ? 'i-lucide-pencil' : 'i-lucide-eye'"
              :aria-label="row.original.permisos.editar ? 'Editar riesgo' : 'Ver riesgo'"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="abrir(row.original)"
            />
            <UButton
              icon="i-lucide-history"
              aria-label="Historial de cambios del riesgo"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="verHistorial(`Historial · Riesgo ${row.original.orden}`, `/api/riesgos/${row.original.id}/historial`)"
            />
            <UButton
              v-if="row.original.permisos.eliminar"
              icon="i-lucide-trash-2"
              aria-label="Eliminar riesgo"
              color="error"
              variant="ghost"
              size="sm"
              @click="Object.assign(eliminacion, { abierto: true, riesgo: row.original })"
            />
          </div>
        </template>
      </UTable>

      <RiesgoFormulario
        v-model:open="panel.abierto"
        :matriz-id="matrizId"
        :riesgo="panel.riesgo"
        :catalogos="catalogos"
        :solo-lectura="panel.soloLectura"
        @guardado="recargar"
      />

      <!-- Al registrar o anular puede cambiar el estado del tratamiento: se recarga la tabla. -->
      <HistorialPanel v-model:open="historial.abierto" :titulo="historial.titulo" :url="historial.url" />

      <SeguimientoPanel v-model:open="seguimiento.abierto" :riesgo="seguimiento.riesgo" @cambiado="recargar" />

      <ConfirmacionModal
        v-model:open="eliminacion.abierto"
        :titulo="`Eliminar el riesgo ${eliminacion.riesgo?.orden ?? ''}`"
        descripcion="Dejará de aparecer en esta edición. Se conserva en el histórico del sistema."
        etiqueta="Eliminar"
        color="error"
        :procesando="eliminacion.procesando"
        @confirmar="eliminar"
      />
    </template>
  </UDashboardPanel>
</template>
