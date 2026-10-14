<script setup lang="ts">
definePageMeta({ public: true })

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
  <main style="max-width: 320px; margin: 4rem auto; font-family: sans-serif;">
    <h1>Recuperar contraseña</h1>
    <p>Indica tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>

    <form @submit.prevent="handleSubmit">
      <label for="email">Correo electrónico</label><br>
      <input id="email" v-model="email" type="email" autocomplete="username" required>
      <br>
      <button type="submit" :disabled="loading" style="margin-top: 1rem;">
        {{ loading ? 'Enviando...' : 'Enviar enlace' }}
      </button>
    </form>

    <p v-if="mensaje" role="status" style="color: #15803d;">{{ mensaje }}</p>
    <p v-if="errorMessage" role="alert" style="color: #b91c1c;">{{ errorMessage }}</p>

    <p style="margin-top: 2rem;">
      <NuxtLink to="/login">Volver a iniciar sesión</NuxtLink>
    </p>
  </main>
</template>
