<script setup lang="ts">
const { login, logout, user } = useAuth()

const email = ref('admin@infotep.test')
const password = ref('password123')
const errorMessage = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
  errorMessage.value = null
  loading.value = true

  try {
    await login(email.value, password.value)
  } catch (e) {
    errorMessage.value = 'No se pudo iniciar sesión. Revisa la consola/Network.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  loading.value = true
  try {
    await logout()
  } catch (e) {
    errorMessage.value = 'No se pudo cerrar sesión. Revisa la consola/Network.'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="max-width: 320px; margin: 4rem auto; font-family: sans-serif;">
    <h1>Login — SistemaMatrizRiesgo</h1>

    <form @submit.prevent="handleSubmit">
      <div>
        <label>Email</label><br>
        <input v-model="email" type="email">
      </div>
      <div style="margin-top: 0.5rem;">
        <label>Password</label><br>
        <input v-model="password" type="password">
      </div>
      <button type="submit" :disabled="loading" style="margin-top: 1rem;">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>

    <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>

    <div v-if="user" style="margin-top: 2rem; padding: 1rem; background: #eee;">
      <strong>Usuario autenticado:</strong>
      <pre>{{ user }}</pre>
      <button @click="handleLogout" :disabled="loading">
        {{ loading ? 'Saliendo...' : 'Cerrar sesión' }}
      </button>
    </div>
  </div>
</template>