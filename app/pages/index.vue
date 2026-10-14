<script setup lang="ts">
import { ROL_ADMINISTRADOR } from '~/types/api'

const { user, logout } = useAuth()

const saliendo = ref(false)

async function handleLogout() {
  saliendo.value = true
  try {
    await logout()
  } finally {
    saliendo.value = false
    await navigateTo('/login')
  }
}
</script>

<template>
  <main v-if="user" style="max-width: 640px; margin: 4rem auto; font-family: sans-serif;">
    <h1>Bienvenido, {{ user.name }}</h1>
    <p>Rol: {{ user.role?.nombre ?? 'Sin rol asignado' }}</p>

    <template v-if="user.departamentos.length">
      <p>Departamentos asignados:</p>
      <ul>
        <li v-for="departamento in user.departamentos" :key="departamento.id">
          {{ departamento.nombre }}
        </li>
      </ul>
    </template>

    <nav v-if="user.role?.slug === ROL_ADMINISTRADOR" style="margin-bottom: 1rem;">
      <NuxtLink to="/usuarios">Gestionar usuarios</NuxtLink>
    </nav>

    <button :disabled="saliendo" @click="handleLogout">
      {{ saliendo ? 'Saliendo...' : 'Cerrar sesión' }}
    </button>
  </main>
</template>
