<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { ROL_ADMINISTRADOR, ROL_AUDITOR, ROLES_HISTORIAL } from '~/types/api'

// La navegación solo oculta lo que el rol no usa; la API decide los permisos.
const { user, logout } = useAuth()
const router = useRouter()

const esAdministrador = computed(() => user.value?.role?.slug === ROL_ADMINISTRADOR)
const veAuditoria = computed(() => esAdministrador.value || user.value?.role?.slug === ROL_AUDITOR)
const veHistorial = computed(() => ROLES_HISTORIAL.includes(user.value?.role?.slug ?? ''))

const principal = computed<NavigationMenuItem[]>(() => [
  { label: 'Inicio', icon: 'i-lucide-house', to: '/' },
  { label: 'Matrices de riesgo', icon: 'i-lucide-table-2', to: '/matrices' },
  { label: 'Reportes', icon: 'i-lucide-file-search', to: '/reportes' },
  ...(veHistorial.value ? [{ label: 'Historial de movimientos', icon: 'i-lucide-history', to: '/historial' }] : []),
  ...(esAdministrador.value
    ? [
        { label: 'Departamentos', icon: 'i-lucide-building-2', to: '/departamentos' },
        { label: 'Catálogos', icon: 'i-lucide-list-checks', to: '/catalogos' },
        { label: 'Usuarios', icon: 'i-lucide-users', to: '/usuarios' },
      ]
    : []),
  ...(veAuditoria.value ? [{ label: 'Auditoría', icon: 'i-lucide-scroll-text', to: '/auditoria' }] : []),
])

// Ayuda: guía rápida y "Volver a iniciar recorrido guiado". Todos los roles.
const ayuda: NavigationMenuItem[] = [
  { label: 'Ayuda', icon: 'i-lucide-circle-help', to: '/ayuda' },
]

// El acceso a Perfil (datos personales y seguridad de la cuenta, incluido el
// cambio de contraseña) está arriba a la derecha de cada pantalla:
// componente EncabezadoPanel.

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
        <UIcon name="i-lucide-shield-alert" class="size-5 shrink-0 text-secondary" />
        <span v-if="!collapsed" class="truncate font-semibold">Matrices de Riesgo</span>
      </template>

      <template #default="{ collapsed }">
        <!-- data-tour: elementos que señala el recorrido guiado (utils/pasosTour.ts). -->
        <UNavigationMenu :collapsed="collapsed" :items="principal" orientation="vertical" data-tour="menu" />
        <UNavigationMenu :collapsed="collapsed" :items="ayuda" orientation="vertical" class="mt-auto" data-tour="ayuda" />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex w-full flex-col gap-1">
          <p v-if="!collapsed && user" class="truncate text-xs text-muted">
            {{ user.name }} · {{ user.role?.nombre ?? 'Sin rol' }}
          </p>
          <!-- Modo claro / oscuro: la preferencia se guarda en el navegador. -->
          <div class="flex items-center gap-2 px-2.5 py-1.5" :class="collapsed ? 'justify-center px-0' : ''">
            <UColorModeSwitch />
            <span v-if="!collapsed" class="text-sm text-muted">Modo oscuro</span>
          </div>
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

    <!-- Primer ingreso: invita al recorrido guiado (no bloquea). -->
    <InvitacionTour />
  </UDashboardGroup>
</template>
