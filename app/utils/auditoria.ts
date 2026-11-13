// Textos legibles para el registro de auditoría. Solo presentación: los
// nombres internos los define el backend (docs/auditoria.md).

export const EVENTOS_AUDITORIA: Record<string, { label: string, color: 'neutral' | 'success' | 'info' | 'warning' | 'error' | 'primary' }> = {
  creado: { label: 'Creado', color: 'success' },
  actualizado: { label: 'Actualizado', color: 'info' },
  eliminado: { label: 'Eliminado', color: 'error' },
  publicado: { label: 'Publicado', color: 'primary' },
  archivado: { label: 'Archivado', color: 'neutral' },
  clonado: { label: 'Nueva edición', color: 'success' },
  anulado: { label: 'Anulado', color: 'warning' },
  exportado: { label: 'Exportado', color: 'neutral' },
  importado: { label: 'Importado de Excel', color: 'success' },
  login: { label: 'Inicio de sesión', color: 'neutral' },
  login_fallido: { label: 'Inicio de sesión fallido', color: 'error' },
  logout: { label: 'Cierre de sesión', color: 'neutral' },
}

export const ENTIDADES_AUDITORIA: Record<string, string> = {
  riesgo: 'Riesgo',
  matriz: 'Edición de matriz',
  seguimiento: 'Seguimiento',
  evidencia: 'Evidencia',
  usuario: 'Usuario',
  departamento: 'Departamento',
  proceso: 'Proceso',
  factor_riesgo: 'Factor de riesgo',
  periodicidad: 'Periodicidad',
  nivel_riesgo: 'Nivel de riesgo',
  escala_nivel: 'Escala',
  matriz_calor_celda: 'Celda de la matriz de calor',
}

const CAMPOS: Record<string, string> = {
  actividad: 'Actividad',
  descripcion: 'Descripción',
  causas: 'Causas',
  control_actual: 'Control actual',
  probabilidad: 'Probabilidad',
  impacto: 'Impacto',
  nivel_calculado_id: 'Nivel calculado',
  nivel_ajustado_id: 'Nivel ajustado',
  justificacion_ajuste: 'Justificación del ajuste',
  sintoma: 'Síntoma',
  tratamiento: 'Tratamiento',
  responsable: 'Responsable',
  periodicidad_id: 'Periodicidad',
  estado_tratamiento: 'Estado del tratamiento',
  factor_ids: 'Factores',
  departamento_ids: 'Departamentos',
  estado: 'Estado',
  nombre: 'Nombre',
  name: 'Nombre',
  email: 'Correo',
  password: 'Contraseña',
  role_id: 'Rol',
  activo: 'Activo',
  fecha: 'Fecha',
  fecha_revision: 'Fecha de revisión',
  motivo_anulacion: 'Motivo de anulación',
  nivel_riesgo_id: 'Nivel de riesgo',
  color: 'Color',
  direccion: 'Dirección',
  slug:'Identificador',
  departamento_id: 'Departamento',
  creado_por_id: 'Creado por (usuario)',
  edicion_anterior_id: 'Edición de origen',
  riesgo_origen_id: 'Riesgo de origen',
  publicada_at: 'Publicada el',
  archivada_at: 'Archivada el',
  estado_tratamiento_anterior: 'Tratamiento (antes)',
  estado_tratamiento_nuevo: 'Tratamiento (después)',
  anulado_at: 'Anulado el',
  anulado_por_id: 'Anulado por (usuario)',
  nombre_original: 'Archivo',
  mime: 'Tipo de archivo',
  tamano: 'Tamaño (bytes)',
}

/**
 * Descripción breve de un movimiento: "Riesgo #12 · Actualizado".
 * El registro afectado se identifica por su tipo y su número interno.
 */
export function registroAfectado(entidad: string | null, entidadId: number | null): string {
  if (!entidad) {
    return '—'
  }

  const nombre = ENTIDADES_AUDITORIA[entidad] ?? entidad
  return entidadId ? `${nombre} #${entidadId}` : nombre
}

export function etiquetaCampo(campo: string): string {
  return CAMPOS[campo] ?? campo
}

export function valorLegible(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') {
    return '—'
  }
  if (Array.isArray(valor)) {
    return valor.length ? valor.join(', ') : '—'
  }
  if (typeof valor === 'boolean') {
    return valor ? 'Sí' : 'No'
  }
  return String(valor)
}
