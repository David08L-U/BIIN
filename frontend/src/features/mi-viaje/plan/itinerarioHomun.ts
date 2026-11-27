import { lugaresHomun, MARGEN_HOMUN, REGRESO_HOMUN } from '../data/lugaresHomun'
import { calcularPlanJornadas, resumirJornada } from './recorridoJornadas'
import type { BorradorJornadas, ConfiguracionJornadas, JornadaPlan, PlanJornadas, VisitaJornada } from './recorridoJornadas'
import { estanciasCompartidas } from './estanciasCompartidas'
export { esEstanciaJornadas as esEstanciaHomun, validarConfiguracionJornadas as validarConfiguracionHomun, ventanasJornadas as ventanasHomun } from './recorridoJornadas'

export const estanciasHomun = {
  ...estanciasCompartidas,
} as const
export type ConfiguracionHomun = ConfiguracionJornadas
export type VisitaHomun = VisitaJornada
export type JornadaHomun = JornadaPlan
export type PlanHomun = PlanJornadas
export interface BorradorHomun extends BorradorJornadas { destino: 'homun' }
const datosHomun = { lugares: lugaresHomun, regreso: REGRESO_HOMUN, margen: MARGEN_HOMUN, tituloRegreso: 'Regreso final estimado (supuesto de 5 min; medio por confirmar)' }

export function resumirJornadaHomun(ids: string[], incluirRegreso = true) { return resumirJornada(ids, datosHomun, incluirRegreso) }
export function calcularPlanHomun(borrador: BorradorHomun) {
  const resultado = calcularPlanJornadas(borrador, datosHomun)
  // Conserva el medio de cada traslado también en el archivo descargado.
  for (const dia of resultado.plan?.jornadas ?? []) for (const bloque of dia.bloques) {
    if (bloque.tipo === 'traslado' && bloque.lugarId) {
      const lugar = lugaresHomun.find(l => l.id === bloque.lugarId)!
      bloque.titulo = `${lugar.traslado.nombre} estimado a ${lugar.nombre}`
    }
  }
  return resultado
}
