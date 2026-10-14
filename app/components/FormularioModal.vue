<script setup lang="ts" generic="T">
import type { Form } from '@nuxt/ui'
import type { Item } from '~/types/api'

/**
 * Modal de alta/edición para registros sencillos (catálogos, departamentos,
 * procesos). No valida en el navegador: envía los datos y muestra los errores
 * 422 de Laravel bajo cada campo, que es la única fuente de verdad.
 */
export interface CampoFormulario {
  nombre: string
  etiqueta: string
  tipo?: 'text' | 'textarea' | 'color' | 'date'
  ayuda?: string
  requerido?: boolean
}

const props = defineProps<{
  titulo: string
  campos: CampoFormulario[]
  url: string
  metodo: 'POST' | 'PUT'
  valoresIniciales?: Record<string, unknown>
}>()

const emit = defineEmits<{ guardado: [registro: T] }>()
const abierto = defineModel<boolean>('open', { default: false })

const { api } = useApi()
const toast = useToast()

const formulario = useTemplateRef<Form<Record<string, unknown>>>('formulario')
const estado = reactive<Record<string, unknown>>({})
const erroresGenerales = ref<string[]>([])
const guardando = ref(false)

// Cada vez que se abre, parte de los valores iniciales (alta: vacío).
watch(abierto, (valor) => {
  if (!valor) {
    return
  }

  erroresGenerales.value = []
  for (const campo of props.campos) {
    estado[campo.nombre] = props.valoresIniciales?.[campo.nombre] ?? ''
  }
  nextTick(() => formulario.value?.clear())
}, { immediate: true })

async function guardar() {
  erroresGenerales.value = []
  guardando.value = true

  try {
    const respuesta = await api<Item<T>>(props.url, { method: props.metodo, body: { ...estado } })
    toast.add({ title: 'Cambios guardados', color: 'success', icon: 'i-lucide-check' })
    emit('guardado', respuesta.data)
    abierto.value = false
  } catch (error) {
    const validacion = erroresDeValidacion(error)
    if (!validacion) {
      erroresGenerales.value = [mensajeDeErrorApi(error)]
      return
    }

    const nombres = new Set(props.campos.map(c => c.nombre))
    formulario.value?.setErrors(
      Object.entries(validacion)
        .filter(([campo]) => nombres.has(campo))
        .map(([campo, mensajes]) => ({ name: campo, message: mensajes[0] ?? '' })),
    )
    // Errores que no corresponden a un campo visible (p. ej. "departamento").
    erroresGenerales.value = Object.entries(validacion)
      .filter(([campo]) => !nombres.has(campo))
      .flatMap(([, mensajes]) => mensajes)
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <UModal v-model:open="abierto" :title="titulo">
    <template #body>
      <UForm ref="formulario" :state="estado" class="space-y-4" @submit="guardar">
        <UAlert
          v-for="mensaje in erroresGenerales"
          :key="mensaje"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="mensaje"
        />

        <UFormField
          v-for="campo in campos"
          :key="campo.nombre"
          :name="campo.nombre"
          :label="campo.etiqueta"
          :help="campo.ayuda"
          :required="campo.requerido"
        >
          <UTextarea
            v-if="campo.tipo === 'textarea'"
            v-model="estado[campo.nombre] as string"
            class="w-full"
            autoresize
          />
          <div v-else-if="campo.tipo === 'color'" class="flex items-center gap-2">
            <input
              v-model="estado[campo.nombre]"
              type="color"
              class="h-9 w-12 cursor-pointer rounded border border-default"
              :aria-label="campo.etiqueta"
            >
            <UInput v-model="estado[campo.nombre] as string" class="w-32" />
          </div>
          <UInput
            v-else
            v-model="estado[campo.nombre] as string"
            :type="campo.tipo === 'date' ? 'date' : 'text'"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Cancelar" color="neutral" variant="ghost" @click="abierto = false" />
          <UButton type="submit" label="Guardar" :loading="guardando" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
