import { lugaresValladolid, MARGEN_VALLADOLID, TRASLADO_FINAL_VALLADOLID } from '../data/lugaresValladolid'
import type { BloquePlan } from './itinerarioIzamal'
import type { EstanciaValladolid } from '../../transporte/data/detalleValladolidPrototipo'
import { calcularPlanJornadas, recomendarJornadas, resumirJornada, validarConfiguracionJornadas, ventanasJornadas } from './recorridoJornadas'
import { estanciasCompartidas } from './estanciasCompartidas'
export { esModoItinerario } from './recorridoJornadas'

export const estanciasValladolid = {
  ...estanciasCompartidas,
} as const
// Los valores de URL se conservan como texto para validar también parámetros manipulados.
export interface ConfiguracionValladolid {
  estancia: string
  fecha: string
  horaInicio: string
  minutosDisponibles: string
  horaInicioDia2: string
  minutosDia2: string
}
export interface VisitaValladolid { lugarId: string; dia: number }
export interface BorradorValladolid {
  destino: 'valladolid'
  configuracion: ConfiguracionValladolid
  modo: string
  seleccion: VisitaValladolid[]
  generado: boolean
  editarId?: string
}
export interface VentanaValladolid { dia: number; fecha: string; horaInicio: string; minutosDisponibles: string }
export interface JornadaValladolid extends VentanaValladolid {
  seleccion: string[]
  bloques: BloquePlan[]
  visitasMinutos: number
  trasladosMinutos: number
  margenMinutos: number
  totalMinutos: number
  libresMinutos: number
}
export interface PlanValladolid { jornadas: JornadaValladolid[]; seleccion: VisitaValladolid[] }
export type ResultadoValladolid = { plan: PlanValladolid | null; errores: string[] }

const datosValladolid = { lugares: lugaresValladolid, regreso: TRASLADO_FINAL_VALLADOLID, margen: MARGEN_VALLADOLID, tituloRegreso: 'Traslado final estimado al punto de regreso' }

export function esEstanciaValladolid(valor: string): valor is EstanciaValladolid { return Object.hasOwn(estanciasValladolid, valor) }
export function ventanasValladolid(config: ConfiguracionValladolid): VentanaValladolid[] { return ventanasJornadas(config) }
export function validarConfiguracionValladolid(config: ConfiguracionValladolid): string[] { return validarConfiguracionJornadas(config) }
export function resumirJornadaValladolid(ids: string[], incluirRegreso = true) { return resumirJornada(ids, datosValladolid, incluirRegreso) }
export function recomendarValladolid(ventanas: VentanaValladolid[]): VisitaValladolid[] | null { return recomendarJornadas(ventanas, datosValladolid) }
export function calcularPlanValladolid(borrador: BorradorValladolid): ResultadoValladolid { return calcularPlanJornadas(borrador, datosValladolid) }
