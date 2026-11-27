export interface AvisoCompartir { estado: 'compartido' | 'copiado' | 'manual' | 'cancelado'; mensaje: string }

import { duracionPlan } from './duracion'
import type { JornadaPlan } from './recorridoJornadas'
import { horaLocal } from './tiempoLocal'

export function textoJornadas(jornadas: readonly JornadaPlan[]): string[] {
  if (!jornadas.length) return []
  const ultima = jornadas.at(-1)!
  return [
    'Llegada al destino el Día 1 y un único regreso al final del último día. Transporte y horarios por confirmar.',
    'El Día 2 parte de una referencia en la zona central del poblado; no incluye hospedaje ni traslados nocturnos.',
    ...jornadas.flatMap(dia => [
      '', `Día ${dia.dia} · ${dia.fecha}`, `Inicio elegido: ${horaLocal(dia, 0)} · ${duracionPlan(Number(dia.minutosDisponibles))} disponibles`,
      ...dia.bloques.map(b => `${horaLocal(dia, b.inicio)} – ${horaLocal(dia, b.fin)} · ${b.titulo} · ${duracionPlan(b.fin - b.inicio)}`),
      `Resumen: ${duracionPlan(dia.visitasMinutos)} de visitas + ${duracionPlan(dia.trasladosMinutos)} de traslados${dia.dia === ultima.dia ? ' y traslado local final' : ' locales'} + ${duracionPlan(dia.margenMinutos)} de margen. Libres: ${duracionPlan(dia.libresMinutos)}.`,
      ...(dia.dia === ultima.dia ? [`Hora objetivo de regreso: ${horaLocal(dia, Number(dia.minutosDisponibles))}; no es una salida confirmada.`] : []),
    ]),
  ]
}

export async function compartirPlan(url: string, title: string): Promise<AvisoCompartir> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: 'Vista previa estimada del plan de visita.', url })
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
  } catch { /* Ofrece copia manual sin anunciar éxito. */ }
  return { estado: 'manual', mensaje: 'No se pudo compartir ni copiar automáticamente. Selecciona el enlace y cópialo con el teclado o el menú del navegador.' }
}

export function descargarTextoPlan(texto: string, nombre: string): void {
  const archivo = new Blob([texto], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  try {
    enlace.href = url
    enlace.download = nombre
    document.body.append(enlace)
    enlace.click()
  } finally {
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}
