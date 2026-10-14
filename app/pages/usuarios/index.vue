<script setup lang="ts">
import type { Item, Paginado, User } from '~/types/api'

definePageMeta({ middleware: 'admin' })

const { api } = useApi()
const { user: actual } = useAuth()

const usuarios = ref<User[]>([])
const pagina = ref(1)
const ultimaPagina = ref(1)
const total = ref(0)
const cargando = ref(false)
const errorGeneral = ref<string | null>(null)
const cambiandoEstado = ref<number | null>(null)

async function cargar() {
  cargando.value = true
  errorGeneral.value = null

  try {
    const respuesta = await api<Paginado<User>>('/api/users', { query: { page: pagina.value } })
    usuarios.value = respuesta.data
    ultimaPagina.value = respuesta.meta.last_page
    total.value = respuesta.meta.total
  } catch (error) {
    errorGeneral.value = mensajeDeErrorApi(error)
  } finally {
    cargando.value = false
  }
}

async function alternarEstado(usuario: User) {
  cambiandoEstado.value = usuario.id
  errorGeneral.value = null

  try {
    const respuesta = await api<Item<User>>(`/api/users/${usuario.id}`, {
      method: 'PUT',
      body: { activo: !usuario.activo },
    })
    usuarios.value = usuarios.value.map(u => (u.id === usuario.id ? respuesta.data : u))
  } catch (error) {
    const validacion = erroresDeValidacion(error)
    errorGeneral.value = validacion?.activo?.[0] ?? mensajeDeErrorApi(error)
  } finally {
    cambiandoEstado.value = null
  }
}

function irAPagina(nueva: number) {
  pagina.value = nueva
  cargar()
}

onMounted(cargar)
</script>

<template>
  <main class="pagina">
    <p><NuxtLink to="/">← Inicio</NuxtLink></p>

    <header class="cabecera">
      <h1>Usuarios</h1>
      <NuxtLink to="/usuarios/nuevo">Nuevo usuario</NuxtLink>
    </header>

    <p v-if="errorGeneral" role="alert" class="error">{{ errorGeneral }}</p>
    <p v-if="cargando">Cargando…</p>

    <div v-else class="tabla-contenedor">
      <table>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Correo</th>
            <th scope="col">Rol</th>
            <th scope="col">Departamentos</th>
            <th scope="col">Estado</th>
            <th scope="col"><span class="oculto">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="usuario in usuarios" :key="usuario.id" :class="{ inactivo: !usuario.activo }">
            <td>{{ usuario.name }}</td>
            <td>{{ usuario.email }}</td>
            <td>{{ usuario.role?.nombre ?? 'Sin rol' }}</td>
            <td>{{ usuario.departamentos.map(d => d.nombre).join(', ') || '—' }}</td>
            <td>{{ usuario.activo ? 'Activo' : 'Desactivado' }}</td>
            <td class="acciones">
              <NuxtLink :to="`/usuarios/${usuario.id}`">Editar</NuxtLink>
              <button
                v-if="usuario.id !== actual?.id"
                type="button"
                :disabled="cambiandoEstado === usuario.id"
                @click="alternarEstado(usuario)"
              >
                {{ usuario.activo ? 'Desactivar' : 'Reactivar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!usuarios.length">
            <td colspan="6">No hay usuarios.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="ultimaPagina > 1" class="paginacion" aria-label="Paginación">
      <button type="button" :disabled="pagina <= 1 || cargando" @click="irAPagina(pagina - 1)">Anterior</button>
      <span>Página {{ pagina }} de {{ ultimaPagina }} ({{ total }} usuarios)</span>
      <button type="button" :disabled="pagina >= ultimaPagina || cargando" @click="irAPagina(pagina + 1)">Siguiente</button>
    </nav>
  </main>
</template>

<style scoped>
.pagina { max-width: 64rem; margin: 2rem auto; padding: 0 1rem; font-family: sans-serif; }
.cabecera { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.tabla-contenedor { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #e5e7eb; }
.inactivo { color: #6b7280; }
.acciones { display: flex; gap: 0.75rem; align-items: center; }
.paginacion { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; }
.error { color: #b91c1c; }
.oculto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
