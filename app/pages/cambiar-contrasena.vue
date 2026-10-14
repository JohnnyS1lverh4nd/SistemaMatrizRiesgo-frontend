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
  <main class="pagina">
    <p><NuxtLink to="/">← Inicio</NuxtLink></p>
    <h1>Cambiar contraseña</h1>

    <p v-if="guardada" role="status" class="exito">Tu contraseña se actualizó correctamente.</p>
    <p v-if="errorGeneral" role="alert" class="error">{{ errorGeneral }}</p>

    <form class="formulario" novalidate @submit.prevent="guardar">
      <div class="campo">
        <label for="current_password">Contraseña actual</label>
        <input
          id="current_password"
          v-model="form.current_password"
          type="password"
          autocomplete="current-password"
          :aria-invalid="!!errores.current_password"
        >
        <small v-for="mensaje in errores.current_password" :key="mensaje" class="error">{{ mensaje }}</small>
      </div>

      <div class="campo">
        <label for="password">Nueva contraseña</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          :aria-invalid="!!errores.password"
        >
        <small v-for="mensaje in errores.password" :key="mensaje" class="error">{{ mensaje }}</small>
      </div>

      <div class="campo">
        <label for="password_confirmation">Confirmar nueva contraseña</label>
        <input id="password_confirmation" v-model="form.password_confirmation" type="password" autocomplete="new-password">
      </div>

      <button type="submit" :disabled="guardando">
        {{ guardando ? 'Guardando…' : 'Cambiar contraseña' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.pagina { max-width: 28rem; margin: 2rem auto; padding: 0 1rem; font-family: sans-serif; }
.formulario { display: grid; gap: 1rem; }
.campo { display: grid; gap: 0.25rem; }
.error { color: #b91c1c; }
.exito { color: #15803d; }
</style>
