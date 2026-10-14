<script setup lang="ts">
definePageMeta({ public: true, layout: 'publico' })

// Se llega desde el enlace del correo: /restablecer-contrasena?token=...&email=...
const route = useRoute()
const { api } = useApi()

const token = typeof route.query.token === 'string' ? route.query.token : ''
const email = typeof route.query.email === 'string' ? route.query.email : ''

const password = ref('')
const passwordConfirmation = ref('')
const errores = ref<string[]>([])
const restablecida = ref(false)
const loading = ref(false)

const enlaceIncompleto = !token || !email

async function handleSubmit() {
  errores.value = []
  loading.value = true

  try {
    await api('/reset-password', {
      method: 'POST',
      body: {
        token,
        email,
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      },
    })
    restablecida.value = true
  } catch (error) {
    const validacion = erroresDeValidacion(error)
    errores.value = validacion ? Object.values(validacion).flat() : [mensajeDeErrorApi(error)]
  } finally {
    password.value = ''
    passwordConfirmation.value = ''
    loading.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h1 class="text-lg font-semibold">
        Nueva contraseña
      </h1>
    </template>

    <div v-if="enlaceIncompleto" class="space-y-4">
      <UAlert
        color="error"
        variant="subtle"
        icon="i-lucide-link-2-off"
        title="El enlace está incompleto."
        description="Solicita uno nuevo desde la página de recuperación de contraseña."
      />
      <UButton to="/olvide-contrasena" label="Recuperar contraseña" block />
    </div>

    <div v-else-if="restablecida" class="space-y-4">
      <UAlert color="success" variant="subtle" icon="i-lucide-check" title="Tu contraseña se actualizó correctamente." />
      <UButton to="/login" label="Iniciar sesión" block />
    </div>

    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <p class="text-sm text-muted">
        Cuenta: <strong class="text-default">{{ email }}</strong>
      </p>

      <UAlert v-for="mensaje in errores" :key="mensaje" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="mensaje" />

      <UFormField label="Nueva contraseña" name="password" required>
        <UInput v-model="password" type="password" autocomplete="new-password" required class="w-full" />
      </UFormField>
      <UFormField label="Confirmar contraseña" name="password_confirmation" required>
        <UInput v-model="passwordConfirmation" type="password" autocomplete="new-password" required class="w-full" />
      </UFormField>

      <UButton type="submit" label="Guardar contraseña" :loading="loading" block />
      <ULink v-if="errores.length" to="/olvide-contrasena" class="block text-center text-sm">
        Solicitar un enlace nuevo
      </ULink>
    </form>
  </UCard>
</template>
