<script setup lang="ts">
import type { Item, User } from '~/types/api'

definePageMeta({ middleware: 'admin' })

const route = useRoute()
const { api } = useApi()
const { user: actual, fetchUser } = useAuth()
const toast = useToast()

const usuario = ref<User | null>(null)
const errorGeneral = ref<string | null>(null)

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
  toast.add({ title: 'Cambios guardados', color: 'success', icon: 'i-lucide-check' })

  // Si el administrador se editó a sí mismo, refresca su nombre en la sesión.
  if (actualizado.id === actual.value?.id) {
    await fetchUser()
  }
}
</script>

<template>
  <UDashboardPanel id="editar-usuario">
    <template #header>
      <UDashboardNavbar :title="usuario ? `Editar · ${usuario.name}` : 'Editar usuario'">
        <template #leading>
          <UButton to="/usuarios" icon="i-lucide-arrow-left" color="neutral" variant="ghost" aria-label="Volver a usuarios" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert v-if="errorGeneral" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorGeneral" />

      <template v-if="usuario">
        <UAlert
          v-if="!usuario.activo"
          color="warning"
          variant="subtle"
          icon="i-lucide-user-x"
          title="Este usuario está desactivado y no puede iniciar sesión."
          class="max-w-lg"
        />
        <UsuarioForm :key="usuario.id" :usuario="usuario" @guardado="alGuardar" />
      </template>
    </template>
  </UDashboardPanel>
</template>
