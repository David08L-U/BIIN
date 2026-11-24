import { calcularPlan } from '../plan/itinerarioIzamal'
import { lugaresIzamal } from '../data/lugaresIzamal'
import type { BorradorIzamal } from '../plan/itinerarioIzamal'

export interface ItinerarioLocal {
  id: string
  guardadoEn: string
  borrador: BorradorIzamal
}
interface LecturaLocales {
  itinerarios: ItinerarioLocal[]
  error: string | null
}
const mensajeDanado = 'Hay itinerarios locales dañados o de una versión incompatible. No se sobrescribirán; puedes seguir preparando una vista previa.'

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null
}

function esBorrador(valor: unknown): valor is BorradorIzamal {
  if (!esObjeto(valor) || !esObjeto(valor.configuracion) || valor.generado !== true || !Array.isArray(valor.seleccion) || !valor.seleccion.every(id => typeof id === 'string' && lugaresIzamal.some(lugar => lugar.id === id)) || new Set(valor.seleccion).size !== valor.seleccion.length) return false
  const config = valor.configuracion
  return (valor.modo === 'recomendado' || valor.modo === 'personalizado') &&
    (config.estancia === 'medio-dia' || config.estancia === 'dia-completo' || config.estancia === 'tarde-magica') &&
    typeof config.fecha === 'string' && typeof config.horaInicio === 'string' && typeof config.minutosDisponibles === 'string'
}

function esItinerario(valor: unknown): valor is ItinerarioLocal {
  return esObjeto(valor) && typeof valor.id === 'string' && valor.id.length > 0 && typeof valor.guardadoEn === 'string' && Number.isFinite(Date.parse(valor.guardadoEn)) && esBorrador(valor.borrador) && calcularPlan(valor.borrador).plan !== null
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

function identidad(borrador: BorradorIzamal): string {
  const plan = calcularPlan(borrador).plan
  return JSON.stringify([borrador.configuracion.fecha, borrador.configuracion.horaInicio, Number(borrador.configuracion.minutosDisponibles), plan?.seleccion])
}

export function guardarItinerarioLocal(idUsuario: number, borrador: BorradorIzamal): { guardado: ItinerarioLocal | null; error: string | null } {
  if (!esBorrador(borrador) || !calcularPlan(borrador).plan) return { guardado: null, error: 'Genera un plan válido antes de guardarlo.' }
  const lectura = leerItinerariosLocales(idUsuario)
  if (lectura.error) return { guardado: null, error: lectura.error }
  try {
    const existente = lectura.itinerarios.find(item => identidad(item.borrador) === identidad(borrador))
    if (existente) return { guardado: existente, error: null }
    const guardado: ItinerarioLocal = { id: `izamal:${encodeURIComponent(identidad(borrador))}`, guardadoEn: new Date().toISOString(), borrador }
    const texto = JSON.stringify({ version: 1, itinerarios: [...lectura.itinerarios, guardado] })
    localStorage.setItem(claveCuenta(idUsuario), texto)
    return { guardado, error: null }
  } catch {
    return { guardado: null, error: 'No se pudo guardar el itinerario en este navegador. Comprueba que el almacenamiento esté permitido y tenga espacio.' }
  }
}
