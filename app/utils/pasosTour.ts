import { ROL_ADMINISTRADOR, ROL_AUDITOR, ROL_ENCARGADO_DEPARTAMENTO, ROL_ENCARGADO_SEGUIMIENTO } from '~/types/api'

/**
 * Contenido del recorrido guiado y de la guía rápida de Ayuda (una sola
 * fuente: el recorrido y la ayuda dicen lo mismo).
 *
 * Cada paso se muestra solo a los roles que pueden usar esa función, igual
 * que el menú (layouts/default.vue); la API sigue decidiendo los permisos.
 * Los textos son texto plano: Driver.js los inserta como HTML, así que
 * useRecorridoGuiado los escapa antes.
 */
export interface PasoTour {
  id: string
  titulo: string
  descripcion: string
  /** Selector de un elemento real de la interfaz. Sin él, el paso va centrado. */
  elemento?: string
}

const ROL_DIRECCION = 'direccion'

interface Contexto {
  rol: string | undefined
  nombreRol: string | undefined
  minutosSesion: number | null
}

export function pasosTour({ rol, nombreRol, minutosSesion }: Contexto): PasoTour[] {
  const esAdmin = rol === ROL_ADMINISTRADOR
  const gestionaMatrices = esAdmin || rol === ROL_ENCARGADO_DEPARTAMENTO
  const registraSeguimiento = gestionaMatrices || rol === ROL_ENCARGADO_SEGUIMIENTO
  const veHistorial = registraSeguimiento
  const veAuditoria = esAdmin || rol === ROL_AUDITOR
  const consultaTodos = esAdmin || rol === ROL_AUDITOR || rol === ROL_DIRECCION
  const alcance = consultaTodos ? 'todos los departamentos' : 'sus departamentos'

  const matrices: Record<string, string> = {
    [ROL_ADMINISTRADOR]: 'Cada departamento con sus procesos; cada proceso tiene su matriz. Puede crear matrices nuevas y ediciones (vacías o a partir de otra), publicarlas y archivarlas en todos los departamentos.',
    [ROL_ENCARGADO_DEPARTAMENTO]: 'Sus departamentos con sus procesos; cada proceso tiene su matriz. Con «Nueva matriz» crea la de un proceso; dentro, crea ediciones (vacías o a partir de otra), las publica y las archiva.',
    [ROL_ENCARGADO_SEGUIMIENTO]: 'Las matrices de sus departamentos. Abra la edición vigente de un proceso para registrar el seguimiento de sus riesgos.',
  }

  const pasos: (PasoTour | false)[] = [
    {
      id: 'bienvenida',
      titulo: 'Bienvenido al Sistema de Matrices de Riesgo',
      descripcion: `Este recorrido breve le muestra dónde está cada función disponible para su rol${nombreRol ? ` (${nombreRol})` : ''}. Puede salir cuando quiera y repetirlo desde Ayuda.`,
    },
    {
      id: 'menu',
      titulo: 'Menú principal',
      descripcion: 'Desde aquí se llega a cada módulo. Solo aparecen las opciones que su rol permite usar. Puede contraerlo para ganar espacio.',
      elemento: '[data-tour="menu"]',
    },
    {
      id: 'inicio',
      titulo: 'Inicio',
      descripcion: `Resumen de los riesgos vigentes de ${alcance}: riesgos por nivel, mapa de calor, estado de los tratamientos y seguimientos atrasados.`,
      elemento: '[data-tour="menu"] a[href="/"]',
    },
    {
      id: 'matrices',
      titulo: 'Matrices de riesgo',
      descripcion: matrices[rol ?? ''] ?? 'Todas las matrices y sus ediciones, para consultarlas, compararlas y exportarlas a PDF o Excel.',
      elemento: '[data-tour="menu"] a[href="/matrices"]',
    },
    gestionaMatrices && {
      id: 'riesgos',
      titulo: 'Riesgos',
      descripcion: 'En una edición en borrador, «Nuevo riesgo» registra una fila con los campos del formulario RT-01-NI-ONA-156. El nivel se calcula solo a partir de la probabilidad y el impacto. Una edición publicada ya no se modifica.',
    },
    registraSeguimiento && {
      id: 'seguimientos',
      titulo: 'Seguimientos y evidencias',
      descripcion: 'En la edición vigente, el botón «Seguimiento» de cada riesgo registra los avances, cambia el estado del tratamiento y adjunta evidencias (PDF, imágenes o Excel). El historial no se borra: un error se anula indicando el motivo.',
    },
    {
      id: 'reportes',
      titulo: 'Reportes',
      descripcion: `Listado de los riesgos de ${alcance} con filtros por departamento, proceso, nivel, responsable, tratamiento y periodo.`,
      elemento: '[data-tour="menu"] a[href="/reportes"]',
    },
    veHistorial && {
      id: 'historial',
      titulo: 'Historial de movimientos',
      descripcion: `Quién hizo qué y cuándo en las matrices de ${alcance}, con los valores anteriores y los nuevos. Es solo de consulta.`,
      elemento: '[data-tour="menu"] a[href="/historial"]',
    },
    veAuditoria && {
      id: 'auditoria',
      titulo: 'Auditoría',
      descripcion: 'Registro completo de cambios del sistema, incluidos los inicios de sesión, los catálogos y los usuarios.',
      elemento: '[data-tour="menu"] a[href="/auditoria"]',
    },
    esAdmin && {
      id: 'administracion',
      titulo: 'Administración',
      descripcion: 'En Departamentos, Catálogos y Usuarios gestiona la estructura de la institución, los factores, las escalas, la matriz de calor y las cuentas con su rol y sus departamentos.',
      elemento: '[data-tour="menu"] a[href="/departamentos"]',
    },
    {
      id: 'perfil',
      titulo: 'Perfil',
      descripcion: 'Sus datos personales e institucionales. En «Seguridad de la cuenta» puede cambiar su contraseña.',
      elemento: '[data-tour="perfil"]',
    },
    {
      id: 'ayuda',
      titulo: 'Ayuda',
      descripcion: 'Aquí encontrará una guía rápida y la opción para volver a iniciar este recorrido cuando lo necesite.',
      elemento: '[data-tour="ayuda"]',
    },
    {
      id: 'fin',
      titulo: 'Listo',
      descripcion: minutosSesion
        ? `Ya conoce lo esencial. Recuerde: por seguridad, la sesión se cierra tras ${minutosSesion} minutos sin actividad; un minuto antes verá un aviso.`
        : 'Ya conoce lo esencial.',
    },
  ]

  return pasos.filter((paso): paso is PasoTour => paso !== false)
}
