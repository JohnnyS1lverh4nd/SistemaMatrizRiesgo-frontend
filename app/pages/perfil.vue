<script setup lang="ts">
import type { Form } from '@nuxt/ui'
import type { Item, User } from '~/types/api'
import { ROL_ADMINISTRADOR, ROL_AUDITOR } from '~/types/api'

/**
 * Mi perfil: datos del usuario de la sesión (GET /api/user, ya cargado por
 * useAuth) y sus acciones personales. Solo el nombre es editable (PUT
 * /api/perfil); el correo, el rol, los departamentos y el estado de la
 * cuenta los gestiona el Administrador. La contraseña se cambia aquí, en
 * Seguridad de la cuenta: es el único acceso a esa operación.
 */
const { user } = useAuth()
const { api } = useApi()
const toast = useToast()
const route = useRoute()

// --- Información personal: nombre ------------------------------------------

const formulario = useTemplateRef<Form<typeof estado>>('formulario')
const estado = reactive({ name: user.value?.name ?? '' })
const guardando = ref(false)
const errorGeneral = ref<string | null>(null)

const nombreCambiado = computed(() => estado.name.trim() !== '' && estado.name.trim() !== user.value?.name)

async function guardarNombre() {
  errorGeneral.value = null
  guardando.value = true

  try {
    const respuesta = await api<Item<User>>('/api/perfil', { method: 'PUT', body: { name: estado.name } })
    // Actualiza el estado global: el pie del menú muestra el nombre nuevo.
    user.value = respuesta.data
    estado.name = respuesta.data.name
    toast.add({ title: 'Nombre actualizado', color: 'success', icon: 'i-lucide-check' })
  } catch (error) {
    const validacion = erroresDeValidacion(error)
    if (validacion?.name) {
      formulario.value?.setErrors([{ name: 'name', message: validacion.name[0] ?? '' }])
    } else {
      errorGeneral.value = mensajeDeErrorApi(error)
    }
  } finally {
    guardando.value = false
  }
}

// --- Información institucional ------------------------------------------------

// Administrador, Auditor y Dirección consultan todos los departamentos.
const consultaTodos = computed(() => [ROL_ADMINISTRADOR, ROL_AUDITOR, 'direccion'].includes(user.value?.role?.slug ?? ''))

const fechaAlta = computed(() => user.value?.created_at
  ? new Date(user.value.created_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
  : null)

// Enlaces antiguos a /cambiar-contrasena llegan con #seguridad. El cuerpo del
// panel tiene su propio scroll, así que se desplaza a mano.
onMounted(() => {
  if (route.hash === '#seguridad') {
    nextTick(() => document.getElementById('seguridad')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
})
</script>

<template>
  <UDashboardPanel id="perfil">
    <template #header>
      <EncabezadoPanel title="Mi perfil" />
    </template>

    <template #body>
      <div v-if="user" class="mx-auto grid w-full max-w-3xl gap-4">
        <!-- Información personal -->
        <UCard>
          <template #header>
            <h2 class="flex items-center gap-2 font-semibold">
              <UIcon name="i-lucide-user-round" class="size-5 text-primary" />
              Información personal
            </h2>
          </template>

          <UForm ref="formulario" :state="estado" class="space-y-4" @submit="guardarNombre">
            <UAlert v-if="errorGeneral" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorGeneral" />

            <UFormField label="Nombre completo" name="name" required>
              <UInput v-model="estado.name" autocomplete="name" class="w-full" />
            </UFormField>

            <UFormField label="Correo electrónico" name="email" help="Es su usuario de acceso. Para cambiarlo, contacte al Administrador.">
              <UInput :model-value="user.email" type="email" disabled class="w-full" />
            </UFormField>

            <div class="flex justify-end">
              <UButton type="submit" label="Guardar nombre" :loading="guardando" :disabled="!nombreCambiado" />
            </div>
          </UForm>
        </UCard>

        <!-- Información institucional (solo lectura) -->
        <UCard>
          <template #header>
            <h2 class="flex items-center gap-2 font-semibold">
              <UIcon name="i-lucide-building-2" class="size-5 text-primary" />
              Información institucional
            </h2>
            <p class="mt-1 text-sm text-muted">
              La asigna el Administrador del sistema.
            </p>
          </template>

          <dl class="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-muted">
                Rol
              </dt>
              <dd class="font-medium">
                {{ user.role?.nombre ?? 'Sin rol asignado' }}
              </dd>
            </div>

            <div>
              <dt class="text-sm text-muted">
                Estado de la cuenta
              </dt>
              <dd>
                <EstadoActivo :activo="user.activo" />
              </dd>
            </div>

            <div class="sm:col-span-2">
              <dt class="text-sm text-muted">
                Departamentos asignados
              </dt>
              <dd class="mt-1">
                <div v-if="user.departamentos.length" class="flex flex-wrap gap-2">
                  <UBadge v-for="departamento in user.departamentos" :key="departamento.id" :label="departamento.nombre" color="neutral" variant="subtle" />
                </div>
                <span v-else-if="consultaTodos" class="text-sm">Su rol consulta todos los departamentos.</span>
                <span v-else class="text-sm text-muted">No tiene departamentos asignados.</span>
              </dd>
            </div>

            <div v-if="fechaAlta">
              <dt class="text-sm text-muted">
                Cuenta creada el
              </dt>
              <dd>{{ fechaAlta }}</dd>
            </div>
          </dl>
        </UCard>

        <!-- Seguridad de la cuenta -->
        <UCard id="seguridad" class="scroll-mt-4">
          <template #header>
            <h2 class="flex items-center gap-2 font-semibold">
              <UIcon name="i-lucide-shield-check" class="size-5 text-primary" />
              Seguridad de la cuenta
            </h2>
          </template>

          <h3 class="mb-3 font-medium">
            Cambiar contraseña
          </h3>
          <div class="max-w-md">
            <PerfilCambiarContrasena />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
