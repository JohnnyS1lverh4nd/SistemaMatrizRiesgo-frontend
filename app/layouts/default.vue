<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { ROL_ADMINISTRADOR, ROL_AUDITOR } from '~/types/api'

// La navegación solo oculta lo que el rol no usa; la API decide los permisos.
const { user, logout } = useAuth()
const router = useRouter()

const esAdministrador = computed(() => user.value?.role?.slug === ROL_ADMINISTRADOR)
const veAuditoria = computed(() => esAdministrador.value || user.value?.role?.slug === ROL_AUDITOR)

const principal = computed<NavigationMenuItem[]>(() => [
  { label: 'Inicio', icon: 'i-lucide-house', to: '/' },
  { label: 'Matrices de riesgo', icon: 'i-lucide-table-2', to: '/matrices' },
  { label: 'Reportes', icon: 'i-lucide-file-search', to: '/reportes' },
  ...(esAdministrador.value
    ? [
        { label: 'Departamentos', icon: 'i-lucide-building-2', to: '/departamentos' },
        { label: 'Catálogos', icon: 'i-lucide-list-checks', to: '/catalogos' },
        { label: 'Usuarios', icon: 'i-lucide-users', to: '/usuarios' },
      ]
    : []),
  ...(veAuditoria.value ? [{ label: 'Auditoría', icon: 'i-lucide-scroll-text', to: '/auditoria' }] : []),
])

const cuenta = computed<NavigationMenuItem[]>(() => [
  { label: 'Cambiar contraseña', icon: 'i-lucide-key-round', to: '/cambiar-contrasena' },
])

async function cerrarSesion() {
  try {
    await logout()
  } finally {
    await router.push('/login')
  }
}
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable :default-size="18">
      <template #header="{ collapsed }">
        <UIcon name="i-lucide-shield-alert" class="size-5 shrink-0 text-primary" />
        <span v-if="!collapsed" class="truncate font-semibold">Matrices de Riesgo</span>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu :collapsed="collapsed" :items="principal" orientation="vertical" />
        <UNavigationMenu :collapsed="collapsed" :items="cuenta" orientation="vertical" class="mt-auto" />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex w-full flex-col gap-1">
          <p v-if="!collapsed && user" class="truncate text-xs text-muted">
            {{ user.name }} · {{ user.role?.nombre ?? 'Sin rol' }}
          </p>
          <UButton
            icon="i-lucide-log-out"
            :label="collapsed ? undefined : 'Cerrar sesión'"
            color="neutral"
            variant="ghost"
            :square="collapsed"
            block
            @click="cerrarSesion"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
