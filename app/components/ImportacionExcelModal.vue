<script setup lang="ts">
import type { Coleccion, Item, Matriz, ResumenImportacion } from '~/types/api'

/**
 * Importación de ediciones desde un Excel institucional (RF-7), en dos pasos:
 * 1. Analizar: la API lee el archivo y devuelve el plan, sin escribir nada.
 * 2. Importar: se envía el mismo archivo; la API lo vuelve a analizar e importa.
 * Laravel decide qué es válido; aquí solo se muestra su respuesta.
 */
const props = defineProps<{ procesoId: string | number, procesoNombre: string }>()
const emit = defineEmits<{ importado: [ediciones: Matriz[]] }>()
const abierto = defineModel<boolean>('open', { default: false })

const { api } = useApi()
const toast = useToast()

const archivo = ref<File | null>(null)
const resumen = ref<ResumenImportacion | null>(null)
const analizando = ref(false)
const importando = ref(false)
const errorGeneral = ref<string | null>(null)

// Otro archivo = otro análisis.
watch(archivo, () => {
  resumen.value = null
  errorGeneral.value = null
})

watch(abierto, (valor) => {
  if (!valor) {
    archivo.value = null
  }
})

function formulario(): FormData {
  const datos = new FormData()
  datos.append('archivo', archivo.value as File)

  return datos
}

/** 422 del FormRequest (tipo o tamaño del archivo) o error general. */
function mostrarError(e: unknown) {
  const validacion = erroresDeValidacion(e)
  errorGeneral.value = validacion?.archivo?.join(' ') ?? mensajeDeErrorApi(e)
}

async function analizar() {
  if (!archivo.value) {
    return
  }
  analizando.value = true
  errorGeneral.value = null
  try {
    resumen.value = (await api<Item<ResumenImportacion>>(
      `/api/procesos/${props.procesoId}/importacion/vista-previa`,
      { method: 'POST', body: formulario() },
    )).data
  } catch (e) {
    mostrarError(e)
  } finally {
    analizando.value = false
  }
}

async function importar() {
  if (!archivo.value || !resumen.value?.valido) {
    return
  }
  importando.value = true
  try {
    const ediciones = (await api<Coleccion<Matriz>>(
      `/api/procesos/${props.procesoId}/importacion`,
      { method: 'POST', body: formulario() },
    )).data
    toast.add({
      title: 'Importación completada',
      description: `${ediciones.length} edición(es) importada(s) en «${props.procesoNombre}».`,
      color: 'success',
      icon: 'i-lucide-check',
    })
    abierto.value = false
    emit('importado', ediciones)
  } catch (e) {
    mostrarError(e)
  } finally {
    importando.value = false
  }
}

function formatearFecha(fecha: string | null) {
  return fecha
    ? new Date(`${fecha}T00:00:00`).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
}
</script>

<template>
  <UModal
    v-model:open="abierto"
    title="Importar desde Excel"
    :description="`Ediciones de la matriz de «${procesoNombre}» con el formato RT-01-NI-ONA-156.`"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFileUpload
          v-model="archivo"
          accept=".xlsx"
          label="Arrastre el archivo .xlsx o haga clic para elegirlo"
          description="Máximo 5 MB. Cada hoja visible es una edición; la más reciente quedará vigente."
          icon="i-lucide-file-spreadsheet"
          layout="list"
          class="w-full"
        />

        <UAlert v-if="errorGeneral" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorGeneral" />

        <template v-if="resumen">
          <UAlert
            v-if="resumen.valido"
            color="success"
            variant="subtle"
            icon="i-lucide-circle-check"
            title="El archivo se puede importar."
            description="Revise el resumen. Las ediciones se publican al importarlas y después no se pueden modificar."
          />
          <UAlert
            v-else
            color="error"
            variant="subtle"
            icon="i-lucide-circle-x"
            title="El archivo tiene errores y no se importará nada."
          >
            <template #description>
              <ul class="mt-1 list-disc space-y-1 ps-4">
                <li v-for="mensaje in resumen.errores" :key="mensaje">{{ mensaje }}</li>
              </ul>
            </template>
          </UAlert>

          <table v-if="resumen.ediciones.length" class="w-full text-sm">
            <thead class="text-left text-muted">
              <tr>
                <th class="py-1 pe-2 font-medium">Hoja</th>
                <th class="py-1 pe-2 font-medium">Edición</th>
                <th class="py-1 pe-2 font-medium">Fecha de revisión</th>
                <th class="py-1 pe-2 text-right font-medium">Riesgos</th>
                <th class="py-1 pe-2 text-right font-medium">Seguimientos</th>
                <th class="py-1 text-right font-medium">Ajustes de nivel</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="edicion in resumen.ediciones" :key="edicion.hoja">
                <td class="py-1 pe-2 text-muted">{{ edicion.hoja }}</td>
                <td class="py-1 pe-2 font-medium">{{ edicion.nombre }}</td>
                <td class="py-1 pe-2">{{ formatearFecha(edicion.fecha_revision) }}</td>
                <td class="py-1 pe-2 text-right">{{ edicion.riesgos }}</td>
                <td class="py-1 pe-2 text-right">{{ edicion.seguimientos }}</td>
                <td class="py-1 text-right">{{ edicion.ajustes }}</td>
              </tr>
            </tbody>
          </table>

          <UAlert v-if="resumen.avisos.length" color="warning" variant="subtle" icon="i-lucide-info" title="Avisos">
            <template #description>
              <ul class="mt-1 list-disc space-y-1 ps-4">
                <li v-for="mensaje in resumen.avisos" :key="mensaje">{{ mensaje }}</li>
              </ul>
            </template>
          </UAlert>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="abierto = false" />
        <UButton
          v-if="!resumen?.valido"
          label="Analizar"
          icon="i-lucide-scan-search"
          :disabled="!archivo"
          :loading="analizando"
          @click="analizar"
        />
        <UButton
          v-else
          label="Importar"
          icon="i-lucide-upload"
          :loading="importando"
          @click="importar"
        />
      </div>
    </template>
  </UModal>
</template>
