import { api } from '../../services/api'

/**
 * Cliente HTTP tipado alineado con ItinerariosController (/api/itinerarios, esquema 3FN:
 * tablas itinerarios + actividades_itinerario). CU-09, CU-13, RF09.
 */

export type TipoRecursoItinerario = 'ruta' | 'negocio' | 'evento' | 'lugar'

export type TipoAdvertenciaItinerario =
  | 'conflicto_horario'
  | 'traslado_insuficiente'
  | 'fuera_de_fechas'
  | 'fuera_de_horario'
  | 'evento_cancelado'
  | 'contenido_no_disponible'

export interface ItinerarioResumenDto {
  idItinerario: number
  nombre: string
  inicio: string
  fin: string
  presupuestoEstimado: number | null
  totalActividades: number
  fechaCreacion: string
}

export interface TrasladoEstimadoDto {
  distanciaKm: number
  minutosEstimados: number
}

export interface ActividadItinerarioDto {
  idActividad: number
  orden: number
  idRecurso: number
  tipo: TipoRecursoItinerario
  titulo: string
  disponible: boolean
  inicioPrevisto: string | null
  finPrevisto: string | null
  notas: string | null
  localidad: string | null
  latitud: number | null
  longitud: number | null
  trasladoDesdeAnterior: TrasladoEstimadoDto | null
}

export interface AdvertenciaItinerarioDto {
  tipo: TipoAdvertenciaItinerario | string
  mensaje: string
  idActividades: number[]
}

export interface ItinerarioDetalleDto {
  idItinerario: number
  nombre: string
  inicio: string
  fin: string
  presupuestoEstimado: number | null
  fechaCreacion: string
  actividades: ActividadItinerarioDto[]
  advertencias: AdvertenciaItinerarioDto[]
}

export interface CrearItinerarioRequest {
  nombre: string
  inicio: string
  fin: string
  presupuestoEstimado?: number | null
}

export interface CrearItinerarioDesdeRecorridoRequest {
  inicio: string
  fin?: string | null
  nombre?: string | null
  presupuestoEstimado?: number | null
  /** Hora local de Yucatán en formato HH:mm:ss (ej. "09:00:00"). */
  horaInicioLocal?: string | null
}

export interface ActualizarItinerarioRequest {
  nombre: string
  inicio: string
  fin: string
  presupuestoEstimado?: number | null
}

export interface AgregarActividadRequest {
  idRecurso: number
  inicioPrevisto?: string | null
  finPrevisto?: string | null
  notas?: string | null
}

export interface ActualizarActividadRequest {
  inicioPrevisto: string | null
  finPrevisto: string | null
  notas: string | null
}

export interface ReordenarActividadesRequest {
  idActividades: number[]
}

export const itinerariosApi = {
  listar: (signal?: AbortSignal) => api.get<ItinerarioResumenDto[]>('/itinerarios', signal),
  obtener: (id: number, signal?: AbortSignal) => api.get<ItinerarioDetalleDto>(`/itinerarios/${id}`, signal),
  crear: (datos: CrearItinerarioRequest) => api.post<ItinerarioDetalleDto>('/itinerarios', datos),
  crearDesdeRecorrido: (idRecorrido: number, datos: CrearItinerarioDesdeRecorridoRequest) =>
    api.post<ItinerarioDetalleDto>(`/itinerarios/desde-recorrido/${idRecorrido}`, datos),
  actualizar: (id: number, datos: ActualizarItinerarioRequest) =>
    api.put<ItinerarioDetalleDto>(`/itinerarios/${id}`, datos),
  eliminar: (id: number) => api.delete<void>(`/itinerarios/${id}`),
  agregarActividad: (id: number, datos: AgregarActividadRequest) =>
    api.post<ItinerarioDetalleDto>(`/itinerarios/${id}/actividades`, datos),
  actualizarActividad: (id: number, idActividad: number, datos: ActualizarActividadRequest) =>
    api.put<ItinerarioDetalleDto>(`/itinerarios/${id}/actividades/${idActividad}`, datos),
  quitarActividad: (id: number, idActividad: number) =>
    api.delete<ItinerarioDetalleDto>(`/itinerarios/${id}/actividades/${idActividad}`),
  reordenarActividades: (id: number, datos: ReordenarActividadesRequest) =>
    api.put<ItinerarioDetalleDto>(`/itinerarios/${id}/actividades/orden`, datos),
}
