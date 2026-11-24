import { avisoTrasladoComidaTicul } from '../data/lugaresTicul'
import { compartirPlan, descargarTextoPlan } from './accionesPlan'
import { esModalidadTicul, modalidadesTicul } from './itinerarioTicul'
import type { BorradorTicul, PlanTicul } from './itinerarioTicul'
import { horaLocal } from './tiempoLocal'

export function compartirTicul(url: string) { return compartirPlan(url, 'Tu Itinerario BIIN en Ticul') }
export function textoPlanTicul(b: BorradorTicul, plan: PlanTicul): string {
  const c = b.configuracion
  return [
    'BIIN · Itinerario estimado en Ticul', `Fecha de visita: ${c.fecha} · Modo: ${b.modo}`,
    `Modalidad: ${esModalidadTicul(c.estancia) ? modalidadesTicul[c.estancia].nombre : c.estancia}`,
    'La propuesta se limita a las cuatro referencias de Ticul; no incluye excursiones a otras localidades.',
    `Archivo generado: ${new Date().toLocaleString()}`,
    'Datos e imágenes demostrativos sin fecha de validación. Tiempos estimados; precios, aperturas y acceso sin confirmar. Mototaxi sin disponibilidad confirmada, no contratado. No es un circuito geográfico verificado.',
    avisoTrasladoComidaTicul,
    'Horas en la zona local del navegador que genera este archivo. No incluye mapas offline ni reservas.',
    `Inicio elegido: ${horaLocal(c, 0)} · ${c.minutosDisponibles} minutos disponibles`,
    ...plan.bloques.map(p => `${horaLocal(c, p.inicio)} – ${horaLocal(c, p.fin)} · ${p.titulo} · ${p.fin - p.inicio} min`),
    `Total: ${plan.visitasMinutos} min de visitas + ${plan.trasladosMinutos} min de traslados (incluye regreso final) + ${plan.margenMinutos} min de margen = ${plan.totalMinutos} min.`,
    `Tiempo libre: ${plan.libresMinutos} min · ${horaLocal(c, plan.totalMinutos)} – ${horaLocal(c, Number(c.minutosDisponibles))}`,
    `Hora objetivo de regreso: ${horaLocal(c, Number(c.minutosDisponibles))} (objetivo del usuario, no es una salida confirmada).`,
  ].join('\n')
}
export function descargarTicul(b: BorradorTicul, plan: PlanTicul): void {
  descargarTextoPlan(textoPlanTicul(b, plan), `biin-ticul-${b.configuracion.fecha}.txt`)
}
