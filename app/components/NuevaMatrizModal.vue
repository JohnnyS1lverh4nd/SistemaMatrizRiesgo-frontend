<script setup lang="ts">
import type { Form } from '@nuxt/ui'
import type { Departamento, Item, Proceso } from '~/types/api'

/**
 * Nueva matriz de un departamento = nuevo proceso (POST
 * /api/departamentos/{id}/procesos). Opcionalmente crea en la misma operación
 * la primera edición en borrador. La API valida todo y decide los permisos;
 * aquí solo se muestran sus errores 422 bajo cada campo.
 */
const props = defineProps<{ departamento: Departamento }>()
const emit = defineEmits<{ creado: [proceso: Proceso] }>()
const abierto = defineModel<boolean>('open', { default: false })

const { api } = useApi()
const toast = useToast()

const formulario = useTemplateRef<Form<typeof estado>>('formulario')
const estado = reactive({
  nombre: '',
  descripcion: '',
  conEdicion: true,
  edicionNombre: '',
  edicionFecha: '',
})
const erroresGenerales = ref<string[]>([])
const guardando = ref(false)

// Nombre de campo de la API -> campo del formulario. El slug se genera a
// partir del nombre, así que su error (nombre repetido) va bajo "Nombre".
const CAMPOS: Record<string, keyof typeof estado> = {
  'nombre': 'nombre',
  'slug': 'nombre',
  'descripcion': 'descripcion',
  'edicion_inicial.nombre': 'edicionNombre',
  'edicion_inicial.fecha_revision': 'edicionFecha',
}

watch(abierto, (valor) => {
  if (!valor) {
    return
  }

  Object.assign(estado, { nombre: '', descripcion: '', conEdicion: true, edicionNombre: '', edicionFecha: '' })
  erroresGenerales.value = []
  nextTick(() => formulario.value?.clear())
}, { immediate: true })

async function guardar() {
  erroresGenerales.value = []
  guardando.value = true

  try {
    const respuesta = await api<Item<Proceso>>(`/api/departamentos/${props.departamento.id}/procesos`, {
      method: 'POST',
      body: {
        nombre: estado.nombre,
        descripcion: estado.descripcion || null,
        ...(estado.conEdicion
          ? { edicion_inicial: { nombre: estado.edicionNombre, fecha_revision: estado.edicionFecha } }
          : {}),
      },
    })
    toast.add({ title: 'Matriz creada', description: respuesta.data.nombre, color: 'success', icon: 'i-lucide-check' })
    abierto.value = false
    emit('creado', respuesta.data)
  } catch (error) {
    const validacion = erroresDeValidacion(error)
    if (!validacion) {
      erroresGenerales.value = [mensajeDeErrorApi(error)]
      return
    }

    formulario.value?.setErrors(
      Object.entries(validacion)
        .filter(([campo]) => campo in CAMPOS)
        .map(([campo, mensajes]) => ({ name: CAMPOS[campo], message: mensajes[0] ?? '' })),
    )
    // Errores sin campo visible (p. ej. "departamento" inactivo).
    erroresGenerales.value = Object.entries(validacion)
      .filter(([campo]) => !(campo in CAMPOS))
      .flatMap(([, mensajes]) => mensajes)
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="abierto"
    title="Nueva matriz de riesgos"
    :description="`Departamento: ${departamento.nombre}`"
  >
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
          name="nombre"
          label="Proceso"
          help="Como en el encabezado de la matriz, p. ej. «SP 4.3. Abastecimiento»."
          required
        >
          <UInput v-model="estado.nombre" class="w-full" autofocus />
        </UFormField>

        <UFormField name="descripcion" label="Descripción">
          <UTextarea v-model="estado.descripcion" class="w-full" autoresize />
        </UFormField>

        <USeparator />

        <UCheckbox
          v-model="estado.conEdicion"
          label="Crear también la primera edición (borrador)"
          description="Podrá registrar los riesgos en ella y publicarla cuando esté completa."
        />

        <template v-if="estado.conEdicion">
          <UFormField
            name="edicionNombre"
            label="Nombre de la edición"
            help="Como la pestaña del Excel, p. ej. «Enero-Marzo 2027» o «Edición 1»."
            required
          >
            <UInput v-model="estado.edicionNombre" class="w-full" />
          </UFormField>
          <UFormField name="edicionFecha" label="Fecha de revisión" required>
            <UInput v-model="estado.edicionFecha" type="date" class="w-full" />
          </UFormField>
        </template>

        <div class="flex justify-end gap-2">
          <UButton label="Cancelar" color="neutral" variant="ghost" @click="abierto = false" />
          <UButton type="submit" label="Crear matriz" :loading="guardando" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
