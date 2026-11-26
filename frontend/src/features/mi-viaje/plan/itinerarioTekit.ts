import { duracionPlan } from './duracion'
import { lugaresTekit, MARGEN_TEKIT, REGRESO_TEKIT } from '../data/lugaresTekit'
import type { PlanIzamal } from './itinerarioIzamal'
import { validarConfiguracion } from './itinerarioIzamal'
import { hoyLocal } from './tiempoLocal'
import { bloquesRecorrido, recomendarRecorrido, resumirRecorrido } from './recorridoSecuencial'

export const modalidadesTekit = {
  'medio-dia': { nombre: 'Medio día', minutos: '240', hora: '10:20' },
  'dia-completo': { nombre: 'Día completo', minutos: '360', hora: '09:00' },
  'ruta-textil': { nombre: 'Ruta Textil · Compras', minutos: '', hora: '10:20' },
} as const
export type ModalidadTekit = keyof typeof modalidadesTekit
export interface ConfiguracionTekit { estancia: string; fecha: string; horaInicio: string; minutosDisponibles: string }
export interface BorradorTekit {
  destino: 'tekit'
  configuracion: ConfiguracionTekit
  modo: string
  seleccion: string[]
  generado: boolean
  editarId?: string
}
export type PlanTekit = PlanIzamal

export function esModalidadTekit(valor: string): valor is ModalidadTekit { return Object.hasOwn(modalidadesTekit, valor) }

export function validarConfiguracionTekit(config: ConfiguracionTekit, hoy = hoyLocal()): string[] {
  // Reutiliza las reglas de fecha local, hora y minutos sin ampliar el contrato de Izamal.
  const errores = validarConfiguracion({ ...config, estancia: 'medio-dia' }, hoy)
  if (!esModalidadTekit(config.estancia)) errores.unshift('Elige una modalidad válida: medio día, día completo o Ruta Textil · Compras.')
  if (config.estancia === 'ruta-textil' && !config.minutosDisponibles) errores.push('Ruta Textil · Compras no tiene duración fija. Indica cuánto tiempo tienes.')
  return errores
}

export function resumirSeleccionTekit(ids: string[]) {
  return resumirRecorrido(lugaresTekit, ids, REGRESO_TEKIT, MARGEN_TEKIT)
}

export function calcularPlanTekit(borrador: BorradorTekit, hoy = hoyLocal()): { plan: PlanTekit | null; errores: string[] } {
  const errores = validarConfiguracionTekit(borrador.configuracion, hoy)
  if (borrador.modo !== 'recomendado' && borrador.modo !== 'personalizado') errores.push('Elige un modo válido: recomendado o personalizado. Revisa también los parámetros repetidos o inválidos del enlace.')
  if (new Set(borrador.seleccion).size !== borrador.seleccion.length || borrador.seleccion.some(id => !lugaresTekit.some(l => l.id === id))) errores.push('La selección contiene lugares desconocidos o repetidos. Corrige la selección o restablécela.')
  if (errores.length) return { plan: null, errores }
  const disponibles = Number(borrador.configuracion.minutosDisponibles)
  // Compras recomienda únicamente textiles; otras categorías requieren selección explícita.
  const candidatos = lugaresTekit.filter(l => borrador.configuracion.estancia !== 'ruta-textil' || l.categoria === 'textil')
  const seleccion = borrador.modo === 'recomendado' ? recomendarRecorrido(lugaresTekit, candidatos.map(l => l.id), disponibles, REGRESO_TEKIT, MARGEN_TEKIT) : borrador.seleccion
  if (!seleccion.length) return { plan: null, errores: [borrador.modo === 'personalizado' ? 'Selecciona al menos un lugar para generar tu itinerario.' : 'No cabe una visita completa con traslados, regreso y margen. Amplía el tiempo disponible.'] }
  const resumen = resumirSeleccionTekit(seleccion)
  if (resumen.totalMinutos > disponibles) return { plan: null, errores: [`La selección excede el tiempo disponible por ${duracionPlan(resumen.totalMinutos - disponibles)}. Quita lugares o amplía el tiempo; no se ha eliminado ninguna visita.`] }
  return { plan: { seleccion: [...seleccion], bloques: bloquesRecorrido(lugaresTekit, seleccion, REGRESO_TEKIT, MARGEN_TEKIT), ...resumen, libresMinutos: disponibles - resumen.totalMinutos }, errores: [] }
}
