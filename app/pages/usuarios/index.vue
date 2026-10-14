<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Paginado, User } from '~/types/api'

definePageMeta({ middleware: 'admin' })

const { api } = useApi()
const { user: actual } = useAuth()
const { alternar, procesando } = useAlternarActivo<User>()

const usuarios = ref<User[]>([])
const pagina = ref(1)
const porPagina = ref(25)
const total = ref(0)
const cargando = ref(false)
const errorGeneral = ref<string | null>(null)

const columnas: TableColumn<User>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'email', header: 'Correo' },
  { id: 'rol', header: 'Rol' },
  { id: 'departamentos', header: 'Departamentos' },
  { accessorKey: 'activo', header: 'Estado' },
  { id: 'acciones', header: '' },
]

async function cargar() {
  cargando.value = true
  errorGeneral.value = null

  try {
    const respuesta = await api<Paginado<User>>('/api/users', { query: { page: pagina.value } })
    usuarios.value = respuesta.data
    porPagina.value = respuesta.meta.per_page
    total.value = respuesta.meta.total
  } catch (error) {
    errorGeneral.value = mensajeDeErrorApi(error)
  } finally {
    cargando.value = false
  }
}

async function alternarEstado(usuario: User) {
  const actualizado = await alternar(`/api/users/${usuario.id}`, usuario)
  if (actualizado) {
    usuarios.value = usuarios.value.map(u => (u.id === usuario.id ? actualizado : u))
  }
}

watch(pagina, cargar)
onMounted(cargar)
</script>

<template>
  <UDashboardPanel id="usuarios">
    <template #header>
      <UDashboardNavbar title="Usuarios">
        <template #right>
          <UButton to="/usuarios/nuevo" icon="i-lucide-user-plus" label="Nuevo usuario" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert v-if="errorGeneral" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorGeneral" />

      <UTable :data="usuarios" :columns="columnas" :loading="cargando" empty="No hay usuarios.">
        <template #rol-cell="{ row }">
          {{ row.original.role?.nombre ?? 'Sin rol' }}
        </template>
        <template #departamentos-cell="{ row }">
          <span class="line-clamp-2 whitespace-normal">
            {{ row.original.departamentos.map(d => d.nombre).join(', ') || '—' }}
          </span>
        </template>
        <template #activo-cell="{ row }">
          <EstadoActivo :activo="row.original.activo" />
        </template>
        <template #acciones-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton :to="`/usuarios/${row.original.id}`" icon="i-lucide-pencil" label="Editar" color="neutral" variant="ghost" size="sm" />
            <!-- La API impide que un administrador se desactive a sí mismo. -->
            <UButton
              v-if="row.original.id !== actual?.id"
              :icon="row.original.activo ? 'i-lucide-user-x' : 'i-lucide-user-check'"
              :label="row.original.activo ? 'Desactivar' : 'Reactivar'"
              color="neutral"
              variant="ghost"
              size="sm"
              :loading="procesando === row.original.id"
              @click="alternarEstado(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div v-if="total > porPagina" class="flex justify-end">
        <UPagination v-model:page="pagina" :total="total" :items-per-page="porPagina" />
      </div>
    </template>
  </UDashboardPanel>
</template>
