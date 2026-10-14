import type { Coleccion } from '~/types/api'

/**
 * Carga una colección de la API ({ data: [...] }) con estado de carga y error.
 * La consulta puede ser reactiva: al cambiar, hay que llamar a recargar().
 */
export function useListado<T>(url: MaybeRefOrGetter<string>, query?: MaybeRefOrGetter<Record<string, unknown>>) {
  const { api } = useApi()

  const items = ref<T[]>([]) as Ref<T[]>
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function recargar() {
    cargando.value = true
    error.value = null

    try {
      const respuesta = await api<Coleccion<T>>(toValue(url), { query: toValue(query) })
      items.value = respuesta.data
    } catch (e) {
      error.value = mensajeDeErrorApi(e)
    } finally {
      cargando.value = false
    }
  }

  onMounted(recargar)

  return { items, cargando, error, recargar }
}
