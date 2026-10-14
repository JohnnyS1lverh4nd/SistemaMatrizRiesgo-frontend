<script setup lang="ts">
definePageMeta({ public: true, layout: 'publico' })

const { api } = useApi()

const email = ref('')
const mensaje = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
  mensaje.value = null
  errorMessage.value = null
  loading.value = true

  try {
    // La API responde igual exista o no el correo, para no revelar cuentas.
    const response = await api<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })
    mensaje.value = response.message
  } catch (error) {
    errorMessage.value = erroresDeValidacion(error)?.email?.[0] ?? mensajeDeErrorApi(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h1 class="text-lg font-semibold">
        Recuperar contraseña
      </h1>
      <p class="mt-1 text-sm text-muted">
        Indica tu correo y te enviaremos un enlace para crear una nueva contraseña.
      </p>
    </template>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <UAlert v-if="mensaje" color="success" variant="subtle" icon="i-lucide-mail-check" :title="mensaje" />
      <UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorMessage" />

      <UFormField label="Correo electrónico" name="email" required>
        <UInput v-model="email" type="email" autocomplete="username" required class="w-full" />
      </UFormField>

      <UButton type="submit" label="Enviar enlace" :loading="loading" block />
    </form>

    <template #footer>
      <ULink to="/login" class="text-sm">
        Volver a iniciar sesión
      </ULink>
    </template>
  </UCard>
</template>
