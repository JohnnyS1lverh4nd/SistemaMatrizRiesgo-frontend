<script setup lang="ts">
import type { Coleccion, Departamento, Item, Role, User } from '~/types/api'

/**
 * Alta (sin `usuario`) o edición (con `usuario`) de un usuario.
 * Toda la validación real ocurre en Laravel; aquí solo se muestran sus errores.
 */
const props = defineProps<{ usuario?: User }>()
const emit = defineEmits<{ guardado: [usuario: User] }>()

const { api } = useApi()

const esEdicion = computed(() => props.usuario !== undefined)

const form = reactive({
  name: props.usuario?.name ?? '',
  email: props.usuario?.email ?? '',
  password: '',
  password_confirmation: '',
  role_id: props.usuario?.role?.id as number | undefined,
  departamento_ids: props.usuario?.departamentos.map(d => d.id) ?? [] as number[],
})

const roles = ref<Role[]>([])
const departamentos = ref<Departamento[]>([])
const errores = ref<ErroresPorCampo>({})
const errorGeneral = ref<string | null>(null)
const guardando = ref(false)
const cargando = ref(true)

// Departamentos asignados que ya no están activos: no se pueden volver a enviar
// (la API solo acepta departamentos activos), así que se avisa antes de guardar.
const asignadosInactivos = computed(() => {
  const activos = new Set(departamentos.value.map(d => d.id))
  return props.usuario?.departamentos.filter(d => !activos.has(d.id)) ?? []
})

onMounted(async () => {
  try {
    const [respuestaRoles, respuestaDepartamentos] = await Promise.all([
      api<Coleccion<Role>>('/api/roles'),
      api<Coleccion<Departamento>>('/api/departamentos', { query: { activo: 1 } }),
    ])
    roles.value = respuestaRoles.data
    departamentos.value = respuestaDepartamentos.data
  } catch (error) {
    errorGeneral.value = mensajeDeErrorApi(error)
  } finally {
    cargando.value = false
  }
})

function cuerpo() {
  const datos: Record<string, unknown> = {
    name: form.name,
    email: form.email,
    role_id: form.role_id,
    departamento_ids: form.departamento_ids,
  }

  // En edición, contraseña vacía = conservar la actual.
  if (!esEdicion.value || form.password !== '') {
    datos.password = form.password
    datos.password_confirmation = form.password_confirmation
  }

  return datos
}

async function guardar() {
  errores.value = {}
  errorGeneral.value = null
  guardando.value = true

  try {
    const respuesta = props.usuario
      ? await api<Item<User>>(`/api/users/${props.usuario.id}`, { method: 'PUT', body: cuerpo() })
      : await api<Item<User>>('/api/users', { method: 'POST', body: cuerpo() })

    emit('guardado', respuesta.data)
  } catch (error) {
    const validacion = erroresDeValidacion(error)
    if (validacion) {
      errores.value = validacion
    } else {
      errorGeneral.value = mensajeDeErrorApi(error)
    }
  } finally {
    form.password = ''
    form.password_confirmation = ''
    guardando.value = false
  }
}

const opcionesRoles = computed(() => roles.value.map(r => ({ label: r.nombre, value: r.id })))
const opcionesDepartamentos = computed(() => departamentos.value.map(d => ({ label: d.nombre, id: d.id })))

// Errores de departamento_ids.0, departamento_ids.1… se agrupan en un solo campo.
const erroresDepartamentos = computed(() =>
  Object.entries(errores.value)
    .filter(([campo]) => campo === 'departamento_ids' || campo.startsWith('departamento_ids.'))
    .flatMap(([, mensajes]) => mensajes),
)
</script>

<template>
  <div v-if="cargando" class="text-sm text-muted">
    Cargando…
  </div>

  <form v-else class="max-w-lg space-y-4" novalidate @submit.prevent="guardar">
    <UAlert v-if="errorGeneral" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorGeneral" />

    <UFormField label="Nombre" name="name" :error="errores.name?.[0]" required>
      <UInput v-model="form.name" autocomplete="off" class="w-full" />
    </UFormField>

    <UFormField label="Correo electrónico" name="email" :error="errores.email?.[0]" required>
      <UInput v-model="form.email" type="email" autocomplete="off" class="w-full" />
    </UFormField>

    <UFormField
      :label="esEdicion ? 'Nueva contraseña' : 'Contraseña'"
      :help="esEdicion ? 'Déjela vacía para conservar la actual.' : undefined"
      name="password"
      :error="errores.password?.[0]"
      :required="!esEdicion"
    >
      <UInput v-model="form.password" type="password" autocomplete="new-password" class="w-full" />
    </UFormField>

    <UFormField label="Confirmar contraseña" name="password_confirmation">
      <UInput v-model="form.password_confirmation" type="password" autocomplete="new-password" class="w-full" />
    </UFormField>

    <UFormField label="Rol" name="role_id" :error="errores.role_id?.[0]" required>
      <USelect v-model="form.role_id" :items="opcionesRoles" placeholder="Selecciona un rol" class="w-full" />
    </UFormField>

    <UFormField
      label="Departamentos asignados"
      name="departamento_ids"
      :error="erroresDepartamentos[0]"
      help="Los encargados solo acceden a las matrices de sus departamentos."
    >
      <p v-if="!opcionesDepartamentos.length" class="text-sm text-muted">
        No hay departamentos activos.
      </p>
      <UCheckboxGroup v-else v-model="form.departamento_ids" :items="opcionesDepartamentos" value-key="id" />
    </UFormField>

    <UAlert
      v-if="asignadosInactivos.length"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Al guardar se quitará la asignación a departamentos inactivos"
      :description="asignadosInactivos.map(d => d.nombre).join(', ')"
    />

    <UButton type="submit" :label="esEdicion ? 'Guardar cambios' : 'Crear usuario'" :loading="guardando" />
  </form>
</template>
