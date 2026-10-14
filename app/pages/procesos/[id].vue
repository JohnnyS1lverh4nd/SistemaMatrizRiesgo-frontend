<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CampoFormulario } from '~/components/FormularioModal.vue'
import type { Item, Matriz, Proceso } from '~/types/api'

/**
 * Ediciones de la matriz de un proceso: alta, edición del borrador, publicar,
 * archivar, clonar y descartar. Los botones se muestran según `permisos`,
 * que calcula la API; la API vuelve a comprobarlo en cada acción.
 */
const route = useRoute()
const { api } = useApi()
const toast = useToast()

const procesoId = computed(() => String(route.params.id))
const proceso = ref<Proceso | null>(null)
const errorProceso = ref<string | null>(null)

const { items: ediciones, cargando, error, recargar } = useListado<Matriz>(
  () => `/api/procesos/${procesoId.value}/matrices`,
)

onMounted(async () => {
  try {
    proceso.value = (await api<Item<Proceso>>(`/api/procesos/${procesoId.value}`)).data
  } catch (e) {
    errorProceso.value = mensajeDeErrorApi(e)
  }
})

const vigente = computed(() => ediciones.value.find(e => e.estado === 'vigente'))

const columnas: TableColumn<Matriz>[] = [
  { accessorKey: 'nombre', header: 'Edición' },
  { accessorKey: 'fecha_revision', header: 'Fecha de revisión' },
  { accessorKey: 'estado', header: 'Estado' },
  { id: 'origen', header: 'Clonada de' },
  { id: 'acciones', header: '' },
]

const camposEdicion: CampoFormulario[] = [
  { nombre: 'nombre', etiqueta: 'Nombre de la edición', requerido: true, ayuda: 'Como la pestaña del Excel, p. ej. "Abril-Junio 2026" o "Edición 4".' },
  { nombre: 'fecha_revision', etiqueta: 'Fecha de revisión', tipo: 'date', requerido: true },
]

function nombreDe(id: number | null) {
  return ediciones.value.find(e => e.id === id)?.nombre ?? '—'
}

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
}

// --- Alta, edición y clonado (mismo formulario) -----------------------------

const formulario = reactive({
  abierto: false,
  titulo: '',
  url: '',
  metodo: 'POST' as 'POST' | 'PUT',
  valores: undefined as Record<string, unknown> | undefined,
})

function nuevaEdicion() {
  Object.assign(formulario, {
    abierto: true,
    titulo: 'Nueva edición (borrador)',
    url: `/api/procesos/${procesoId.value}/matrices`,
    metodo: 'POST',
    valores: undefined,
  })
}

function editar(matriz: Matriz) {
  Object.assign(formulario, {
    abierto: true,
    titulo: 'Editar borrador',
    url: `/api/matrices/${matriz.id}`,
    metodo: 'PUT',
    valores: { nombre: matriz.nombre, fecha_revision: matriz.fecha_revision },
  })
}

function clonar(matriz: Matriz) {
  Object.assign(formulario, {
    abierto: true,
    titulo: `Nueva edición a partir de «${matriz.nombre}»`,
    url: `/api/matrices/${matriz.id}/clonar`,
    metodo: 'POST',
    valores: undefined,
  })
}

// --- Publicar, archivar y descartar (con confirmación) ----------------------

type Accion = 'publicar' | 'archivar' | 'descartar'

const confirmacion = reactive({
  abierto: false,
  procesando: false,
  accion: 'publicar' as Accion,
  matriz: null as Matriz | null,
})

const textos = computed(() => {
  const nombre = confirmacion.matriz?.nombre ?? ''
  const textosPorAccion: Record<Accion, { titulo: string, descripcion: string, etiqueta: string, color: 'primary' | 'warning' | 'error' }> = {
    publicar: {
      titulo: `Publicar «${nombre}»`,
      descripcion: vigente.value
        ? `Pasará a ser la edición vigente y «${vigente.value.nombre}» quedará archivada. Después no podrá modificar sus datos: para reevaluar habrá que crear una edición nueva.`
        : 'Pasará a ser la edición vigente. Después no podrá modificar sus datos: para reevaluar habrá que crear una edición nueva.',
      etiqueta: 'Publicar',
      color: 'primary',
    },
    archivar: {
      titulo: `Archivar «${nombre}»`,
      descripcion: 'El proceso quedará sin edición vigente hasta que publique otra. Una edición archivada no se puede modificar.',
      etiqueta: 'Archivar',
      color: 'warning',
    },
    descartar: {
      titulo: `Descartar «${nombre}»`,
      descripcion: 'Este borrador nunca se publicó y dejará de mostrarse.',
      etiqueta: 'Descartar borrador',
      color: 'error',
    },
  }

  return textosPorAccion[confirmacion.accion]
})

function pedirConfirmacion(accion: Accion, matriz: Matriz) {
  Object.assign(confirmacion, { abierto: true, accion, matriz })
}

async function ejecutar() {
  const matriz = confirmacion.matriz
  if (!matriz) {
    return
  }

  confirmacion.procesando = true
  try {
    if (confirmacion.accion === 'descartar') {
      await api(`/api/matrices/${matriz.id}`, { method: 'DELETE' })
    } else {
      await api(`/api/matrices/${matriz.id}/${confirmacion.accion}`, { method: 'POST' })
    }
    toast.add({ title: 'Listo', description: textos.value.titulo, color: 'success', icon: 'i-lucide-check' })
    confirmacion.abierto = false
    await recargar()
  } catch (e) {
    // 403 con mensaje de la Policy (p. ej. "Solo se pueden publicar ediciones en borrador.").
    toast.add({ title: mensajeDeErrorApi(e), color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    confirmacion.procesando = false
  }
}
</script>

<template>
  <UDashboardPanel id="proceso-matrices">
    <template #header>
      <UDashboardNavbar :title="proceso?.nombre ?? 'Proceso'">
        <template #leading>
          <UButton to="/matrices" icon="i-lucide-arrow-left" color="neutral" variant="ghost" aria-label="Volver a matrices" />
        </template>
        <template #right>
          <UButton
            v-if="proceso?.permisos.crear_matriz"
            icon="i-lucide-plus"
            label="Nueva edición"
            @click="nuevaEdicion"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert v-if="errorProceso || error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorProceso ?? error ?? ''" />

      <UAlert
        v-if="!cargando && !vigente && ediciones.length"
        color="warning"
        variant="subtle"
        icon="i-lucide-info"
        title="Este proceso no tiene una edición vigente."
      />

      <UTable :data="ediciones" :columns="columnas" :loading="cargando" empty="Este proceso aún no tiene ediciones.">
        <template #fecha_revision-cell="{ row }">
          {{ formatearFecha(row.original.fecha_revision) }}
        </template>
        <template #estado-cell="{ row }">
          <EstadoMatrizBadge :estado="row.original.estado" />
        </template>
        <template #origen-cell="{ row }">
          <span class="text-muted">{{ nombreDe(row.original.edicion_anterior_id) }}</span>
        </template>
        <template #acciones-cell="{ row }">
          <div class="flex flex-wrap justify-end gap-1">
            <UButton v-if="row.original.permisos.editar" icon="i-lucide-pencil" label="Editar" color="neutral" variant="ghost" size="sm" @click="editar(row.original)" />
            <UButton v-if="row.original.permisos.publicar" icon="i-lucide-send" label="Publicar" color="primary" variant="soft" size="sm" @click="pedirConfirmacion('publicar', row.original)" />
            <UButton v-if="row.original.permisos.clonar" icon="i-lucide-copy" label="Nueva edición desde aquí" color="neutral" variant="ghost" size="sm" @click="clonar(row.original)" />
            <UButton v-if="row.original.permisos.archivar" icon="i-lucide-archive" label="Archivar" color="neutral" variant="ghost" size="sm" @click="pedirConfirmacion('archivar', row.original)" />
            <UButton v-if="row.original.permisos.descartar" icon="i-lucide-trash-2" label="Descartar" color="error" variant="ghost" size="sm" @click="pedirConfirmacion('descartar', row.original)" />
          </div>
        </template>
      </UTable>

      <FormularioModal
        v-model:open="formulario.abierto"
        :titulo="formulario.titulo"
        :campos="camposEdicion"
        :url="formulario.url"
        :metodo="formulario.metodo"
        :valores-iniciales="formulario.valores"
        @guardado="recargar"
      />

      <ConfirmacionModal
        v-model:open="confirmacion.abierto"
        :titulo="textos.titulo"
        :descripcion="textos.descripcion"
        :etiqueta="textos.etiqueta"
        :color="textos.color"
        :procesando="confirmacion.procesando"
        @confirmar="ejecutar"
      />
    </template>
  </UDashboardPanel>
</template>
