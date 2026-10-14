<script setup lang="ts">
// Cambio de la propia contraseña: PUT /user/password (Fortify updatePasswords).
const { api } = useApi()

const form = reactive({
  current_password: '',
  password: '',
  password_confirmation: '',
})
const errores = ref<ErroresPorCampo>({})
const errorGeneral = ref<string | null>(null)
const guardada = ref(false)
const guardando = ref(false)

async function guardar() {
  errores.value = {}
  errorGeneral.value = null
  guardada.value = false
  guardando.value = true

  try {
    await api('/user/password', { method: 'PUT', body: { ...form } })
    guardada.value = true
  } catch (error) {
    const validacion = erroresDeValidacion(error)
    if (validacion) {
      errores.value = validacion
    } else {
      errorGeneral.value = mensajeDeErrorApi(error)
    }
  } finally {
    form.current_password = ''
    form.password = ''
    form.password_confirmation = ''
    guardando.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="cambiar-contrasena">
    <template #header>
      <UDashboardNavbar title="Cambiar contraseña" />
    </template>

    <template #body>
      <UCard class="max-w-md">
        <form class="space-y-4" novalidate @submit.prevent="guardar">
          <UAlert v-if="guardada" color="success" variant="subtle" icon="i-lucide-check" title="Tu contraseña se actualizó correctamente." />
          <UAlert v-if="errorGeneral" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorGeneral" />

          <UFormField label="Contraseña actual" name="current_password" :error="errores.current_password?.[0]" required>
            <UInput v-model="form.current_password" type="password" autocomplete="current-password" class="w-full" />
          </UFormField>
          <UFormField label="Nueva contraseña" name="password" :error="errores.password?.[0]" required>
            <UInput v-model="form.password" type="password" autocomplete="new-password" class="w-full" />
          </UFormField>
          <UFormField label="Confirmar nueva contraseña" name="password_confirmation" required>
            <UInput v-model="form.password_confirmation" type="password" autocomplete="new-password" class="w-full" />
          </UFormField>

          <UButton type="submit" label="Cambiar contraseña" :loading="guardando" />
        </form>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
