import type { BorradorValladolid, PlanValladolid } from './itinerarioValladolid'
import { horaLocal } from './tiempoLocal'

export interface AvisoCompartir { estado: 'compartido' | 'copiado' | 'manual' | 'cancelado'; mensaje: string }

export async function compartirValladolid(url: string): Promise<AvisoCompartir> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Tu Itinerario BIIN en Valladolid', text: 'Vista previa estimada del plan de visita.', url })
      return { estado: 'compartido', mensaje: 'Vista previa compartida.' }
    } catch (error) {
      // DOMException puede proceder de otro contexto y no ser instanceof Error.
      if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError') return { estado: 'cancelado', mensaje: 'Se canceló compartir. El plan no ha cambiado.' }
    }
  }
  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(url)
      return { estado: 'copiado', mensaje: 'Enlace de la vista previa copiado.' }
    }
  } catch { /* La alternativa manual conserva el enlace sin afirmar que se copió. */ }
  return { estado: 'manual', mensaje: 'No se pudo compartir ni copiar automáticamente. Selecciona el enlace y cópialo con el teclado o el menú del navegador.' }
}

export function textoPlanValladolid(borrador: BorradorValladolid, plan: PlanValladolid): string {
  return [
    'BIIN · Itinerario estimado en Valladolid', `Modo: ${borrador.modo}`,
    'Datos del prototipo, sin fecha de validación. Visitas y traslados estimados; aperturas, tarifas y transporte sin confirmar.',
    'Horas en la zona local del navegador que genera este archivo. No incluye mapas offline ni reservas.',
    ...plan.jornadas.flatMap(dia => [
      '', `Día ${dia.dia} · ${dia.fecha}`, `Inicio elegido: ${horaLocal(dia, 0)}`,
      `Hora objetivo de regreso: ${horaLocal(dia, Number(dia.minutosDisponibles))} (no es una salida confirmada)`,
      ...dia.bloques.map(b => `${horaLocal(dia, b.inicio)} – ${horaLocal(dia, b.fin)} · ${b.titulo} · ${b.fin - b.inicio} min`),
      `Total: ${dia.visitasMinutos} min de visitas + ${dia.trasladosMinutos} min de traslados (incluye traslado final) + ${dia.margenMinutos} min de margen = ${dia.totalMinutos} min. Libres: ${dia.libresMinutos} min.`,
    ]),
  ].join('\n')
}

export function descargarValladolid(borrador: BorradorValladolid, plan: PlanValladolid): void {
  const archivo = new Blob([textoPlanValladolid(borrador, plan)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  try {
    enlace.href = url
    enlace.download = `biin-valladolid-${borrador.configuracion.fecha}.txt`
    document.body.append(enlace)
    enlace.click()
  } finally {
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}
