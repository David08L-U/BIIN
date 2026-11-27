import type { DatosDetalle } from '../transporte/components/DetalleDestino'
import type { RutaPrototipo } from '../transporte/data/rutasPrototipo'

export type DestinoId = 'izamal' | 'valladolid' | 'tekit' | 'homun' | 'ticul'
export type ModoDestino = 'recomendado' | 'personalizado'
export type PantallaDestino = 'detalle' | 'itinerario' | 'personalizar'

/** Modelo de presentación local. No implica que el catálogo ya venga de la API. */
export interface DefinicionDestino {
  readonly id: DestinoId
  readonly ruta: RutaPrototipo
  readonly detalle: DatosDetalle<string>
  readonly tieneReferenciaSalida: boolean
  leerEstancia(parametros: URLSearchParams): string
  cambiarEstancia(parametros: URLSearchParams, estancia: string): URLSearchParams
  urlPlanificador(parametros: URLSearchParams, modo: ModoDestino): string
  urlBorrador(parametros: URLSearchParams, pantalla: PantallaDestino): string
}

/** Capacidades que consume la composición común de las tres páginas. */
export interface CapacidadPlanificador<Draft, Plan> {
  leer(parametros: URLSearchParams, modo?: ModoDestino): Draft
  serializar(borrador: Draft): URLSearchParams
  calcular(borrador: Draft): { plan: Plan | null; errores: string[] }
}
