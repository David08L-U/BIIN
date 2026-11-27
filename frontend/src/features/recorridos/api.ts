import { api } from '../../services/api'
import { consultaApi, todasLasPaginas } from '../../utils/consultaApi'
import type { PaginaResultado } from '../../types/paginacion'
import type { RecorridoDetalle, RecorridoResumen } from './types'

export const recorridosApi = {
  listar: (filtros: { idLocalidadBase?: number; busqueda?: string } = {}, signal?: AbortSignal) => todasLasPaginas(pagina =>
    api.get<PaginaResultado<RecorridoResumen>>(`/recorridos${consultaApi({ ...filtros, pagina, tamano: 100 })}`, signal)),
  obtener: (id: number, signal?: AbortSignal) => api.get<RecorridoDetalle>(`/recorridos/${id}`, signal),
}
