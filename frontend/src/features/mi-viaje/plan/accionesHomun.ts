import { duracionPlan } from './duracion'
import { avisoRegresoHomun } from '../data/lugaresHomun'
import { compartirPlan, descargarTextoPlan, textoJornadas } from './accionesPlan'
import type { BorradorHomun, PlanHomun } from './itinerarioHomun'
import { horaLocal } from './tiempoLocal'

export function compartirHomun(url: string) { return compartirPlan(url, 'Tu Itinerario BIIN en Homún') }
export function textoPlanHomun(b: BorradorHomun, plan: PlanHomun): string {
  if (b.configuracion.estancia === 'fin-de-semana') return [
    'BIIN · Itinerario estimado en Homún', `Estancia: ${b.configuracion.estancia} · Modo: ${b.modo}`,
    'Referencias demostrativas sin fecha de validación. Visitas y traslados locales estimados; aperturas, precios y acceso por confirmar; mototaxi no contratado.',
    avisoRegresoHomun,
    'Horas en la zona local del navegador que genera este archivo. No incluye mapas offline ni reservas.',
    ...textoJornadas(plan.jornadas),
  ].join('\n')
  return [
    'BIIN · Itinerario estimado en Homún', `Estancia: ${b.configuracion.estancia} · Modo: ${b.modo}`,
    `Archivo generado: ${new Date().toLocaleString()}`,
    'Referencias demostrativas sin fecha de validación. Visitas y traslados estimados. Aperturas, precios y acceso por confirmar; mototaxi no contratado.',
    avisoRegresoHomun,
    'Horas en la zona local del navegador que genera este archivo. No incluye mapas offline ni reservas.',
    ...plan.jornadas.flatMap(d => [
      '', `Día ${d.dia} · ${d.fecha} · Inicio elegido: ${horaLocal(d, 0)}`,
      ...d.bloques.map(p => `${horaLocal(d, p.inicio)} – ${horaLocal(d, p.fin)} · ${p.titulo} · ${duracionPlan(p.fin - p.inicio)}`),
      `Total: ${duracionPlan(d.visitasMinutos)} de visitas + ${duracionPlan(d.trasladosMinutos)} de traslados (incluye regreso final) + ${duracionPlan(d.margenMinutos)} de margen = ${duracionPlan(d.totalMinutos)}.`,
      `Tiempo libre: ${duracionPlan(d.libresMinutos)} · ${horaLocal(d, d.totalMinutos)} – ${horaLocal(d, Number(d.minutosDisponibles))}`,
      `Hora objetivo de regreso: ${horaLocal(d, Number(d.minutosDisponibles))} (objetivo del usuario, no es una salida confirmada).`,
    ]),
  ].join('\n')
}
export function descargarHomun(b: BorradorHomun, plan: PlanHomun): void {
  descargarTextoPlan(textoPlanHomun(b, plan), `biin-homun-${b.configuracion.fecha}.txt`)
}
