import type { EstadoTratamiento } from '~/types/api'

export const ESTADOS_TRATAMIENTO: Record<EstadoTratamiento, { label: string, color: 'neutral' | 'info' | 'success' }> = {
  pendiente: { label: 'Pendiente', color: 'neutral' },
  en_progreso: { label: 'En progreso', color: 'info' },
  cumplido: { label: 'Cumplido', color: 'success' },
}

export const OPCIONES_ESTADO_TRATAMIENTO = (Object.keys(ESTADOS_TRATAMIENTO) as EstadoTratamiento[])
  .map(valor => ({ label: ESTADOS_TRATAMIENTO[valor].label, value: valor }))
