import type { DestinoPlanificador } from './urlsPlanificador'
import type { ItinerarioGuardado } from '../storage/itinerariosLocales'
import { leerBorradorIzamal, urlBorrador } from './borradorIzamal'
import { leerBorradorValladolid, urlBorradorValladolid } from './borradorValladolid'
import { leerBorradorTekit, urlBorradorTekit } from './borradorTekit'
import { leerBorradorHomun, urlBorradorHomun } from './borradorHomun'
import { leerBorradorTicul, urlBorradorTicul } from './borradorTicul'
import { urlPlanificador } from './urlsPlanificador'

/** Produce una URL de personalización conservando el motor, la modalidad y las jornadas del destino. */
export function urlAgregarLugar(destino: DestinoPlanificador, lugarId: string, origen?: string, editarId?: string, dia = 1): string {
  const base = origen ?? urlPlanificador(destino, 'personalizado')
  const parametros = new URLSearchParams(base.split('?')[1] ?? '')
  if (destino === 'izamal') {
    const borrador = leerBorradorIzamal(parametros)
    return urlBorrador('personalizar', { ...borrador, modo: 'personalizado', generado: false, editarId, seleccion: borrador.seleccion.includes(lugarId) ? borrador.seleccion : [...borrador.seleccion, lugarId] })
  }
  if (destino === 'valladolid') {
    const borrador = leerBorradorValladolid(parametros, 'personalizado')
    const seleccion = borrador.seleccion.some(v => v.lugarId === lugarId) ? borrador.seleccion : [...borrador.seleccion, { lugarId, dia }]
    return urlBorradorValladolid('personalizar', { ...borrador, modo: 'personalizado', generado: false, editarId, seleccion })
  }
  if (destino === 'tekit') {
    const borrador = leerBorradorTekit(parametros, 'personalizado')
    const seleccion = borrador.seleccion.includes(lugarId) ? borrador.seleccion : [...borrador.seleccion, lugarId]
    return urlBorradorTekit('personalizar', { ...borrador, modo: 'personalizado', generado: false, editarId, seleccion })
  }
  if (destino === 'homun') {
    const borrador = leerBorradorHomun(parametros, 'personalizado')
    const seleccion = borrador.seleccion.some(v => v.lugarId === lugarId) ? borrador.seleccion : [...borrador.seleccion, { lugarId, dia }]
    return urlBorradorHomun('personalizar', { ...borrador, modo: 'personalizado', generado: false, editarId, seleccion })
  }
  const borrador = leerBorradorTicul(parametros, 'personalizado')
  const seleccion = borrador.seleccion.includes(lugarId) ? borrador.seleccion : [...borrador.seleccion, lugarId]
  return urlBorradorTicul('personalizar', { ...borrador, modo: 'personalizado', generado: false, editarId, seleccion })
}

export function urlAgregarLugarGuardado(item: ItinerarioGuardado, lugarId: string, dia = 1): string {
  if (item.destino === 'valladolid') return urlAgregarLugar('valladolid', lugarId, urlBorradorValladolid('personalizar', item.borrador), item.id, dia)
  if (item.destino === 'tekit') return urlAgregarLugar('tekit', lugarId, urlBorradorTekit('personalizar', item.borrador), item.id, dia)
  if (item.destino === 'homun') return urlAgregarLugar('homun', lugarId, urlBorradorHomun('personalizar', item.borrador), item.id, dia)
  if (item.destino === 'ticul') return urlAgregarLugar('ticul', lugarId, urlBorradorTicul('personalizar', item.borrador), item.id, dia)
  return urlAgregarLugar('izamal', lugarId, urlBorrador('personalizar', item.borrador), item.id, dia)
}
