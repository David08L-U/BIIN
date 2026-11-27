import { duracionPlan } from './duracion'
import { avisoTrasladoComidaTicul } from '../data/lugaresTicul'
import { compartirPlan, descargarTextoPlan, textoJornadas } from './accionesPlan'
import { esModalidadTicul, modalidadesTicul } from './itinerarioTicul'
import type { BorradorTicul, PlanTicul } from './itinerarioTicul'
import { horaLocal } from './tiempoLocal'

export function compartirTicul(url: string) { return compartirPlan(url, 'Tu Itinerario BIIN en Ticul') }
export function textoPlanTicul(b: BorradorTicul, plan: PlanTicul): string {
  const c = b.configuracion
  if (plan.jornadas) return [
    'BIIN · Itinerario estimado en Ticul', `Fecha de visita: ${c.fecha} · Modo: ${b.modo}`,
    `Estancia: ${esModalidadTicul(c.estancia) ? modalidadesTicul[c.estancia].nombre : c.estancia}`,
    `Preferencia temática: ${c.preferencia || 'ninguna'}`,
    'Datos e imágenes demostrativos sin fecha de validación. Traslados locales estimados; precios, aperturas, acceso y transporte por confirmar.',
    avisoTrasladoComidaTicul,
    'Horas en la zona local del navegador que genera este archivo. No incluye mapas offline ni reservas.',
    ...textoJornadas(plan.jornadas),
  ].join('\n')
  return [
    'BIIN · Itinerario estimado en Ticul', `Fecha de visita: ${c.fecha} · Modo: ${b.modo}`,
    `Modalidad: ${esModalidadTicul(c.estancia) ? modalidadesTicul[c.estancia].nombre : c.estancia}`,
    'La propuesta se limita a las cuatro referencias de Ticul; no incluye excursiones a otras localidades.',
    `Archivo generado: ${new Date().toLocaleString()}`,
    'Datos e imágenes demostrativos sin fecha de validación. Tiempos estimados; precios, aperturas y acceso sin confirmar. Mototaxi sin disponibilidad confirmada, no contratado. No es un circuito geográfico verificado.',
    avisoTrasladoComidaTicul,
    'Horas en la zona local del navegador que genera este archivo. No incluye mapas offline ni reservas.',
    `Inicio elegido: ${horaLocal(c, 0)} · ${duracionPlan(Number(c.minutosDisponibles))} disponibles`,
    ...plan.bloques.map(p => `${horaLocal(c, p.inicio)} – ${horaLocal(c, p.fin)} · ${p.titulo} · ${duracionPlan(p.fin - p.inicio)}`),
    `Total: ${duracionPlan(plan.visitasMinutos)} de visitas + ${duracionPlan(plan.trasladosMinutos)} de traslados (incluye regreso final) + ${duracionPlan(plan.margenMinutos)} de margen = ${duracionPlan(plan.totalMinutos)}.`,
    `Tiempo libre: ${duracionPlan(plan.libresMinutos)} · ${horaLocal(c, plan.totalMinutos)} – ${horaLocal(c, Number(c.minutosDisponibles))}`,
    `Hora objetivo de regreso: ${horaLocal(c, Number(c.minutosDisponibles))} (objetivo del usuario, no es una salida confirmada).`,
  ].join('\n')
}
export function descargarTicul(b: BorradorTicul, plan: PlanTicul): void {
  descargarTextoPlan(textoPlanTicul(b, plan), `biin-ticul-${b.configuracion.fecha}.txt`)
}
