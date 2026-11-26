import { duracionPlan } from './duracion'
import type { BorradorTekit, PlanTekit } from './itinerarioTekit'
import { esModalidadTekit, modalidadesTekit } from './itinerarioTekit'
import { compartirPlan, descargarTextoPlan } from './accionesPlan'
import { horaLocal } from './tiempoLocal'

export function compartirTekit(url: string) { return compartirPlan(url, 'Tu Itinerario BIIN en Tekit') }

export function textoPlanTekit(b: BorradorTekit, plan: PlanTekit): string {
  const c = b.configuracion
  return [
    'BIIN · Itinerario estimado en Tekit', `Fecha de visita: ${c.fecha} · Modo: ${b.modo}`,
    `Modalidad: ${esModalidadTekit(c.estancia) ? modalidadesTekit[c.estancia].nombre : c.estancia}`,
    `Archivo generado: ${new Date().toLocaleString()}`,
    'Referencias demostrativas sin fecha de validación. Visitas y traslados son estimaciones por confirmar, no mediciones geográficas reales. Aperturas, precios, visitas guiadas y transporte sin confirmar.',
    'Horas en la zona local del navegador que genera este archivo. No incluye mapas offline ni reservas.',
    `Inicio elegido: ${horaLocal(c, 0)} · ${duracionPlan(Number(c.minutosDisponibles))} disponibles`,
    ...plan.bloques.map(p => `${horaLocal(c, p.inicio)} – ${horaLocal(c, p.fin)} · ${p.titulo} · ${duracionPlan(p.fin - p.inicio)}`),
    `Total: ${duracionPlan(plan.visitasMinutos)} de visitas + ${duracionPlan(plan.trasladosMinutos)} de traslados (incluye regreso final) + ${duracionPlan(plan.margenMinutos)} de margen = ${duracionPlan(plan.totalMinutos)}.`,
    `Tiempo libre: ${duracionPlan(plan.libresMinutos)} · ${horaLocal(c, plan.totalMinutos)} – ${horaLocal(c, Number(c.minutosDisponibles))}`,
    `Hora objetivo de regreso: ${horaLocal(c, Number(c.minutosDisponibles))} (objetivo del usuario, no es una salida confirmada).`,
  ].join('\n')
}
export function descargarTekit(b: BorradorTekit, plan: PlanTekit): void {
  descargarTextoPlan(textoPlanTekit(b, plan), `biin-tekit-${b.configuracion.fecha}.txt`)
}
