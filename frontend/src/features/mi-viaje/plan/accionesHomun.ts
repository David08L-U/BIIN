import { avisoRegresoHomun } from '../data/lugaresHomun'
import { compartirPlan, descargarTextoPlan } from './accionesPlan'
import type { BorradorHomun, PlanHomun } from './itinerarioHomun'
import { horaLocal } from './tiempoLocal'

export function compartirHomun(url: string) { return compartirPlan(url, 'Tu Itinerario BIIN en Homún') }
export function textoPlanHomun(b: BorradorHomun, plan: PlanHomun): string {
  return [
    'BIIN · Itinerario estimado en Homún', `Estancia: ${b.configuracion.estancia} · Modo: ${b.modo}`,
    `Archivo generado: ${new Date().toLocaleString()}`,
    'Referencias demostrativas sin fecha de validación. Visitas y traslados del prototipo; aperturas, precios, acceso y transporte sin confirmar. El mototaxi no está contratado ni se acredita disponibilidad.',
    avisoRegresoHomun,
    'Horas en la zona local del navegador que genera este archivo. No incluye mapas offline ni reservas.',
    ...plan.jornadas.flatMap(d => [
      '', `Día ${d.dia} · ${d.fecha} · Inicio elegido: ${horaLocal(d, 0)}`,
      ...d.bloques.map(p => `${horaLocal(d, p.inicio)} – ${horaLocal(d, p.fin)} · ${p.titulo} · ${p.fin - p.inicio} min`),
      `Total: ${d.visitasMinutos} min de visitas + ${d.trasladosMinutos} min de traslados (incluye regreso final) + ${d.margenMinutos} min de margen = ${d.totalMinutos} min.`,
      `Tiempo libre: ${d.libresMinutos} min · ${horaLocal(d, d.totalMinutos)} – ${horaLocal(d, Number(d.minutosDisponibles))}`,
      `Hora objetivo de regreso: ${horaLocal(d, Number(d.minutosDisponibles))} (objetivo del usuario, no es una salida confirmada).`,
    ]),
  ].join('\n')
}
export function descargarHomun(b: BorradorHomun, plan: PlanHomun): void {
  descargarTextoPlan(textoPlanHomun(b, plan), `biin-homun-${b.configuracion.fecha}.txt`)
}
