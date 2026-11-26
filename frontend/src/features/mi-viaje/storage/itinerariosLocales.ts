import { calcularPlan } from '../plan/itinerarioIzamal'
import { lugaresIzamal } from '../data/lugaresIzamal'
import type { BorradorIzamal } from '../plan/itinerarioIzamal'
import { calcularPlanValladolid } from '../plan/itinerarioValladolid'
import type { BorradorValladolid } from '../plan/itinerarioValladolid'
import { calcularPlanTekit } from '../plan/itinerarioTekit'
import type { BorradorTekit } from '../plan/itinerarioTekit'
import { calcularPlanHomun } from '../plan/itinerarioHomun'
import type { BorradorHomun } from '../plan/itinerarioHomun'
import { calcularPlanTicul } from '../plan/itinerarioTicul'
import type { BorradorTicul } from '../plan/itinerarioTicul'

export interface ItinerarioLocal {
  /** Los registros v1 antiguos sin destino pertenecen a Izamal. */
  destino?: 'izamal'
  id: string
  guardadoEn: string
  borrador: BorradorIzamal
}
export interface ItinerarioValladolidLocal {
  destino: 'valladolid'
  id: string
  guardadoEn: string
  borrador: BorradorValladolid
}
export interface ItinerarioTekitLocal {
  destino: 'tekit'
  id: string
  guardadoEn: string
  borrador: BorradorTekit
}
export interface ItinerarioHomunLocal {
  destino: 'homun'
  id: string
  guardadoEn: string
  borrador: BorradorHomun
}
export interface ItinerarioTiculLocal {
  destino: 'ticul'
  id: string
  guardadoEn: string
  borrador: BorradorTicul
}
export type ItinerarioGuardado = ItinerarioLocal | ItinerarioValladolidLocal | ItinerarioTekitLocal | ItinerarioHomunLocal | ItinerarioTiculLocal
interface LecturaLocales {
  itinerarios: ItinerarioGuardado[]
  error: string | null
}
const mensajeDanado = 'Hay itinerarios locales dañados o de una versión incompatible. No se sobrescribirán; puedes seguir preparando una vista previa.'

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esBorrador(valor: unknown): valor is BorradorIzamal {
  if (!esObjeto(valor) || !esObjeto(valor.configuracion) || valor.generado !== true || !Array.isArray(valor.seleccion) || !valor.seleccion.every(id => typeof id === 'string' && lugaresIzamal.some(lugar => lugar.id === id)) || new Set(valor.seleccion).size !== valor.seleccion.length) return false
  if ('destino' in valor && valor.destino !== 'izamal') return false
  const config = valor.configuracion
  return (valor.modo === 'recomendado' || valor.modo === 'personalizado') &&
    (config.estancia === 'medio-dia' || config.estancia === 'dia-completo' || config.estancia === 'tarde-magica') &&
    typeof config.fecha === 'string' && typeof config.horaInicio === 'string' && typeof config.minutosDisponibles === 'string'
}

function esBorradorValladolid(valor: unknown): valor is BorradorValladolid {
  if (!esObjeto(valor) || valor.destino !== 'valladolid' || valor.generado !== true || !esObjeto(valor.configuracion) || !Array.isArray(valor.seleccion)) return false
  const config = valor.configuracion
  return ['estancia', 'fecha', 'horaInicio', 'minutosDisponibles', 'horaInicioDia2', 'minutosDia2'].every(campo => typeof config[campo] === 'string') &&
    typeof valor.modo === 'string' && valor.seleccion.every(s => esObjeto(s) && typeof s.lugarId === 'string' && Number.isSafeInteger(s.dia)) && calcularPlanValladolid(valor as unknown as BorradorValladolid).plan !== null
}

function esBorradorTekit(valor: unknown): valor is BorradorTekit {
  if (!esObjeto(valor) || valor.destino !== 'tekit' || valor.generado !== true || !esObjeto(valor.configuracion) || !Array.isArray(valor.seleccion)) return false
  const config = valor.configuracion
  return ['estancia', 'fecha', 'horaInicio', 'minutosDisponibles'].every(campo => typeof config[campo] === 'string') &&
    typeof valor.modo === 'string' && valor.seleccion.every(id => typeof id === 'string') && calcularPlanTekit(valor as unknown as BorradorTekit).plan !== null
}

function esBorradorHomun(valor: unknown): valor is BorradorHomun {
  if (!esObjeto(valor) || valor.destino !== 'homun' || valor.generado !== true || !esObjeto(valor.configuracion) || !Array.isArray(valor.seleccion)) return false
  const config = valor.configuracion
  return ['estancia', 'fecha', 'horaInicio', 'minutosDisponibles', 'horaInicioDia2', 'minutosDia2'].every(campo => typeof config[campo] === 'string') &&
    typeof valor.modo === 'string' && valor.seleccion.every(s => esObjeto(s) && typeof s.lugarId === 'string' && Number.isSafeInteger(s.dia)) && calcularPlanHomun(valor as unknown as BorradorHomun).plan !== null
}

function esBorradorTicul(valor: unknown): valor is BorradorTicul {
  if (!esObjeto(valor) || valor.destino !== 'ticul' || valor.generado !== true || !esObjeto(valor.configuracion) || !Array.isArray(valor.seleccion)) return false
  const config = valor.configuracion
  return ['estancia', 'fecha', 'horaInicio', 'minutosDisponibles'].every(campo => typeof config[campo] === 'string') &&
    typeof valor.modo === 'string' && valor.seleccion.every(id => typeof id === 'string') && calcularPlanTicul(valor as unknown as BorradorTicul).plan !== null
}

function esItinerario(valor: unknown): valor is ItinerarioGuardado {
  if (!esObjeto(valor) || typeof valor.id !== 'string' || !valor.id.length || typeof valor.guardadoEn !== 'string' || !Number.isFinite(Date.parse(valor.guardadoEn))) return false
  if (valor.destino === 'valladolid') return esBorradorValladolid(valor.borrador)
  if (valor.destino === 'tekit') return esBorradorTekit(valor.borrador)
  if (valor.destino === 'homun') return esBorradorHomun(valor.borrador)
  if (valor.destino === 'ticul') return esBorradorTicul(valor.borrador)
  return (valor.destino === undefined || valor.destino === 'izamal') && esBorrador(valor.borrador) && calcularPlan(valor.borrador).plan !== null
}

function claveCuenta(idUsuario: number): string {
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) throw new Error('Identificador de cuenta inválido.')
  return `biin:itinerarios:v1:${idUsuario}`
}

export function leerItinerariosLocales(idUsuario: number): LecturaLocales {
  try {
    const texto = localStorage.getItem(claveCuenta(idUsuario))
    if (texto === null) return { itinerarios: [], error: null }
    const datos: unknown = JSON.parse(texto)
    if (!esObjeto(datos) || datos.version !== 1 || !Array.isArray(datos.itinerarios)) return { itinerarios: [], error: mensajeDanado }
    const ids = new Set<string>()
    const itinerarios = datos.itinerarios.filter(esItinerario).filter(item => {
      if (ids.has(item.id)) return false
      ids.add(item.id)
      return true
    })
    return { itinerarios, error: itinerarios.length !== datos.itinerarios.length ? mensajeDanado : null }
  } catch {
    return { itinerarios: [], error: 'No se pudieron leer los itinerarios de este navegador. El almacenamiento puede estar bloqueado o dañado.' }
  }
}

function identidad(item: ItinerarioGuardado): string {
  const config = item.borrador.configuracion
  if (item.destino === 'ticul') {
    const plan = calcularPlanTicul(item.borrador).plan!
    return JSON.stringify(['ticul', config.estancia, item.borrador.modo, [[config.fecha, config.horaInicio, Number(config.minutosDisponibles), plan.seleccion]]])
  }
  if (item.destino === 'homun') {
    const plan = calcularPlanHomun(item.borrador).plan!
    return JSON.stringify(['homun', config.estancia, item.borrador.modo, plan.jornadas.map(d => [d.fecha, d.horaInicio, Number(d.minutosDisponibles), d.seleccion])])
  }
  if (item.destino === 'tekit') {
    const plan = calcularPlanTekit(item.borrador).plan!
    return JSON.stringify(['tekit', config.estancia, item.borrador.modo, [[config.fecha, config.horaInicio, Number(config.minutosDisponibles), plan.seleccion]]])
  }
  if (item.destino === 'valladolid') {
    const plan = calcularPlanValladolid(item.borrador).plan!
    return JSON.stringify(['valladolid', config.estancia, item.borrador.modo, plan.jornadas.map(dia => [dia.fecha, dia.horaInicio, Number(dia.minutosDisponibles), dia.seleccion])])
  }
  const plan = calcularPlan(item.borrador).plan!
  return JSON.stringify(['izamal', config.estancia, item.borrador.modo, [[config.fecha, config.horaInicio, Number(config.minutosDisponibles), plan.seleccion]]])
}

type Guardado<T> = { guardado: T | null; error: string | null }
// Conserva los contratos anteriores y discrimina cada destino.
export function guardarItinerarioLocal(idUsuario: number, borrador: BorradorIzamal): Guardado<ItinerarioLocal>
export function guardarItinerarioLocal(idUsuario: number, borrador: BorradorValladolid): Guardado<ItinerarioValladolidLocal>
export function guardarItinerarioLocal(idUsuario: number, borrador: BorradorTekit): Guardado<ItinerarioTekitLocal>
export function guardarItinerarioLocal(idUsuario: number, borrador: BorradorHomun): Guardado<ItinerarioHomunLocal>
export function guardarItinerarioLocal(idUsuario: number, borrador: BorradorTicul): Guardado<ItinerarioTiculLocal>
export function guardarItinerarioLocal(idUsuario: number, borrador: BorradorIzamal | BorradorValladolid | BorradorTekit | BorradorHomun | BorradorTicul): Guardado<ItinerarioGuardado> {
  let candidato: ItinerarioGuardado
  if (esBorradorValladolid(borrador)) candidato = { destino: 'valladolid', id: '', guardadoEn: '', borrador }
  else if (esBorradorTicul(borrador)) candidato = { destino: 'ticul', id: '', guardadoEn: '', borrador }
  else if (esBorradorHomun(borrador)) candidato = { destino: 'homun', id: '', guardadoEn: '', borrador }
  else if (esBorradorTekit(borrador)) candidato = { destino: 'tekit', id: '', guardadoEn: '', borrador }
  else if (esBorrador(borrador) && calcularPlan(borrador).plan) candidato = { destino: 'izamal', id: '', guardadoEn: '', borrador }
  else return { guardado: null, error: 'Genera un plan válido antes de guardarlo.' }
  const lectura = leerItinerariosLocales(idUsuario)
  if (lectura.error) return { guardado: null, error: lectura.error }
  try {
    const clave = identidad(candidato)
    const existente = lectura.itinerarios.find(item => identidad(item) === clave)
    if (existente) return { guardado: existente, error: null }
    const guardado: ItinerarioGuardado = { ...candidato, id: `${candidato.destino}:${encodeURIComponent(clave)}`, guardadoEn: new Date().toISOString() }
    const texto = JSON.stringify({ version: 1, itinerarios: [...lectura.itinerarios, guardado] })
    localStorage.setItem(claveCuenta(idUsuario), texto)
    return { guardado, error: null }
  } catch {
    return { guardado: null, error: 'No se pudo guardar el itinerario en este navegador. Comprueba que el almacenamiento esté permitido y tenga espacio.' }
  }
}

/** Elimina únicamente el registro indicado dentro de la cuenta activa. */
export function eliminarItinerarioLocal(idUsuario: number, id: string): { eliminado: boolean; error: string | null } {
  const lectura = leerItinerariosLocales(idUsuario)
  if (lectura.error) return { eliminado: false, error: lectura.error }
  if (!lectura.itinerarios.some(item => item.id === id)) {
    return { eliminado: false, error: 'No se encontró ese itinerario en esta cuenta.' }
  }
  try {
    const restantes = lectura.itinerarios.filter(item => item.id !== id)
    localStorage.setItem(claveCuenta(idUsuario), JSON.stringify({ version: 1, itinerarios: restantes }))
    return { eliminado: true, error: null }
  } catch {
    return { eliminado: false, error: 'No se pudo eliminar el itinerario en este navegador. Comprueba que el almacenamiento esté permitido.' }
  }
}

/** Actualiza un guardado existente, dentro de su cuenta, tras confirmación explícita desde la pantalla. */
export function actualizarItinerarioLocal(idUsuario: number, id: string, borrador: BorradorIzamal | BorradorValladolid | BorradorTekit | BorradorHomun | BorradorTicul): Guardado<ItinerarioGuardado> {
  const lectura = leerItinerariosLocales(idUsuario)
  if (lectura.error) return { guardado: null, error: lectura.error }
  const original = lectura.itinerarios.find(item => item.id === id)
  if (!original) return { guardado: null, error: 'No se encontró ese itinerario en esta cuenta.' }
  const sinMeta = { ...borrador, editarId: undefined }
  let destino: ItinerarioGuardado['destino']
  if (esBorradorValladolid(sinMeta)) destino = 'valladolid'
  else if (esBorradorTekit(sinMeta)) destino = 'tekit'
  else if (esBorradorHomun(sinMeta)) destino = 'homun'
  else if (esBorradorTicul(sinMeta)) destino = 'ticul'
  else if (esBorrador(sinMeta) && calcularPlan(sinMeta).plan) destino = 'izamal'
  else return { guardado: null, error: 'Genera un plan válido antes de guardar los cambios.' }
  const destinoOriginal = original.destino ?? 'izamal'
  if (destino !== destinoOriginal) return { guardado: null, error: 'El destino del itinerario no puede cambiarse al editarlo.' }
  try {
    const actualizado = { ...original, guardadoEn: new Date().toISOString(), borrador: sinMeta } as ItinerarioGuardado
    const claveActualizada = identidad(actualizado)
    if (lectura.itinerarios.some(item => item.id !== id && identidad(item) === claveActualizada)) {
      return { guardado: null, error: 'Ya existe otro viaje guardado con la misma configuración. No se creó un duplicado.' }
    }
    const itinerarios = lectura.itinerarios.map(item => item.id === id ? actualizado : item)
    localStorage.setItem(claveCuenta(idUsuario), JSON.stringify({ version: 1, itinerarios }))
    return { guardado: actualizado, error: null }
  } catch {
    return { guardado: null, error: 'No se pudieron guardar los cambios en este navegador. Comprueba que el almacenamiento esté permitido y tenga espacio.' }
  }
}
