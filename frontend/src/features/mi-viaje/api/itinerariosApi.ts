import { api } from '../../../services/api'
import type { ItinerarioGuardado } from '../storage/itinerariosLocales'
import type { BorradorIzamal } from '../plan/itinerarioIzamal'
import type { BorradorValladolid } from '../plan/itinerarioValladolid'
import type { BorradorTekit } from '../plan/itinerarioTekit'
import type { BorradorHomun } from '../plan/itinerarioHomun'
import type { BorradorTicul } from '../plan/itinerarioTicul'

export type BorradorGuardable = BorradorIzamal | BorradorValladolid | BorradorTekit | BorradorHomun | BorradorTicul
type Destino = NonNullable<ItinerarioGuardado['destino']>

interface ItinerarioApiDto {
  idItinerario: number
  guardadoEn: string
  destino: Destino
  borrador: BorradorGuardable
}

export interface ItinerarioAnteriorApiDto {
  idItinerario: number
  nombre: string
  inicio: string
  fin: string
  guardadoEn: string
  actividadesRegistradas: number
}

interface GuardarRequest {
  destino: Destino
  borrador: BorradorGuardable
  zonaHoraria: string
}

function destinoDe(borrador: BorradorGuardable): Destino {
  return 'destino' in borrador && borrador.destino ? borrador.destino : 'izamal'
}

function preparar(borrador: BorradorGuardable): GuardarRequest {
  const { editarId: _editarId, ...datos } = borrador
  const destino = destinoDe(borrador)
  return {
    destino,
    zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    borrador: { ...datos, destino, generado: true } as BorradorGuardable,
  }
}

function convertir(dto: ItinerarioApiDto): ItinerarioGuardado {
  if (!Number.isSafeInteger(dto.idItinerario) || dto.idItinerario <= 0 || !['izamal', 'valladolid', 'tekit', 'homun', 'ticul'].includes(dto.destino)) {
    throw new Error('El servidor devolvió un itinerario con datos inválidos.')
  }
  return {
    destino: dto.destino,
    id: `servidor:${dto.idItinerario}`,
    guardadoEn: dto.guardadoEn,
    borrador: dto.borrador,
  } as ItinerarioGuardado
}

export function idServidorItinerario(id: string): number | null {
  const coincidencia = /^servidor:(\d+)$/.exec(id)
  if (!coincidencia) return null
  const valor = Number(coincidencia[1])
  return Number.isSafeInteger(valor) && valor > 0 ? valor : null
}

export const itinerariosApi = {
  async listar(): Promise<ItinerarioGuardado[]> {
    const datos = await api.get<ItinerarioApiDto[]>('/itinerarios')
    if (!Array.isArray(datos)) throw new Error('El servidor devolvió una lista inválida de itinerarios.')
    return datos.map(convertir)
  },
  async listarAnteriores(): Promise<ItinerarioAnteriorApiDto[]> {
    const datos = await api.get<ItinerarioAnteriorApiDto[]>('/itinerarios/anteriores')
    if (!Array.isArray(datos) || datos.some(item => !Number.isSafeInteger(item.idItinerario) || item.idItinerario <= 0)) {
      throw new Error('El servidor devolvió una lista inválida de itinerarios anteriores.')
    }
    return datos
  },
  async obtener(id: string): Promise<ItinerarioGuardado> {
    const idServidor = idServidorItinerario(id)
    if (idServidor === null) throw new Error('El identificador del itinerario no es válido.')
    return convertir(await api.get<ItinerarioApiDto>(`/itinerarios/${idServidor}`))
  },
  async guardar(borrador: BorradorGuardable, editarId?: string): Promise<ItinerarioGuardado> {
    const request = preparar(borrador)
    const idServidor = editarId ? idServidorItinerario(editarId) : null
    const respuesta = editarId && idServidor !== null
      ? await api.put<ItinerarioApiDto>(`/itinerarios/${idServidor}`, request)
      : await api.post<ItinerarioApiDto>('/itinerarios', request)
    return convertir(respuesta)
  },
  async eliminar(id: string): Promise<void> {
    const idServidor = idServidorItinerario(id)
    if (idServidor === null) throw new Error('El identificador del itinerario no es válido.')
    await api.delete<void>(`/itinerarios/${idServidor}`)
  },
}

/** Clave estable para detectar en la UI locales ya importados; la API también impide duplicados. */
export function claveBorradorItinerario(item: Pick<ItinerarioGuardado, 'destino' | 'borrador'>): string {
  const ordenar = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(ordenar)
    if (typeof value !== 'object' || value === null) return value
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => key !== 'editarId')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, ordenar(entry)]))
  }
  return JSON.stringify([item.destino ?? 'izamal', ordenar(item.borrador)])
}
