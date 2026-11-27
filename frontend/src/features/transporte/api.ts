import { api } from '../../services/api'
import { consultaApi, todasLasPaginas } from '../../utils/consultaApi'
import type { PaginaResultado } from '../../types/paginacion'
import type { RutaDetalle, RutaResumen } from './types'

export interface FiltroRutas { busqueda?: string; origen?: string; destino?: string; diaSemana?: number }
export const rutasApi = {
  listar: (filtros: FiltroRutas = {}, signal?: AbortSignal) => todasLasPaginas(pagina =>
    api.get<PaginaResultado<RutaResumen>>(`/rutas${consultaApi({ ...filtros, pagina, tamano: 100 })}`, signal)),
  obtener: (id: number, signal?: AbortSignal) => api.get<RutaDetalle>(`/rutas/${id}`, signal),
}
