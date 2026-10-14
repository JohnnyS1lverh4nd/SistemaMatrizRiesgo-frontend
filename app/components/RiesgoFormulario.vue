<script setup lang="ts">
import type { CatalogoActivable, EscalaNivel, EstadoTratamiento, Item, MatrizCalorCelda, NivelRiesgo, Riesgo } from '~/types/api'

/**
 * Alta / edición de un riesgo en un panel lateral. Los campos siguen las
 * columnas del Excel institucional. El nivel definitivo lo calcula Laravel;
 * aquí solo se muestra una vista previa leyendo la matriz de calor.
 */
export interface CatalogosRiesgo {
  factores: CatalogoActivable[]
  periodicidades: CatalogoActivable[]
  niveles: NivelRiesgo[]
  escalas: EscalaNivel[]
  celdas: MatrizCalorCelda[]
}

const props = defineProps<{
  matrizId: number
  riesgo: Riesgo | null
  catalogos: CatalogosRiesgo
  // Consulta (roles de solo lectura o edición publicada): campos deshabilitados.
  soloLectura?: boolean
}>()

const emit = defineEmits<{ guardado: [riesgo: Riesgo] }>()
const abierto = defineModel<boolean>('open', { default: false })

const { api } = useApi()
const toast = useToast()

function estadoInicial() {
  const r = props.riesgo
  return {
    actividad: r?.actividad ?? '',
    descripcion: r?.descripcion ?? '',
    factor_ids: r?.factores.map(f => f.id) ?? [] as number[],
    causas: r?.causas ?? '',
    control_actual: r?.control_actual ?? '',
    probabilidad: r?.probabilidad ?? undefined as number | undefined,
    impacto: r?.impacto ?? undefined as number | undefined,
    ajustar: r?.nivel_ajustado != null,
    nivel_ajustado_id: r?.nivel_ajustado?.id ?? undefined as number | undefined,
    justificacion_ajuste: r?.justificacion_ajuste ?? '',
    sintoma: r?.sintoma ?? '',
    tratamiento: r?.tratamiento ?? '',
    responsable: r?.responsable ?? '',
    periodicidad_id: r?.periodicidad?.id ?? undefined as number | undefined,
    estado_tratamiento: r?.estado_tratamiento ?? 'pendiente' as EstadoTratamiento,
  }
}

const estado = reactive(estadoInicial())
const errores = ref<ErroresPorCampo>({})
const errorGeneral = ref<string | null>(null)
const guardando = ref(false)

watch(abierto, (valor) => {
  if (valor) {
    Object.assign(estado, estadoInicial())
    errores.value = {}
    errorGeneral.value = null
  }
}, { immediate: true })

// --- Opciones de los selectores ---------------------------------------------

// Un factor ya asignado pero hoy inactivo se sigue mostrando para no perderlo al editar.
const opcionesFactores = computed(() => {
  const activos = props.catalogos.factores.map(f => ({ label: f.nombre, id: f.id }))
  const heredados = (props.riesgo?.factores ?? [])
    .filter(f => !activos.some(a => a.id === f.id))
    .map(f => ({ label: `${f.nombre} (inactivo)`, id: f.id }))
  return [...activos, ...heredados]
})

function opcionesEscala(tipo: 'probabilidad' | 'impacto') {
  return props.catalogos.escalas
    .filter(e => e.tipo === tipo)
    .map(e => ({ label: `${e.valor} – ${e.nombre}`, value: e.valor }))
}

const opcionesPeriodicidad = computed(() => props.catalogos.periodicidades.map(p => ({ label: p.nombre, value: p.id })))
const opcionesNiveles = computed(() => props.catalogos.niveles.map(n => ({ label: n.nombre, value: n.id })))

// Vista previa: celda P × I de la matriz de calor configurada.
const nivelPrevisto = computed<NivelRiesgo | null>(() => {
  if (!estado.probabilidad || !estado.impacto) {
    return null
  }
  return props.catalogos.celdas.find(c => c.probabilidad === estado.probabilidad && c.impacto === estado.impacto)?.nivel_riesgo ?? null
})

// --- Guardar ----------------------------------------------------------------

function cuerpo() {
  const texto = (valor: string) => (valor.trim() === '' ? null : valor)

  return {
    actividad: estado.actividad,
    descripcion: estado.descripcion,
    factor_ids: estado.factor_ids,
    causas: texto(estado.causas),
    control_actual: texto(estado.control_actual),
    probabilidad: estado.probabilidad ?? null,
    impacto: estado.impacto ?? null,
    nivel_ajustado_id: estado.ajustar ? (estado.nivel_ajustado_id ?? null) : null,
    justificacion_ajuste: estado.ajustar ? texto(estado.justificacion_ajuste) : null,
    sintoma: texto(estado.sintoma),
    tratamiento: texto(estado.tratamiento),
    responsable: texto(estado.responsable),
    periodicidad_id: estado.periodicidad_id ?? null,
    estado_tratamiento: estado.estado_tratamiento,
  }
}

async function guardar() {
  errores.value = {}
  errorGeneral.value = null
  guardando.value = true

  try {
    const respuesta = props.riesgo
      ? await api<Item<Riesgo>>(`/api/riesgos/${props.riesgo.id}`, { method: 'PUT', body: cuerpo() })
      : await api<Item<Riesgo>>(`/api/matrices/${props.matrizId}/riesgos`, { method: 'POST', body: cuerpo() })

    toast.add({ title: props.riesgo ? 'Riesgo actualizado' : 'Riesgo registrado', color: 'success', icon: 'i-lucide-check' })
    emit('guardado', respuesta.data)
    abierto.value = false
  } catch (error) {
    const validacion = erroresDeValidacion(error)
    if (validacion) {
      errores.value = validacion
      errorGeneral.value = 'Revise los campos marcados.'
    } else {
      errorGeneral.value = mensajeDeErrorApi(error)
    }
  } finally {
    guardando.value = false
  }
}

function errorDe(campo: string): string | undefined {
  return Object.entries(errores.value)
    .find(([nombre]) => nombre === campo || nombre.startsWith(`${campo}.`))?.[1]?.[0]
}
</script>

<template>
  <USlideover
    v-model:open="abierto"
    :title="riesgo ? `Riesgo ${riesgo.orden}` : 'Nuevo riesgo'"
    description="Columnas de la matriz institucional RT-01-NI-ONA-156."
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <form id="formulario-riesgo" class="space-y-6" novalidate @submit.prevent="guardar">
        <UAlert v-if="errorGeneral" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorGeneral" />

        <!-- fieldset disabled: deshabilita todos los controles en modo consulta. -->
        <fieldset :disabled="soloLectura" class="min-w-0 space-y-6">

        <section class="space-y-4">
          <h3 class="text-sm font-semibold uppercase text-muted">
            Identificación del riesgo
          </h3>
          <UFormField label="Actividad" name="actividad" :error="errorDe('actividad')" required>
            <UTextarea v-model="estado.actividad" autoresize :rows="2" class="w-full" />
          </UFormField>
          <UFormField label="Riesgo" name="descripcion" :error="errorDe('descripcion')" required>
            <UTextarea v-model="estado.descripcion" autoresize :rows="2" class="w-full" />
          </UFormField>
          <UFormField label="Factores" name="factor_ids" :error="errorDe('factor_ids')" help="Puede marcar varios (p. ej. Personal y Tecnológico).">
            <UCheckboxGroup v-model="estado.factor_ids" :items="opcionesFactores" value-key="id" orientation="horizontal" class="flex-wrap" />
          </UFormField>
          <UFormField label="Causas" name="causas" :error="errorDe('causas')">
            <UTextarea v-model="estado.causas" autoresize class="w-full" />
          </UFormField>
          <UFormField label="Control actual" name="control_actual" :error="errorDe('control_actual')">
            <UTextarea v-model="estado.control_actual" autoresize class="w-full" />
          </UFormField>
        </section>

        <section class="space-y-4">
          <h3 class="text-sm font-semibold uppercase text-muted">
            Análisis del riesgo
          </h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Probabilidad" name="probabilidad" :error="errorDe('probabilidad')">
              <USelect v-model="estado.probabilidad" :items="opcionesEscala('probabilidad')" placeholder="Sin evaluar" class="w-full" />
            </UFormField>
            <UFormField label="Impacto" name="impacto" :error="errorDe('impacto')">
              <USelect v-model="estado.impacto" :items="opcionesEscala('impacto')" placeholder="Sin evaluar" class="w-full" />
            </UFormField>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-muted">Nivel según la matriz de calor:</span>
            <NivelRiesgoBadge :nivel="nivelPrevisto" />
            <span v-if="!nivelPrevisto" class="text-muted">(un riesgo sin evaluar no permite publicar la edición)</span>
          </div>

          <USwitch v-model="estado.ajustar" label="Ajustar el nivel manualmente" :disabled="!nivelPrevisto" />

          <div v-if="estado.ajustar" class="grid gap-4 rounded-md border border-default p-4">
            <UFormField label="Nivel ajustado" name="nivel_ajustado_id" :error="errorDe('nivel_ajustado_id')" required>
              <USelect v-model="estado.nivel_ajustado_id" :items="opcionesNiveles" placeholder="Seleccione el nivel" class="w-full" />
            </UFormField>
            <UFormField label="Justificación del ajuste" name="justificacion_ajuste" :error="errorDe('justificacion_ajuste')" required>
              <UTextarea v-model="estado.justificacion_ajuste" autoresize class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Síntoma" name="sintoma" :error="errorDe('sintoma')">
            <UTextarea v-model="estado.sintoma" autoresize class="w-full" />
          </UFormField>
        </section>

        <section class="space-y-4">
          <h3 class="text-sm font-semibold uppercase text-muted">
            Seguimiento y control
          </h3>
          <UFormField label="Tratamiento" name="tratamiento" :error="errorDe('tratamiento')">
            <UTextarea v-model="estado.tratamiento" autoresize class="w-full" />
          </UFormField>
          <UFormField label="Responsable" name="responsable" :error="errorDe('responsable')" help="Unidades o cargos, como en el Excel.">
            <UTextarea v-model="estado.responsable" autoresize :rows="2" class="w-full" />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Periodicidad" name="periodicidad_id" :error="errorDe('periodicidad_id')">
              <USelect v-model="estado.periodicidad_id" :items="opcionesPeriodicidad" placeholder="Sin definir" class="w-full" />
            </UFormField>
            <UFormField label="Estado del tratamiento" name="estado_tratamiento" :error="errorDe('estado_tratamiento')">
              <USelect v-model="estado.estado_tratamiento" :items="OPCIONES_ESTADO_TRATAMIENTO" class="w-full" />
            </UFormField>
          </div>
        </section>
        </fieldset>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton :label="soloLectura ? 'Cerrar' : 'Cancelar'" color="neutral" variant="ghost" @click="abierto = false" />
        <UButton
          v-if="!soloLectura"
          type="submit" form="formulario-riesgo" :label="riesgo ? 'Guardar cambios' : 'Registrar riesgo'" :loading="guardando" />
      </div>
    </template>
  </USlideover>
</template>
