<script setup lang="ts">
import type { Item, User } from '~/types/api'

definePageMeta({ middleware: 'admin' })

const route = useRoute()
const { api } = useApi()
const { user: actual, fetchUser } = useAuth()

const usuario = ref<User | null>(null)
const errorGeneral = ref<string | null>(null)
const guardado = ref(false)

onMounted(async () => {
  try {
    const respuesta = await api<Item<User>>(`/api/users/${route.params.id}`)
    usuario.value = respuesta.data
  } catch (error) {
    errorGeneral.value = mensajeDeErrorApi(error)
  }
})

async function alGuardar(actualizado: User) {
  usuario.value = actualizado
  guardado.value = true

  // Si el administrador se editó a sí mismo, refresca su nombre en la sesión.
  if (actualizado.id === actual.value?.id) {
    await fetchUser()
  }
}
</script>

<template>
  <main style="max-width: 64rem; margin: 2rem auto; padding: 0 1rem; font-family: sans-serif;">
    <p><NuxtLink to="/usuarios">← Usuarios</NuxtLink></p>
    <h1>Editar usuario</h1>

    <p v-if="errorGeneral" role="alert" style="color: #b91c1c;">{{ errorGeneral }}</p>
    <p v-if="guardado" role="status" style="color: #15803d;">Cambios guardados.</p>

    <template v-if="usuario">
      <p v-if="!usuario.activo">Este usuario está desactivado y no puede iniciar sesión.</p>
      <!-- :key fuerza a reiniciar el formulario con los datos guardados -->
      <UsuarioForm :key="usuario.id" :usuario="usuario" @guardado="alGuardar" />
    </template>
  </main>
</template>
