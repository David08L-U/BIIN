import { duracionPlan } from './duracion'
import { lugaresTekit, MARGEN_TEKIT, REGRESO_TEKIT } from '../data/lugaresTekit'
import type { PlanIzamal } from './itinerarioIzamal'
import { validarConfiguracion } from './itinerarioIzamal'
import { hoyLocal } from './tiempoLocal'
import { bloquesRecorrido, recomendarRecorrido, resumirRecorrido } from './recorridoSecuencial'
import { estanciasCompartidas } from './estanciasCompartidas'
import { calcularPlanJornadas, resumenPlanJornadas, validarConfiguracionJornadas } from './recorridoJornadas'
import type { DatosJornadas, VisitaJornada } from './recorridoJornadas'

export const modalidadesTekit = {
  ...estanciasCompartidas,
  'ruta-textil': { nombre: 'Ruta Textil · Compras', minutos: '', hora: '10:20' },
} as const
export type ModalidadTekit = keyof typeof modalidadesTekit
export interface ConfiguracionTekit { estancia: string; fecha: string; horaInicio: string; minutosDisponibles: string; horaInicioDia2?: string; minutosDia2?: string; preferencia?: string }
export interface BorradorTekit {
  destino: 'tekit'
  configuracion: ConfiguracionTekit
  modo: string
  seleccion: string[]
  generado: boolean
  editarId?: string
  seleccionDia2?: string[]
}
export type PlanTekit = PlanIzamal

export function esModalidadTekit(valor: string): valor is ModalidadTekit { return Object.hasOwn(modalidadesTekit, valor) }

export function validarConfiguracionTekit(config: ConfiguracionTekit, hoy = hoyLocal()): string[] {
  if (config.estancia === 'fin-de-semana') return [...validarConfiguracionJornadas({ ...config, horaInicioDia2: config.horaInicioDia2 ?? '', minutosDia2: config.minutosDia2 ?? '' }, hoy), ...(!['', 'ruta-textil'].includes(config.preferencia ?? '') ? ['Selecciona una preferencia temática válida.'] : [])]
  // Reutiliza las reglas de fecha local, hora y minutos sin ampliar el contrato de Izamal.
  const errores = validarConfiguracion({ ...config, estancia: 'medio-dia' }, hoy)
  if (!esModalidadTekit(config.estancia)) errores.unshift('Elige una modalidad válida: medio día, día completo o Ruta Textil · Compras.')
  if (!['', 'ruta-textil'].includes(config.preferencia ?? '')) errores.push('Selecciona una preferencia temática válida.')
  if (config.estancia === 'ruta-textil' && !config.minutosDisponibles) errores.push('Ruta Textil · Compras no tiene duración fija. Indica cuánto tiempo tienes.')
  return errores
}

export function resumirSeleccionTekit(ids: string[]) {
  return resumirRecorrido(lugaresTekit, ids, REGRESO_TEKIT, MARGEN_TEKIT)
}

export function calcularPlanTekit(borrador: BorradorTekit, hoy = hoyLocal()): { plan: PlanTekit | null; errores: string[] } {
  if (borrador.configuracion.estancia === 'fin-de-semana') {
    const config = { ...borrador.configuracion, horaInicioDia2: borrador.configuracion.horaInicioDia2 ?? '', minutosDia2: borrador.configuracion.minutosDia2 ?? '' }
    const preferencia = config.preferencia ?? (config.estancia === 'ruta-textil' ? 'ruta-textil' : '')
    const ordenRecomendado = preferencia === 'ruta-textil' ? lugaresTekit.filter(l => l.categoria === 'textil').map(l => l.id) : lugaresTekit.map(l => l.id)
    const datos: DatosJornadas = { lugares: lugaresTekit, ordenRecomendado, regreso: REGRESO_TEKIT, margen: MARGEN_TEKIT }
    const seleccion: VisitaJornada[] = borrador.seleccion.map(lugarId => ({ lugarId, dia: borrador.seleccionDia2?.includes(lugarId) ? 2 : 1 }))
    const resultado = calcularPlanJornadas({ configuracion: config, modo: borrador.modo, seleccion, generado: borrador.generado }, datos, hoy)
    return resultado.plan ? { plan: resumenPlanJornadas(resultado.plan), errores: [] } : { plan: null, errores: resultado.errores }
  }
  const errores = validarConfiguracionTekit(borrador.configuracion, hoy)
  if (borrador.modo !== 'recomendado' && borrador.modo !== 'personalizado') errores.push('Elige un modo válido: recomendado o personalizado. Revisa también los parámetros repetidos o inválidos del enlace.')
  if (new Set(borrador.seleccion).size !== borrador.seleccion.length || borrador.seleccion.some(id => !lugaresTekit.some(l => l.id === id))) errores.push('La selección contiene lugares desconocidos o repetidos. Corrige la selección o restablécela.')
  if (errores.length) return { plan: null, errores }
  const disponibles = Number(borrador.configuracion.minutosDisponibles)
  // Compras recomienda únicamente textiles; otras categorías requieren selección explícita.
  const preferencia = borrador.configuracion.preferencia ?? (borrador.configuracion.estancia === 'ruta-textil' ? 'ruta-textil' : '')
  const candidatos = lugaresTekit.filter(l => preferencia !== 'ruta-textil' || l.categoria === 'textil')
  const seleccion = borrador.modo === 'recomendado' ? recomendarRecorrido(lugaresTekit, candidatos.map(l => l.id), disponibles, REGRESO_TEKIT, MARGEN_TEKIT) : borrador.seleccion
  if (!seleccion.length) return { plan: null, errores: [borrador.modo === 'personalizado' ? 'Selecciona al menos un lugar para generar tu itinerario.' : 'No cabe una visita completa con traslados, regreso y margen. Amplía el tiempo disponible.'] }
  const resumen = resumirSeleccionTekit(seleccion)
  if (resumen.totalMinutos > disponibles) return { plan: null, errores: [`La selección excede el tiempo disponible por ${duracionPlan(resumen.totalMinutos - disponibles)}. Quita lugares o amplía el tiempo; no se ha eliminado ninguna visita.`] }
  return { plan: { seleccion: [...seleccion], bloques: bloquesRecorrido(lugaresTekit, seleccion, REGRESO_TEKIT, MARGEN_TEKIT), ...resumen, libresMinutos: disponibles - resumen.totalMinutos }, errores: [] }
}
