import { leerBorradorIzamal, urlBorrador } from './borradorIzamal'
import { crearBorradorValladolid, urlBorradorValladolid } from './borradorValladolid'
import { crearBorradorTekit, urlBorradorTekit } from './borradorTekit'
import { crearBorradorHomun, urlBorradorHomun } from './borradorHomun'
import { crearBorradorTicul, urlBorradorTicul } from './borradorTicul'

export type DestinoPlanificador = 'izamal' | 'valladolid' | 'tekit' | 'homun' | 'ticul'
export type ModoPlanificador = 'recomendado' | 'personalizado'

/** Enlaces iniciales a los planificadores existentes, sin crear ni persistir borradores. */
export function urlPlanificador(destino: DestinoPlanificador, modo: ModoPlanificador): string {
  const pantalla = modo === 'recomendado' ? 'itinerario' : 'personalizar'
  if (destino === 'izamal') return urlBorrador(pantalla, { ...leerBorradorIzamal(new URLSearchParams()), modo })
  if (destino === 'valladolid') return urlBorradorValladolid(pantalla, crearBorradorValladolid('medio-dia', modo))
  if (destino === 'tekit') return urlBorradorTekit(pantalla, crearBorradorTekit('medio-dia', modo))
  if (destino === 'homun') return urlBorradorHomun(pantalla, crearBorradorHomun('medio-dia', modo))
  return urlBorradorTicul(pantalla, crearBorradorTicul('medio-dia', modo))
}
