import { lugaresValladolid, MARGEN_VALLADOLID, TRASLADO_FINAL_VALLADOLID } from '../data/lugaresValladolid'
import type { BloquePlan, ModoItinerario } from './itinerarioIzamal'
import { fechaLocal, inicioLocal, instanteLocal, siguienteFechaLocal } from './tiempoLocal'
import type { EstanciaValladolid } from '../../transporte/data/detalleValladolidPrototipo'

export const estanciasValladolid = {
  'medio-dia': { nombre: 'Medio día', minutos: '270', hora: '10:40' },
  'dia-completo': { nombre: 'Día completo', minutos: '540', hora: '09:00' },
  'fin-de-semana': { nombre: 'Fin de semana', minutos: '270', hora: '09:00' },
} as const
// Los valores de URL se conservan como texto para validar también parámetros manipulados.
export interface ConfiguracionValladolid {
  estancia: string
  fecha: string
  horaInicio: string
  minutosDisponibles: string
  horaInicioDia2: string
  minutosDia2: string
}
export interface VisitaValladolid { lugarId: string; dia: number }
export interface BorradorValladolid {
  destino: 'valladolid'
  configuracion: ConfiguracionValladolid
  modo: string
  seleccion: VisitaValladolid[]
  generado: boolean
}
export interface VentanaValladolid { dia: number; fecha: string; horaInicio: string; minutosDisponibles: string }
export interface JornadaValladolid extends VentanaValladolid {
  seleccion: string[]
  bloques: BloquePlan[]
  visitasMinutos: number
  trasladosMinutos: number
  margenMinutos: number
  totalMinutos: number
  libresMinutos: number
}
export interface PlanValladolid { jornadas: JornadaValladolid[]; seleccion: VisitaValladolid[] }
export type ResultadoValladolid = { plan: PlanValladolid | null; errores: string[] }

export function esEstanciaValladolid(valor: string): valor is EstanciaValladolid {
  return Object.hasOwn(estanciasValladolid, valor)
}
export function esModoItinerario(valor: string): valor is ModoItinerario {
  return valor === 'recomendado' || valor === 'personalizado'
}
export function ventanasValladolid(config: ConfiguracionValladolid): VentanaValladolid[] {
  const ventanas = [{ dia: 1, fecha: config.fecha, horaInicio: config.horaInicio, minutosDisponibles: config.minutosDisponibles }]
  if (config.estancia === 'fin-de-semana') ventanas.push({ dia: 2, fecha: siguienteFechaLocal(config.fecha), horaInicio: config.horaInicioDia2, minutosDisponibles: config.minutosDia2 })
  return ventanas
}
export function validarConfiguracionValladolid(config: ConfiguracionValladolid): string[] {
  const errores: string[] = []
  if (!esEstanciaValladolid(config.estancia)) errores.push('Selecciona una estancia válida: medio día, día completo o fin de semana.')
  for (const ventana of ventanasValladolid(config)) {
    const prefijo = `Día ${ventana.dia}: `
    const fecha = inicioLocal({ ...ventana, horaInicio: '12:00' })
    const inicio = inicioLocal(ventana)
    if (!fecha) errores.push(prefijo + 'elige una fecha válida para la visita.')
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(ventana.horaInicio)) errores.push(prefijo + 'elige una hora de inicio válida.')
    else if (fecha && !inicio) errores.push(prefijo + 'esa hora no existe en la zona local del navegador.')
    const minutos = Number(ventana.minutosDisponibles)
    if (!/^\d+$/.test(ventana.minutosDisponibles) || !Number.isSafeInteger(minutos) || minutos < 15 || minutos > 720) {
      errores.push(prefijo + 'el tiempo disponible debe ser un número entero entre 15 y 720 minutos.')
    } else if (inicio) {
      const fin = instanteLocal(ventana, minutos)
      if (inicio.getHours() < 6 || fechaLocal(fin) !== ventana.fecha || fin.getHours() > 22 || (fin.getHours() === 22 && fin.getMinutes() > 0)) errores.push(prefijo + 'la ventana debe empezar y terminar entre las 06:00 y las 22:00 del mismo día, sin visitas nocturnas.')
    }
  }
  return errores
}
export function resumirJornadaValladolid(ids: string[]) {
  const lugares = ids.map(id => lugaresValladolid.find(lugar => lugar.id === id)).filter(lugar => lugar !== undefined)
  const visitasMinutos = lugares.reduce((suma, lugar) => suma + lugar.visitaMinutos, 0)
  const trasladosMinutos = lugares.length ? lugares.reduce((suma, lugar) => suma + lugar.trasladoMinutos, TRASLADO_FINAL_VALLADOLID) : 0
  return { visitasMinutos, trasladosMinutos, margenMinutos: MARGEN_VALLADOLID, totalMinutos: visitasMinutos + trasladosMinutos + MARGEN_VALLADOLID }
}

/** Solo cuatro lugares: evaluar asignaciones evita dejar una jornada vacía
 * cuando otra combinación cabe. No se modelan geografía, distancias ni aperturas.
 */
export function recomendarValladolid(ventanas: VentanaValladolid[]): VisitaValladolid[] | null {
  let mejor: VisitaValladolid[] | null = null
  let mejorPuntuacion = -1
  function buscar(indice: number, seleccion: VisitaValladolid[]) {
    const resumenes = ventanas.map(v => resumirJornadaValladolid(seleccion.filter(s => s.dia === v.dia).map(s => s.lugarId)))
    if (resumenes.some((r, i) => r.totalMinutos > Number(ventanas[i].minutosDisponibles))) return
    if (indice === lugaresValladolid.length) {
      const cantidades = ventanas.map(v => seleccion.filter(s => s.dia === v.dia).length)
      if (cantidades.some(n => n === 0)) return
      const puntuacion = seleccion.length * 10000 + Math.min(...cantidades) * 1000 + resumenes.reduce((s, r) => s + r.visitasMinutos, 0)
      if (puntuacion > mejorPuntuacion) { mejor = [...seleccion]; mejorPuntuacion = puntuacion }
      return
    }
    for (const ventana of ventanas) buscar(indice + 1, [...seleccion, { lugarId: lugaresValladolid[indice].id, dia: ventana.dia }])
    buscar(indice + 1, seleccion)
  }
  buscar(0, [])
  return mejor
}

export function calcularPlanValladolid(borrador: BorradorValladolid): ResultadoValladolid {
  const errores = validarConfiguracionValladolid(borrador.configuracion)
  if (!esModoItinerario(borrador.modo)) errores.push('Selecciona un modo válido: recomendado o personalizado.')
  const ventanas = ventanasValladolid(borrador.configuracion)
  const ids = borrador.seleccion.map(s => s.lugarId)
  if (new Set(ids).size !== ids.length || borrador.seleccion.some(s => !lugaresValladolid.some(l => l.id === s.lugarId) || !ventanas.some(v => v.dia === s.dia))) errores.push('La selección contiene lugares desconocidos, repetidos o asignados a una jornada no disponible. Corrige la selección o restablécela.')
  if (errores.length) return { plan: null, errores }
  const seleccion = borrador.modo === 'recomendado' ? recomendarValladolid(ventanas) : borrador.seleccion
  if (!seleccion) return { plan: null, errores: ['No hay una combinación que quepa en cada jornada con traslados y margen final. Amplía la ventana de visita o elige una estancia de una jornada; no se ha creado un plan.'] }
  for (const ventana of ventanas) {
    const elegidos = seleccion.filter(s => s.dia === ventana.dia).map(s => s.lugarId)
    if (!elegidos.length) errores.push(`Día ${ventana.dia}: selecciona al menos un lugar para generar el itinerario.`)
    const resumen = resumirJornadaValladolid(elegidos)
    const exceso = resumen.totalMinutos - Number(ventana.minutosDisponibles)
    if (exceso > 0) errores.push(`Día ${ventana.dia}: la selección excede el tiempo disponible por ${exceso} minutos. Modifica esa jornada; no se ha eliminado ninguna visita.`)
  }
  if (errores.length) return { plan: null, errores }
  const jornadas = ventanas.map(ventana => {
    const elegidos = seleccion.filter(s => s.dia === ventana.dia).map(s => s.lugarId)
    const bloques: BloquePlan[] = []
    let cursor = 0
    const agregar = (tipo: BloquePlan['tipo'], titulo: string, minutos: number, lugarId?: string) => {
      bloques.push({ tipo, titulo, lugarId, inicio: cursor, fin: cursor + minutos })
      cursor += minutos
    }
    for (const id of elegidos) {
      const lugar = lugaresValladolid.find(l => l.id === id)!
      agregar('traslado', `Desplazamiento estimado a ${lugar.nombre}`, lugar.trasladoMinutos, id)
      agregar('visita', lugar.nombre, lugar.visitaMinutos, id)
    }
    agregar('traslado', 'Traslado final estimado al punto de regreso', TRASLADO_FINAL_VALLADOLID)
    agregar('margen', 'Margen final para preparar el regreso', MARGEN_VALLADOLID)
    const resumen = resumirJornadaValladolid(elegidos)
    return { ...ventana, seleccion: elegidos, bloques, ...resumen, libresMinutos: Number(ventana.minutosDisponibles) - resumen.totalMinutos }
  })
  return { plan: { jornadas, seleccion: [...seleccion] }, errores: [] }
}
