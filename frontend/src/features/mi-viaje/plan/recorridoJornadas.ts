import { duracionPlan, leerDuracion } from './duracion'
import type { BloquePlan, ModoItinerario } from './itinerarioIzamal'
import { fechaLocal, inicioLocal, instanteLocal, siguienteFechaLocal } from './tiempoLocal'
import { bloquesRecorrido, resumirRecorrido } from './recorridoSecuencial'
import type { ParadaEstimada } from './recorridoSecuencial'

export interface DatosJornadas { lugares: readonly ParadaEstimada[]; regreso: number; margen: number; tituloRegreso?: string }
export function esEstanciaJornadas(valor: string): valor is 'medio-dia' | 'dia-completo' | 'fin-de-semana' {
  return valor === 'medio-dia' || valor === 'dia-completo' || valor === 'fin-de-semana'
}
export function esModoItinerario(valor: string): valor is ModoItinerario { return valor === 'recomendado' || valor === 'personalizado' }

// Los valores de URL se conservan como texto para validar también parámetros manipulados.
export interface ConfiguracionJornadas {
  estancia: string
  fecha: string
  horaInicio: string
  minutosDisponibles: string
  horaInicioDia2: string
  minutosDia2: string
}
export interface VisitaJornada { lugarId: string; dia: number }
export interface BorradorJornadas {
  configuracion: ConfiguracionJornadas
  modo: string
  seleccion: VisitaJornada[]
  generado: boolean
}
export interface VentanaJornada { dia: number; fecha: string; horaInicio: string; minutosDisponibles: string }
export interface JornadaPlan extends VentanaJornada {
  seleccion: string[]
  bloques: BloquePlan[]
  visitasMinutos: number
  trasladosMinutos: number
  margenMinutos: number
  totalMinutos: number
  libresMinutos: number
}
export interface PlanJornadas { jornadas: JornadaPlan[]; seleccion: VisitaJornada[] }
export type ResultadoJornadas = { plan: PlanJornadas | null; errores: string[] }

export function ventanasJornadas(config: ConfiguracionJornadas): VentanaJornada[] {
  const ventanas = [{ dia: 1, fecha: config.fecha, horaInicio: config.horaInicio, minutosDisponibles: config.minutosDisponibles }]
  if (config.estancia === 'fin-de-semana') ventanas.push({ dia: 2, fecha: siguienteFechaLocal(config.fecha), horaInicio: config.horaInicioDia2, minutosDisponibles: config.minutosDia2 })
  return ventanas
}
export function validarConfiguracionJornadas(config: ConfiguracionJornadas): string[] {
  const errores: string[] = []
  if (!esEstanciaJornadas(config.estancia)) errores.push('Selecciona una estancia válida: medio día, día completo o fin de semana.')
  for (const ventana of ventanasJornadas(config)) {
    const prefijo = `Día ${ventana.dia}: `
    const fecha = inicioLocal({ ...ventana, horaInicio: '12:00' })
    const inicio = inicioLocal(ventana)
    if (!fecha) errores.push(prefijo + 'elige una fecha válida para la visita.')
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(ventana.horaInicio)) errores.push(prefijo + 'elige una hora de inicio válida.')
    else if (fecha && !inicio) errores.push(prefijo + 'esa hora no existe en la zona local del navegador.')
    const minutos = leerDuracion(ventana.minutosDisponibles)
    if (minutos === null) {
      errores.push(prefijo + 'el tiempo disponible debe ser un número entero entre 15 min y 12 h.')
    } else if (inicio) {
      const fin = instanteLocal(ventana, minutos)
      if (inicio.getHours() < 6 || fechaLocal(fin) !== ventana.fecha || fin.getHours() > 22 || (fin.getHours() === 22 && fin.getMinutes() > 0)) errores.push(prefijo + 'la ventana debe empezar y terminar entre las 06:00 y las 22:00 del mismo día, sin visitas nocturnas.')
    }
  }
  return errores
}
export function resumirJornada(ids: string[], datos: DatosJornadas) {
  return resumirRecorrido(datos.lugares, ids, datos.regreso, datos.margen)
}

/** Solo cuatro lugares: evaluar asignaciones evita dejar una jornada vacía
 * cuando otra combinación cabe. No se modelan geografía, distancias ni aperturas.
 */
export function recomendarJornadas(ventanas: VentanaJornada[], datos: DatosJornadas): VisitaJornada[] | null {
  let mejor: VisitaJornada[] | null = null
  let mejorPuntuacion = -1
  function buscar(indice: number, seleccion: VisitaJornada[]) {
    const resumenes = ventanas.map(v => resumirJornada(seleccion.filter(s => s.dia === v.dia).map(s => s.lugarId), datos))
    if (resumenes.some((r, i) => r.totalMinutos > Number(ventanas[i].minutosDisponibles))) return
    if (indice === datos.lugares.length) {
      const cantidades = ventanas.map(v => seleccion.filter(s => s.dia === v.dia).length)
      if (cantidades.some(n => n === 0)) return
      const puntuacion = seleccion.length * 10000 + Math.min(...cantidades) * 1000 + resumenes.reduce((s, r) => s + r.visitasMinutos, 0)
      if (puntuacion > mejorPuntuacion) { mejor = [...seleccion]; mejorPuntuacion = puntuacion }
      return
    }
    for (const ventana of ventanas) buscar(indice + 1, [...seleccion, { lugarId: datos.lugares[indice].id, dia: ventana.dia }])
    buscar(indice + 1, seleccion)
  }
  buscar(0, [])
  return mejor
}

export function calcularPlanJornadas(borrador: BorradorJornadas, datos: DatosJornadas): ResultadoJornadas {
  const errores = validarConfiguracionJornadas(borrador.configuracion)
  if (!esModoItinerario(borrador.modo)) errores.push('Selecciona un modo válido: recomendado o personalizado.')
  const ventanas = ventanasJornadas(borrador.configuracion)
  const ids = borrador.seleccion.map(s => s.lugarId)
  if (new Set(ids).size !== ids.length || borrador.seleccion.some(s => !datos.lugares.some(l => l.id === s.lugarId) || !ventanas.some(v => v.dia === s.dia))) errores.push('La selección contiene lugares desconocidos, repetidos o asignados a una jornada no disponible. Corrige la selección o restablécela.')
  if (errores.length) return { plan: null, errores }
  const seleccion = borrador.modo === 'recomendado' ? recomendarJornadas(ventanas, datos) : borrador.seleccion
  if (!seleccion) return { plan: null, errores: ['No hay una combinación que quepa en cada jornada con traslados y margen final. Amplía la ventana de visita o elige una estancia de una jornada; no se ha creado un plan.'] }
  for (const ventana of ventanas) {
    const elegidos = seleccion.filter(s => s.dia === ventana.dia).map(s => s.lugarId)
    if (!elegidos.length) errores.push(`Día ${ventana.dia}: selecciona al menos un lugar para generar el itinerario.`)
    const resumen = resumirJornada(elegidos, datos)
    const exceso = resumen.totalMinutos - Number(ventana.minutosDisponibles)
    if (exceso > 0) errores.push(`Día ${ventana.dia}: la selección excede el tiempo disponible por ${duracionPlan(exceso)}. Modifica esa jornada; no se ha eliminado ninguna visita.`)
  }
  if (errores.length) return { plan: null, errores }
  const jornadas = ventanas.map(ventana => {
    const elegidos = seleccion.filter(s => s.dia === ventana.dia).map(s => s.lugarId)
    const bloques = bloquesRecorrido(datos.lugares, elegidos, datos.regreso, datos.margen)
    if (datos.tituloRegreso) bloques.at(-2)!.titulo = datos.tituloRegreso
    const resumen = resumirJornada(elegidos, datos)
    return { ...ventana, seleccion: elegidos, bloques, ...resumen, libresMinutos: Number(ventana.minutosDisponibles) - resumen.totalMinutos }
  })
  return { plan: { jornadas, seleccion: [...seleccion] }, errores: [] }
}
