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
  role_id: props.usuario?.role?.id ?? null as number | null,
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

// Errores de departamento_ids.0, departamento_ids.1… se agrupan en un solo campo.
const erroresDepartamentos = computed(() =>
  Object.entries(errores.value)
    .filter(([campo]) => campo === 'departamento_ids' || campo.startsWith('departamento_ids.'))
    .flatMap(([, mensajes]) => mensajes),
)
</script>

<template>
  <p v-if="cargando">Cargando…</p>

  <form v-else class="formulario" novalidate @submit.prevent="guardar">
    <p v-if="errorGeneral" role="alert" class="error">{{ errorGeneral }}</p>

    <div class="campo">
      <label for="name">Nombre</label>
      <input id="name" v-model="form.name" type="text" autocomplete="off" :aria-invalid="!!errores.name">
      <small v-for="mensaje in errores.name" :key="mensaje" class="error">{{ mensaje }}</small>
    </div>

    <div class="campo">
      <label for="email">Correo electrónico</label>
      <input id="email" v-model="form.email" type="email" autocomplete="off" :aria-invalid="!!errores.email">
      <small v-for="mensaje in errores.email" :key="mensaje" class="error">{{ mensaje }}</small>
    </div>

    <div class="campo">
      <label for="password">{{ esEdicion ? 'Nueva contraseña (dejar vacío para no cambiarla)' : 'Contraseña' }}</label>
      <input id="password" v-model="form.password" type="password" autocomplete="new-password" :aria-invalid="!!errores.password">
      <small v-for="mensaje in errores.password" :key="mensaje" class="error">{{ mensaje }}</small>
    </div>

    <div class="campo">
      <label for="password_confirmation">Confirmar contraseña</label>
      <input id="password_confirmation" v-model="form.password_confirmation" type="password" autocomplete="new-password">
    </div>

    <div class="campo">
      <label for="role_id">Rol</label>
      <select id="role_id" v-model="form.role_id" :aria-invalid="!!errores.role_id">
        <option :value="null" disabled>Selecciona un rol</option>
        <option v-for="rol in roles" :key="rol.id" :value="rol.id">{{ rol.nombre }}</option>
      </select>
      <small v-for="mensaje in errores.role_id" :key="mensaje" class="error">{{ mensaje }}</small>
    </div>

    <fieldset class="campo">
      <legend>Departamentos asignados</legend>
      <p v-if="!departamentos.length">No hay departamentos activos.</p>
      <label v-for="departamento in departamentos" :key="departamento.id" class="opcion">
        <input v-model="form.departamento_ids" type="checkbox" :value="departamento.id">
        {{ departamento.nombre }}
      </label>
      <small v-if="asignadosInactivos.length" class="aviso">
        Al guardar se quitará la asignación a departamentos inactivos:
        {{ asignadosInactivos.map(d => d.nombre).join(', ') }}.
      </small>
      <small v-for="mensaje in erroresDepartamentos" :key="mensaje" class="error">{{ mensaje }}</small>
    </fieldset>

    <button type="submit" :disabled="guardando">
      {{ guardando ? 'Guardando…' : (esEdicion ? 'Guardar cambios' : 'Crear usuario') }}
    </button>
  </form>
</template>

<style scoped>
.formulario { display: grid; gap: 1rem; max-width: 28rem; }
.campo { display: grid; gap: 0.25rem; }
.opcion { display: flex; gap: 0.5rem; align-items: center; }
.error { color: #b91c1c; }
.aviso { color: #92400e; }
</style>
