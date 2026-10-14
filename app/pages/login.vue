<script setup lang="ts">
import { FetchError } from 'ofetch'

definePageMeta({ public: true })

const { login } = useAuth()
const route = useRoute()

const email = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)
const loading = ref(false)

const MOTIVOS_CIERRE: Record<string, string> = {
  'inactividad': 'Tu sesión se cerró por inactividad. Vuelve a iniciar sesión.',
  'sesion-expirada': 'Tu sesión expiró. Vuelve a iniciar sesión.',
}
const motivoCierre = computed(() =>
  typeof route.query.motivo === 'string' ? MOTIVOS_CIERRE[route.query.motivo] ?? null : null,
)

// Solo rutas internas: evita redirecciones abiertas a otros sitios (?redirect=//evil.com).
function destinoSeguro(valor: unknown): string {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//')
    ? valor
    : '/'
}

function mensajeDeError(error: unknown): string {
  if (error instanceof FetchError) {
    if (error.statusCode === 422) {
      return error.data?.errors?.email?.[0] ?? 'Las credenciales no son válidas.'
    }
    if (error.statusCode === 429) {
      return error.data?.errors?.email?.[0] ?? 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
    }
  }

  return 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
}

async function handleSubmit() {
  errorMessage.value = null
  loading.value = true

  try {
    await login(email.value, password.value)
    await navigateTo(destinoSeguro(route.query.redirect))
  } catch (error) {
    errorMessage.value = mensajeDeError(error)
  } finally {
    password.value = ''
    loading.value = false
  }
}
</script>

<template>
  <main style="max-width: 320px; margin: 4rem auto; font-family: sans-serif;">
    <h1>Iniciar sesión</h1>
    <p>Sistema de Gestión de Matrices de Riesgo</p>

    <p v-if="motivoCierre" role="status" style="color: #92400e;">{{ motivoCierre }}</p>

    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">Correo electrónico</label><br>
        <input id="email" v-model="email" type="email" autocomplete="username" required>
      </div>
      <div style="margin-top: 0.5rem;">
        <label for="password">Contraseña</label><br>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required>
      </div>
      <button type="submit" :disabled="loading" style="margin-top: 1rem;">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>

    <p v-if="errorMessage" role="alert" style="color: #b91c1c;">{{ errorMessage }}</p>

    <p style="margin-top: 2rem;">
      <NuxtLink to="/olvide-contrasena">¿Olvidaste tu contraseña?</NuxtLink>
    </p>
  </main>
</template>
