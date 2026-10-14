<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CampoFormulario } from '~/components/FormularioModal.vue'
import type { NivelRiesgo } from '~/types/api'

// Los cuatro niveles son estructura fija: solo se editan nombre y color.
const { items, cargando, error, recargar } = useListado<NivelRiesgo>('/api/niveles-riesgo')

const columnas: TableColumn<NivelRiesgo>[] = [
  { accessorKey: 'orden', header: 'Gravedad' },
  { accessorKey: 'nombre', header: 'Nivel' },
  { accessorKey: 'color', header: 'Color' },
  { id: 'acciones', header: '' },
]

const campos: CampoFormulario[] = [
  { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
  { nombre: 'color', etiqueta: 'Color', tipo: 'color', requerido: true, ayuda: 'Formato hexadecimal, p. ej. #EF4444.' },
]

const modalAbierto = ref(false)
const editando = ref<NivelRiesgo | null>(null)

// La matriz de calor muestra los colores: avisa al padre para que la refresque.
const emit = defineEmits<{ cambiado: [] }>()

function editar(nivel: NivelRiesgo) {
  editando.value = nivel
  modalAbierto.value = true
}

async function alGuardar() {
  await recargar()
  emit('cambiado')
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">
      Bajo, Moderado, Alto y Crítico son fijos (los usa la matriz de calor). Puede cambiar su nombre y color.
    </p>

    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

    <UTable :data="items" :columns="columnas" :loading="cargando">
      <template #color-cell="{ row }">
        <div class="flex items-center gap-2">
          <span class="size-4 rounded" :style="{ backgroundColor: row.original.color }" />
          <code class="text-xs">{{ row.original.color }}</code>
        </div>
      </template>
      <template #acciones-cell="{ row }">
        <div class="flex justify-end">
          <UButton icon="i-lucide-pencil" label="Editar" color="neutral" variant="ghost" size="sm" @click="editar(row.original)" />
        </div>
      </template>
    </UTable>

    <FormularioModal
      v-model:open="modalAbierto"
      titulo="Editar nivel de riesgo"
      :campos="campos"
      :url="`/api/niveles-riesgo/${editando?.id}`"
      metodo="PUT"
      :valores-iniciales="editando ?? undefined"
      @guardado="alGuardar"
    />
  </div>
</template>
