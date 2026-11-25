import { duracionPlan } from './duracion'
import type { BorradorValladolid, PlanValladolid } from './itinerarioValladolid'
import { horaLocal } from './tiempoLocal'
import { compartirPlan, descargarTextoPlan } from './accionesPlan'
export type { AvisoCompartir } from './accionesPlan'

export function compartirValladolid(url: string) {
  return compartirPlan(url, 'Tu Itinerario BIIN en Valladolid')
}

export function textoPlanValladolid(borrador: BorradorValladolid, plan: PlanValladolid): string {
  return [
    'BIIN · Itinerario estimado en Valladolid', `Modo: ${borrador.modo}`,
    'Datos del prototipo, sin fecha de validación. Visitas y traslados estimados; aperturas, tarifas y transporte sin confirmar.',
    'Horas en la zona local del navegador que genera este archivo. No incluye mapas offline ni reservas.',
    ...plan.jornadas.flatMap(dia => [
      '', `Día ${dia.dia} · ${dia.fecha}`, `Inicio elegido: ${horaLocal(dia, 0)}`,
      `Hora objetivo de regreso: ${horaLocal(dia, Number(dia.minutosDisponibles))} (no es una salida confirmada)`,
      ...dia.bloques.map(b => `${horaLocal(dia, b.inicio)} – ${horaLocal(dia, b.fin)} · ${b.titulo} · ${duracionPlan(b.fin - b.inicio)}`),
      `Total: ${duracionPlan(dia.visitasMinutos)} de visitas + ${duracionPlan(dia.trasladosMinutos)} de traslados (incluye traslado final) + ${duracionPlan(dia.margenMinutos)} de margen = ${duracionPlan(dia.totalMinutos)}. Libres: ${duracionPlan(dia.libresMinutos)}.`,
    ]),
  ].join('\n')
}

export function descargarValladolid(borrador: BorradorValladolid, plan: PlanValladolid): void {
  descargarTextoPlan(textoPlanValladolid(borrador, plan), `biin-valladolid-${borrador.configuracion.fecha}.txt`)
}
