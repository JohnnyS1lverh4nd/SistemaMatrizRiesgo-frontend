<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

/**
 * Ayuda: reactivar el recorrido guiado y una guía rápida con los mismos
 * textos del recorrido (utils/pasosTour.ts), filtrados por el rol del usuario.
 */
const { user, sesionMinutos } = useAuth()
const { iniciar, activo } = useRecorridoGuiado()

const estado = computed(() => user.value?.tour?.estado ?? null)

const textoEstado = computed(() => {
  const fecha = user.value?.tour?.actualizado_at
    ? new Date(user.value.tour.actualizado_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  switch (estado.value) {
    case 'completado':
      return fecha ? `Lo completó el ${fecha}.` : 'Ya lo completó.'
    case 'omitido':
      return fecha ? `Lo omitió el ${fecha}.` : 'Lo omitió.'
    default:
      return 'Todavía no lo ha hecho.'
  }
})

// Pantalla de cada tema, para ir directamente desde la guía.
const RUTAS: Record<string, { to: string, etiqueta: string }> = {
  inicio: { to: '/', etiqueta: 'Ir al Inicio' },
  matrices: { to: '/matrices', etiqueta: 'Ir a Matrices de riesgo' },
  riesgos: { to: '/matrices', etiqueta: 'Ir a Matrices de riesgo' },
  seguimientos: { to: '/matrices', etiqueta: 'Ir a Matrices de riesgo' },
  reportes: { to: '/reportes', etiqueta: 'Ir a Reportes' },
  historial: { to: '/historial', etiqueta: 'Ir al Historial de movimientos' },
  auditoria: { to: '/auditoria', etiqueta: 'Ir a Auditoría' },
  administracion: { to: '/departamentos', etiqueta: 'Ir a Departamentos' },
  perfil: { to: '/perfil', etiqueta: 'Ir a mi Perfil' },
}

const guia = computed<(AccordionItem & { id: string })[]>(() => pasosTour({
  rol: user.value?.role?.slug,
  nombreRol: user.value?.role?.nombre,
  minutosSesion: sesionMinutos.value,
})
  .filter(paso => !['bienvenida', 'ayuda', 'fin'].includes(paso.id))
  .map(paso => ({ id: paso.id, label: paso.titulo, content: paso.descripcion })))
</script>

<template>
  <UDashboardPanel id="ayuda">
    <template #header>
      <EncabezadoPanel title="Ayuda" />
    </template>

    <template #body>
      <div class="mx-auto grid w-full max-w-3xl gap-4">
        <UCard>
          <template #header>
            <h2 class="flex items-center gap-2 font-semibold">
              <UIcon name="i-lucide-compass" class="size-5 text-primary" />
              Recorrido guiado
            </h2>
          </template>

          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="space-y-1">
              <p class="text-sm">
                Le muestra, paso a paso, dónde está cada función que su rol puede usar.
              </p>
              <p class="text-sm text-muted">
                {{ textoEstado }}
              </p>
            </div>
            <UButton
              :label="estado ? 'Volver a iniciar recorrido guiado' : 'Iniciar recorrido guiado'"
              icon="i-lucide-play"
              :loading="activo"
              @click="iniciar"
            />
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="flex items-center gap-2 font-semibold">
              <UIcon name="i-lucide-book-open" class="size-5 text-primary" />
              Guía rápida
            </h2>
            <p class="mt-1 text-sm text-muted">
              Lo que puede hacer con su rol{{ user?.role ? ` (${user.role.nombre})` : '' }}.
            </p>
          </template>

          <UAccordion :items="guia" type="multiple">
            <template #content="{ item }">
              <div class="space-y-2 pb-3 text-sm text-muted">
                <p>{{ item.content }}</p>
                <ULink
                  v-if="RUTAS[item.id]"
                  :to="RUTAS[item.id]!.to"
                  class="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  {{ RUTAS[item.id]!.etiqueta }}
                  <UIcon name="i-lucide-arrow-right" class="size-4" />
                </ULink>
              </div>
            </template>
          </UAccordion>
        </UCard>

        <UAlert
          color="neutral"
          variant="subtle"
          icon="i-lucide-life-buoy"
          title="¿Necesita más ayuda?"
          description="Consulte el manual de usuario o contacte al Administrador del sistema."
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
