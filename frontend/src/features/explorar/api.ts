import { api } from '../../services/api'
import { consultaApi, todasLasPaginas } from '../../utils/consultaApi'
import type { PaginaResultado } from '../../types/paginacion'
import type { ContenidoDetalle, RecursoPublicado, TipoContenido } from './types'

const endpoints: Record<TipoContenido, string> = { lugar: 'lugares', negocio: 'negocios', evento: 'eventos' }
export const esTipoContenido = (valor: string | undefined): valor is TipoContenido =>
  valor === 'lugar' || valor === 'negocio' || valor === 'evento'

export const contenidosApi = {
  listar: (filtros: { busqueda?: string; tipo?: TipoContenido; idLocalidad?: number } = {}, signal?: AbortSignal) => todasLasPaginas(pagina =>
    api.get<PaginaResultado<RecursoPublicado>>(`/explorar${consultaApi({ ...filtros, pagina, tamano: 100 })}`, signal)),
  obtener: (tipo: TipoContenido, id: number, signal?: AbortSignal) =>
    api.get<ContenidoDetalle>(`/${endpoints[tipo]}/${id}`, signal),
}
