<script setup lang="ts">
import type { Coleccion, EstadoTratamiento, Item, Riesgo, Seguimiento } from '~/types/api'

/**
 * Histórico de seguimiento de un riesgo y registro de nuevas entradas con
 * evidencias. Las reglas (quién, cuándo, tipos y tamaño de archivo) las
 * aplica Laravel; aquí solo se muestran sus errores.
 */
const props = defineProps<{ riesgo: Riesgo | null }>()
const emit = defineEmits<{ cambiado: [] }>()
const abierto = defineModel<boolean>('open', { default: false })

const { api } = useApi()
const toast = useToast()

const historial = ref<Seguimiento[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)

async function cargar() {
  if (!props.riesgo) {
    return
  }
  cargando.value = true
  error.value = null
  try {
    historial.value = (await api<Coleccion<Seguimiento>>(`/api/riesgos/${props.riesgo.id}/seguimientos`)).data
  } catch (e) {
    error.value = mensajeDeErrorApi(e)
  } finally {
    cargando.value = false
  }
}

watch(abierto, (valor) => {
  if (valor) {
    reiniciarFormulario()
    cargar()
  }
})

// --- Registrar ----------------------------------------------------------------

const hoy = () => new Date().toLocaleDateString('sv-SE') // AAAA-MM-DD en hora local

const formulario = reactive({
  fecha: hoy(),
  descripcion: '',
  estado_tratamiento: undefined as EstadoTratamiento | undefined,
  archivos: [] as File[],
})
const errores = ref<ErroresPorCampo>({})
const guardando = ref(false)
const entradaArchivos = useTemplateRef<HTMLInputElement>('entradaArchivos')

function reiniciarFormulario() {
  Object.assign(formulario, { fecha: hoy(), descripcion: '', estado_tratamiento: undefined, archivos: [] })
  errores.value = {}
  if (entradaArchivos.value) {
    entradaArchivos.value.value = ''
  }
}

function alElegirArchivos(evento: Event) {
  formulario.archivos = Array.from((evento.target as HTMLInputElement).files ?? [])
}

async function registrar() {
  if (!props.riesgo) {
    return
  }

  errores.value = {}
  guardando.value = true

  const datos = new FormData()
  datos.append('fecha', formulario.fecha)
  datos.append('descripcion', formulario.descripcion)
  if (formulario.estado_tratamiento) {
    datos.append('estado_tratamiento', formulario.estado_tratamiento)
  }
  formulario.archivos.forEach(archivo => datos.append('archivos[]', archivo))

  try {
    await api<Item<Seguimiento>>(`/api/riesgos/${props.riesgo.id}/seguimientos`, { method: 'POST', body: datos })
    toast.add({ title: 'Seguimiento registrado', color: 'success', icon: 'i-lucide-check' })
    reiniciarFormulario()
    await cargar()
    emit('cambiado')
  } catch (e) {
    const validacion = erroresDeValidacion(e)
    if (validacion) {
      errores.value = validacion
    } else if (e instanceof Error && 'statusCode' in e && e.statusCode === 413) {
      toast.add({ title: 'Los archivos superan el tamaño permitido por el servidor.', color: 'error', icon: 'i-lucide-circle-alert' })
    } else {
      toast.add({ title: mensajeDeErrorApi(e), color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    guardando.value = false
  }
}

// Errores de archivos.0, archivos.1… se muestran juntos, con el nombre del archivo.
const erroresArchivos = computed(() => Object.entries(errores.value)
  .filter(([campo]) => campo === 'archivos' || campo.startsWith('archivos.'))
  .map(([campo, mensajes]) => {
    const indice = Number(campo.split('.')[1])
    const nombre = Number.isInteger(indice) ? formulario.archivos[indice]?.name : undefined
    return nombre ? `${nombre}: ${mensajes[0]}` : mensajes[0]
  }))

// --- Anular -------------------------------------------------------------------

const anulacion = reactive({ abierto: false, procesando: false, seguimiento: null as Seguimiento | null, motivo: '', error: '' })

function pedirAnulacion(seguimiento: Seguimiento) {
  Object.assign(anulacion, { abierto: true, seguimiento, motivo: '', error: '' })
}

async function anular() {
  if (!anulacion.seguimiento) {
    return
  }
  anulacion.procesando = true
  anulacion.error = ''
  try {
    await api(`/api/seguimientos/${anulacion.seguimiento.id}/anular`, { method: 'POST', body: { motivo: anulacion.motivo } })
    toast.add({ title: 'Seguimiento anulado', color: 'success', icon: 'i-lucide-check' })
    anulacion.abierto = false
    await cargar()
    emit('cambiado')
  } catch (e) {
    anulacion.error = erroresDeValidacion(e)?.motivo?.[0] ?? mensajeDeErrorApi(e)
  } finally {
    anulacion.procesando = false
  }
}

// --- Evidencias ---------------------------------------------------------------

async function descargar(evidencia: Seguimiento['evidencias'][number]) {
  try {
    // Petición autenticada: misma sesión y control de errores que el resto de la API.
    const archivo = await api<Blob>(`/api/evidencias/${evidencia.id}/descargar`, { responseType: 'blob' })
    const url = URL.createObjectURL(archivo)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = evidencia.nombre
    enlace.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    toast.add({ title: mensajeDeErrorApi(e), color: 'error', icon: 'i-lucide-circle-alert' })
  }
}

function tamanoLegible(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <USlideover
    v-model:open="abierto"
    :title="riesgo ? `Seguimiento · Riesgo ${riesgo.orden}` : 'Seguimiento'"
    :description="riesgo?.descripcion"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Registrar -->
        <UCard v-if="riesgo?.permisos.registrar_seguimiento">
          <form class="space-y-4" novalidate @submit.prevent="registrar">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Fecha" name="fecha" :error="errores.fecha?.[0]" required>
                <UInput v-model="formulario.fecha" type="date" :max="hoy()" class="w-full" />
              </UFormField>
              <UFormField label="Cambiar estado del tratamiento" name="estado_tratamiento" :error="errores.estado_tratamiento?.[0]">
                <USelect
                  v-model="formulario.estado_tratamiento"
                  :items="OPCIONES_ESTADO_TRATAMIENTO"
                  :placeholder="`Sin cambio (${ESTADOS_TRATAMIENTO[riesgo.estado_tratamiento].label})`"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Descripción" name="descripcion" :error="errores.descripcion?.[0]" required>
              <UTextarea v-model="formulario.descripcion" autoresize :rows="3" class="w-full" />
            </UFormField>
            <UFormField
              label="Evidencias"
              name="archivos"
              help="PDF, imágenes (JPG/PNG) o Excel. Hasta 5 archivos de 10 MB."
              :error="erroresArchivos[0]"
            >
              <input
                ref="entradaArchivos"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                class="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-1.5"
                @change="alElegirArchivos"
              >
            </UFormField>
            <ul v-if="erroresArchivos.length > 1" class="text-sm text-error">
              <li v-for="mensaje in erroresArchivos.slice(1)" :key="mensaje">
                {{ mensaje }}
              </li>
            </ul>
            <div class="flex justify-end">
              <UButton type="submit" icon="i-lucide-plus" label="Registrar seguimiento" :loading="guardando" />
            </div>
          </form>
        </UCard>

        <!-- Histórico -->
        <section>
          <h3 class="mb-3 text-sm font-semibold uppercase text-muted">
            Histórico
          </h3>
          <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />
          <p v-else-if="cargando" class="text-sm text-muted">
            Cargando…
          </p>
          <p v-else-if="!historial.length" class="text-sm text-muted">
            Aún no hay seguimientos registrados.
          </p>

          <ol v-else class="space-y-3">
            <li
              v-for="entrada in historial"
              :key="entrada.id"
              class="rounded-md border border-default p-3"
              :class="{ 'opacity-60': entrada.anulado }"
            >
              <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span class="font-medium">{{ formatearFecha(entrada.fecha) }} · {{ entrada.registrado_por.name }}</span>
                <div class="flex items-center gap-2">
                  <UBadge v-if="entrada.anulado" label="Anulado" color="error" variant="subtle" />
                  <UBadge
                    v-if="entrada.estado_tratamiento_nuevo"
                    :label="`${ESTADOS_TRATAMIENTO[entrada.estado_tratamiento_anterior ?? 'pendiente'].label} → ${ESTADOS_TRATAMIENTO[entrada.estado_tratamiento_nuevo].label}`"
                    :color="ESTADOS_TRATAMIENTO[entrada.estado_tratamiento_nuevo].color"
                    variant="subtle"
                  />
                  <UButton
                    v-if="entrada.permisos.anular"
                    label="Anular"
                    icon="i-lucide-ban"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="pedirAnulacion(entrada)"
                  />
                </div>
              </div>

              <p class="mt-2 whitespace-pre-line text-sm" :class="{ 'line-through': entrada.anulado }">
                {{ entrada.descripcion }}
              </p>

              <ul v-if="entrada.evidencias.length" class="mt-2 flex flex-wrap gap-2">
                <li v-for="evidencia in entrada.evidencias" :key="evidencia.id">
                  <UButton
                    :label="`${evidencia.nombre} (${tamanoLegible(evidencia.tamano)})`"
                    icon="i-lucide-paperclip"
                    color="neutral"
                    variant="soft"
                    size="xs"
                    @click="descargar(evidencia)"
                  />
                </li>
              </ul>

              <p v-if="entrada.anulado" class="mt-2 text-xs text-muted">
                Anulado por {{ entrada.anulado_por?.name }}: {{ entrada.motivo_anulacion }}
              </p>
            </li>
          </ol>
        </section>
      </div>

      <UModal v-model:open="anulacion.abierto" title="Anular seguimiento" description="El registro seguirá visible en el histórico, marcado como anulado.">
        <template #body>
          <UFormField label="Motivo" name="motivo" :error="anulacion.error || undefined" required>
            <UTextarea v-model="anulacion.motivo" autoresize class="w-full" />
          </UFormField>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton label="Cancelar" color="neutral" variant="ghost" @click="anulacion.abierto = false" />
            <UButton label="Anular" color="error" :loading="anulacion.procesando" @click="anular" />
          </div>
        </template>
      </UModal>
    </template>
  </USlideover>
</template>
