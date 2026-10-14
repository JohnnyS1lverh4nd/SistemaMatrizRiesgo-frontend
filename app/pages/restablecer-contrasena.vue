<script setup lang="ts">
definePageMeta({ public: true })

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
  <main style="max-width: 320px; margin: 4rem auto; font-family: sans-serif;">
    <h1>Nueva contraseña</h1>

    <p v-if="enlaceIncompleto" role="alert" style="color: #b91c1c;">
      El enlace está incompleto. Solicita uno nuevo desde
      <NuxtLink to="/olvide-contrasena">recuperar contraseña</NuxtLink>.
    </p>

    <template v-else-if="restablecida">
      <p role="status" style="color: #15803d;">Tu contraseña se actualizó correctamente.</p>
      <NuxtLink to="/login">Iniciar sesión</NuxtLink>
    </template>

    <form v-else @submit.prevent="handleSubmit">
      <p>Cuenta: <strong>{{ email }}</strong></p>
      <div>
        <label for="password">Nueva contraseña</label><br>
        <input id="password" v-model="password" type="password" autocomplete="new-password" required>
      </div>
      <div style="margin-top: 0.5rem;">
        <label for="password_confirmation">Confirmar contraseña</label><br>
        <input
          id="password_confirmation"
          v-model="passwordConfirmation"
          type="password"
          autocomplete="new-password"
          required
        >
      </div>
      <button type="submit" :disabled="loading" style="margin-top: 1rem;">
        {{ loading ? 'Guardando...' : 'Guardar contraseña' }}
      </button>

      <ul v-if="errores.length" role="alert" style="color: #b91c1c;">
        <li v-for="mensaje in errores" :key="mensaje">{{ mensaje }}</li>
      </ul>
      <p v-if="errores.length">
        <NuxtLink to="/olvide-contrasena">Solicitar un enlace nuevo</NuxtLink>
      </p>
    </form>
  </main>
</template>
