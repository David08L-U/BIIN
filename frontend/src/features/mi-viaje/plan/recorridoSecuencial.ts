import type { BloquePlan } from './itinerarioIzamal'

export interface ParadaEstimada { id: string; nombre: string; visitaMinutos: number; trasladoMinutos: number }

/** Supuestos por parada, no distancias ni un motor de rutas geográficas. */
export function resumirRecorrido(lugares: readonly ParadaEstimada[], ids: string[], regreso: number, margen: number) {
  const elegidos = ids.map(id => lugares.find(l => l.id === id)).filter(l => l !== undefined)
  const visitasMinutos = elegidos.reduce((s, l) => s + l.visitaMinutos, 0)
  const trasladosMinutos = elegidos.length ? elegidos.reduce((s, l) => s + l.trasladoMinutos, regreso) : 0
  return { visitasMinutos, trasladosMinutos, margenMinutos: margen, totalMinutos: visitasMinutos + trasladosMinutos + margen }
}

export function recomendarRecorrido(lugares: readonly ParadaEstimada[], orden: readonly string[], disponibles: number, regreso: number, margen: number): string[] {
  const seleccion: string[] = []
  for (const id of orden) {
    if (resumirRecorrido(lugares, [...seleccion, id], regreso, margen).totalMinutos <= disponibles) seleccion.push(id)
  }
  return seleccion
}

export function bloquesRecorrido(lugares: readonly ParadaEstimada[], seleccion: string[], regreso: number, margen: number): BloquePlan[] {
  const bloques: BloquePlan[] = []
  let cursor = 0
  const agregar = (tipo: BloquePlan['tipo'], titulo: string, minutos: number, lugarId?: string) => {
    bloques.push({ tipo, titulo, lugarId, inicio: cursor, fin: cursor + minutos })
    cursor += minutos
  }
  for (const id of seleccion) {
    const lugar = lugares.find(l => l.id === id)!
    agregar('traslado', `Desplazamiento estimado a ${lugar.nombre}`, lugar.trasladoMinutos, id)
    agregar('visita', lugar.nombre, lugar.visitaMinutos, id)
  }
  agregar('traslado', 'Desplazamiento final estimado al punto de regreso', regreso)
  agregar('margen', 'Margen final para preparar el regreso', margen)
  return bloques
}
