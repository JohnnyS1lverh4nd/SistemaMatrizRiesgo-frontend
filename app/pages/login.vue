<script setup lang="ts">
import { FetchError } from 'ofetch'

definePageMeta({ public: true, layout: 'publico' })

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
  <UCard>
    <template #header>
      <h1 class="text-lg font-semibold">
        Iniciar sesión
      </h1>
    </template>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <UAlert v-if="motivoCierre" color="warning" variant="subtle" icon="i-lucide-clock" :title="motivoCierre" />
      <UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorMessage" />

      <UFormField label="Correo electrónico" name="email" required>
        <UInput v-model="email" type="email" autocomplete="username" required class="w-full" />
      </UFormField>
      <UFormField label="Contraseña" name="password" required>
        <UInput v-model="password" type="password" autocomplete="current-password" required class="w-full" />
      </UFormField>

      <UButton type="submit" label="Entrar" :loading="loading" block />
    </form>

    <template #footer>
      <ULink to="/olvide-contrasena" class="text-sm">
        ¿Olvidaste tu contraseña?
      </ULink>
    </template>
  </UCard>
</template>
