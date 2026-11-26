import { duracionPlan } from './duracion'
import { lugaresTicul, MARGEN_TICUL, REGRESO_TICUL } from '../data/lugaresTicul'
import { validarConfiguracion } from './itinerarioIzamal'
import type { PlanIzamal } from './itinerarioIzamal'
import { bloquesRecorrido, recomendarRecorrido, resumirRecorrido } from './recorridoSecuencial'

export const modalidadesTicul = {
  'medio-dia': { nombre: 'Medio día (3–4 horas)', minutos: '240', hora: '09:00' },
  'dia-completo': { nombre: 'Día completo (Ruta Puuc)', minutos: '', hora: '09:00' },
  'tour-compras': { nombre: 'Tour de Compras', minutos: '', hora: '09:00' },
} as const
export type ModalidadTicul = keyof typeof modalidadesTicul
export interface ConfiguracionTicul { estancia: string; fecha: string; horaInicio: string; minutosDisponibles: string }
export interface BorradorTicul {
  destino: 'ticul'
  configuracion: ConfiguracionTicul
  modo: string
  seleccion: string[]
  generado: boolean
}
export type PlanTicul = PlanIzamal
export function esModalidadTicul(valor: string): valor is ModalidadTicul { return Object.hasOwn(modalidadesTicul, valor) }
export function validarConfiguracionTicul(c: ConfiguracionTicul): string[] {
  const errores = validarConfiguracion({ ...c, estancia: 'medio-dia' })
  if (!esModalidadTicul(c.estancia)) errores.unshift('Elige una modalidad válida: medio día, Día completo (Ruta Puuc) o Tour de Compras.')
  if ((c.estancia === 'dia-completo' || c.estancia === 'tour-compras') && !c.minutosDisponibles) errores.push('Esta modalidad no tiene duración fija. Indica cuánto tiempo tienes.')
  return errores
}
export function resumirSeleccionTicul(ids: string[]) { return resumirRecorrido(lugaresTicul, ids, REGRESO_TICUL, MARGEN_TICUL) }
export function calcularPlanTicul(b: BorradorTicul): { plan: PlanTicul | null; errores: string[] } {
  const errores = validarConfiguracionTicul(b.configuracion)
  if (b.modo !== 'recomendado' && b.modo !== 'personalizado') errores.push('Elige un modo válido: recomendado o personalizado. Revisa los parámetros repetidos o inválidos del enlace.')
  if (new Set(b.seleccion).size !== b.seleccion.length || b.seleccion.some(id => !lugaresTicul.some(l => l.id === id))) errores.push('La selección contiene lugares desconocidos o repetidos. Corrige la selección o restablécela.')
  if (errores.length) return { plan: null, errores }
  const disponibles = Number(b.configuracion.minutosDisponibles)
  // Compras recomienda solo alfarería y calzado; otras categorías requieren elección explícita.
  const orden = lugaresTicul.filter(l => b.configuracion.estancia !== 'tour-compras' || l.categoria === 'artesanias').map(l => l.id)
  const seleccion = b.modo === 'recomendado' ? recomendarRecorrido(lugaresTicul, orden, disponibles, REGRESO_TICUL, MARGEN_TICUL) : b.seleccion
  if (!seleccion.length) return { plan: null, errores: [b.modo === 'personalizado' ? 'Selecciona al menos un lugar para generar tu itinerario.' : 'No cabe una visita completa con traslados, regreso y margen. Amplía el tiempo disponible.'] }
  const resumen = resumirSeleccionTicul(seleccion)
  if (resumen.totalMinutos > disponibles) return { plan: null, errores: [`La selección excede el tiempo disponible por ${duracionPlan(resumen.totalMinutos - disponibles)}. Quita lugares o amplía el tiempo; no se ha eliminado ninguna visita.`] }
  const bloques = bloquesRecorrido(lugaresTicul, seleccion, REGRESO_TICUL, MARGEN_TICUL)
  for (const bloque of bloques) if (bloque.tipo === 'traslado' && bloque.lugarId) {
    const l = lugaresTicul.find(l => l.id === bloque.lugarId)!
    bloque.titulo = `${l.traslado.nombre} estimado a ${l.nombre}${l.traslado.supuesto ? ' (supuesto demostrativo)' : ''}`
  }
  bloques.at(-2)!.titulo = 'Caminata final estimada al punto de regreso'
  return { plan: { seleccion: [...seleccion], bloques, ...resumen, libresMinutos: disponibles - resumen.totalMinutos }, errores: [] }
}
