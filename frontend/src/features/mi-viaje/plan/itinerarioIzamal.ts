import { duracionPlan } from './duracion'
import { lugaresIzamal, MARGEN_FINAL_MINUTOS, ordenRecomendadoIzamal, TRASLADO_FINAL_MINUTOS } from '../data/lugaresIzamal'
import { inicioLocal as construirInicioLocal, instanteLocal, horaLocal } from './tiempoLocal'
import { bloquesRecorrido, recomendarRecorrido, resumirRecorrido } from './recorridoSecuencial'

export type EstanciaIzamal = 'medio-dia' | 'dia-completo' | 'tarde-magica'
export type ModoItinerario = 'recomendado' | 'personalizado'
export interface ConfiguracionViaje {
  estancia: EstanciaIzamal
  fecha: string
  horaInicio: string
  minutosDisponibles: string
}
export interface BorradorIzamal {
  configuracion: ConfiguracionViaje
  modo: ModoItinerario
  seleccion: string[]
  generado: boolean
}
export interface BloquePlan {
  tipo: 'traslado' | 'visita' | 'margen'
  titulo: string
  lugarId?: string
  /** Minutos enteros transcurridos desde el inicio local del plan. */
  inicio: number
  fin: number
}
export interface PlanIzamal {
  seleccion: string[]
  bloques: BloquePlan[]
  visitasMinutos: number
  trasladosMinutos: number
  margenMinutos: number
  totalMinutos: number
  libresMinutos: number
}
export type ResultadoPlan = { plan: PlanIzamal; errores: [] } | { plan: null; errores: string[] }

export const estanciasIzamal = {
  'medio-dia': { nombre: 'Medio día', minutos: '240', hora: '11:30' },
  'dia-completo': { nombre: 'Día completo', minutos: '480', hora: '09:00' },
  'tarde-magica': { nombre: 'Tarde mágica', minutos: '180', hora: '16:00' },
} as const

/** Constructor local; nunca interpreta YYYY-MM-DD como una fecha UTC. */
export function inicioLocal(config: ConfiguracionViaje): Date | null {
  return construirInicioLocal(config)
}

export function validarConfiguracion(config: ConfiguracionViaje): string[] {
  const errores: string[] = []
  const soloFecha = inicioLocal({ ...config, horaInicio: '12:00' })
  if (!soloFecha) errores.push('Elige una fecha válida para la visita.')
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(config.horaInicio)) errores.push('Elige una hora de inicio válida.')
  else if (soloFecha && !inicioLocal(config)) errores.push('Esa hora no existe en la zona local del navegador. Elige otra hora.')
  if (!/^\d+$/.test(config.minutosDisponibles) || !Number.isSafeInteger(Number(config.minutosDisponibles)) || Number(config.minutosDisponibles) < 15 || Number(config.minutosDisponibles) > 720) errores.push('El tiempo disponible debe ser un número entero entre 15 min y 12 h.')
  return errores
}

export function resumirSeleccion(seleccion: string[]) {
  return resumirRecorrido(lugaresIzamal, seleccion, TRASLADO_FINAL_MINUTOS, MARGEN_FINAL_MINUTOS)
}

export function recomendarLugares(minutos: number): string[] {
  return recomendarRecorrido(lugaresIzamal, ordenRecomendadoIzamal, minutos, TRASLADO_FINAL_MINUTOS, MARGEN_FINAL_MINUTOS)
}

export function calcularPlan(borrador: BorradorIzamal): ResultadoPlan {
  const errores = validarConfiguracion(borrador.configuracion)
  if (errores.length) return { plan: null, errores }
  const disponibles = Number(borrador.configuracion.minutosDisponibles)
  const seleccion = borrador.modo === 'recomendado' ? recomendarLugares(disponibles) : borrador.seleccion
  if (!seleccion.length) return { plan: null, errores: [borrador.modo === 'personalizado' ? 'Selecciona al menos un lugar para generar tu itinerario.' : 'No hay tiempo suficiente para una visita con traslados y margen final. Amplía el tiempo a por lo menos 52 minutos o consulta el detalle de Izamal.'] }
  if (new Set(seleccion).size !== seleccion.length || seleccion.some(id => !lugaresIzamal.some(lugar => lugar.id === id))) return { plan: null, errores: ['La selección contiene lugares no disponibles o repetidos. Restablece la selección.'] }
  const resumen = resumirSeleccion(seleccion)
  if (resumen.totalMinutos > disponibles) return { plan: null, errores: [`La selección excede el tiempo disponible por ${duracionPlan(resumen.totalMinutos - disponibles)}. Quita lugares o aumenta el tiempo; no se ha eliminado ninguna visita.`] }
  const bloques = bloquesRecorrido(lugaresIzamal, seleccion, TRASLADO_FINAL_MINUTOS, MARGEN_FINAL_MINUTOS)
  return { plan: { seleccion: [...seleccion], bloques, ...resumen, libresMinutos: disponibles - resumen.totalMinutos }, errores: [] }
}

export function instantePlan(config: ConfiguracionViaje, minutos: number): Date {
  return instanteLocal(config, minutos)
}

export function horaPlan(config: ConfiguracionViaje, minutos: number): string {
  return horaLocal(config, minutos)
}

export { duracionPlan } from './duracion'
