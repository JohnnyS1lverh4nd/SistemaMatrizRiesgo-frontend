import type { Item } from '~/types/api'

/**
 * Activa/desactiva un registro (PUT { activo }) en lugar de borrarlo:
 * la API no permite borrados físicos para conservar el histórico.
 */
export function useAlternarActivo<T extends { id: number, activo: boolean }>() {
  const { api } = useApi()
  const toast = useToast()
  const procesando = ref<number | null>(null)

  async function alternar(url: string, registro: T): Promise<T | null> {
    procesando.value = registro.id

    try {
      const respuesta = await api<Item<T>>(url, { method: 'PUT', body: { activo: !registro.activo } })
      toast.add({
        title: respuesta.data.activo ? 'Registro activado' : 'Registro desactivado',
        color: 'success',
        icon: 'i-lucide-check',
      })
      return respuesta.data
    } catch (error) {
      toast.add({
        title: erroresDeValidacion(error)?.activo?.[0] ?? mensajeDeErrorApi(error),
        color: 'error',
        icon: 'i-lucide-circle-alert',
      })
      return null
    } finally {
      procesando.value = null
    }
  }

  return { alternar, procesando }
}
