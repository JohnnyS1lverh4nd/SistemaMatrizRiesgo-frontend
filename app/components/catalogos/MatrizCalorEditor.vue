<script setup lang="ts">
import type { Item, MatrizCalorCelda, NivelRiesgo } from '~/types/api'

/**
 * Matriz de calor 4 × 4 editable: cada celda (Probabilidad × Impacto) define
 * el nivel de riesgo. Valores iniciales: regla de la suma P + I
 * (docs/reglas-nivel-riesgo.md en el backend). Laravel calcula el nivel.
 */
const { api } = useApi()
const toast = useToast()

const { items: celdas, cargando, error, recargar } = useListado<MatrizCalorCelda>('/api/matriz-calor-celdas')
const { items: niveles, recargar: recargarNiveles } = useListado<NivelRiesgo>('/api/niveles-riesgo')

const guardando = ref<number | null>(null)

const VALORES = [1, 2, 3, 4]
// Probabilidad alta arriba, como en una matriz de calor convencional.
const filas = [...VALORES].reverse()

const opciones = computed(() => niveles.value.map(n => ({ label: n.nombre, value: n.id })))

function celda(probabilidad: number, impacto: number) {
  return celdas.value.find(c => c.probabilidad === probabilidad && c.impacto === impacto)
}

async function cambiarNivel(actual: MatrizCalorCelda, nivelId: number) {
  if (nivelId === actual.nivel_riesgo.id) {
    return
  }

  guardando.value = actual.id
  try {
    const respuesta = await api<Item<MatrizCalorCelda>>(`/api/matriz-calor-celdas/${actual.id}`, {
      method: 'PUT',
      body: { nivel_riesgo_id: nivelId },
    })
    celdas.value = celdas.value.map(c => (c.id === actual.id ? respuesta.data : c))
    toast.add({
      title: `P${actual.probabilidad} × I${actual.impacto} → ${respuesta.data.nivel_riesgo.nombre}`,
      color: 'success',
      icon: 'i-lucide-check',
    })
  } catch (e) {
    toast.add({ title: mensajeDeErrorApi(e), color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    guardando.value = null
  }
}

// Llamado por la página cuando cambian nombres o colores de los niveles.
async function refrescar() {
  await Promise.all([recargar(), recargarNiveles()])
}

defineExpose({ refrescar })
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">
      Elija el nivel de riesgo de cada combinación. Los cambios se aplican a los riesgos que se evalúen a partir de ahora.
    </p>

    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

    <div v-if="cargando && !celdas.length" class="text-sm text-muted">
      Cargando…
    </div>

    <div v-else class="overflow-x-auto">
      <table class="border-separate border-spacing-1">
        <caption class="sr-only">
          Matriz de calor: probabilidad en filas, impacto en columnas
        </caption>
        <thead>
          <tr>
            <th scope="col" class="p-2 text-left text-xs text-muted">
              Probabilidad ↓ / Impacto →
            </th>
            <th v-for="i in VALORES" :key="i" scope="col" class="p-2 text-sm font-semibold">
              {{ i }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filas" :key="p">
            <th scope="row" class="p-2 text-sm font-semibold">
              {{ p }}
            </th>
            <td
              v-for="i in VALORES"
              :key="i"
              class="min-w-36 rounded-md p-2"
              :style="{ backgroundColor: celda(p, i)?.nivel_riesgo.color }"
            >
              <USelect
                v-if="celda(p, i)"
                :model-value="celda(p, i)!.nivel_riesgo.id"
                :items="opciones"
                :loading="guardando === celda(p, i)!.id"
                :aria-label="`Nivel para probabilidad ${p} e impacto ${i}`"
                class="w-full"
                @update:model-value="(valor) => cambiarNivel(celda(p, i)!, Number(valor))"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
