import type { Fotografia } from '../transporte/types'

export type TipoContenido = 'lugar' | 'negocio' | 'evento'
export interface RecursoPublicado {
  idRecurso: number; tipo: TipoContenido; titulo: string; descripcion: string | null
  localidad: string | null; municipio: string | null; latitud: number | null
  longitud: number | null; categorias: string[]; actualizadoEn: string
}
/** Campos comunes y específicos de Lugar/Negocio/EventoDetalleDto. RF05-07. */
export interface ContenidoDetalle {
  idRecurso: number; titulo: string; descripcion: string | null; actualizadoEn: string
  ubicacion: { idLocalidad: number; localidad: string; municipio: string; direccionReferencia: string | null; latitud: number; longitud: number }
  categorias: { idCategoria: number; nombre: string }[]; fotografias: Fotografia[]
  costoAcceso?: number | null; condicionesAcceso?: string | null
  precioMinimoAprox?: number | null; precioMaximoAprox?: number | null
  inicio?: string; fin?: string; costoEntrada?: number | null; estadoEvento?: string
  abiertoAhora?: boolean | null
  horarios?: { diaSemana: number; horaApertura: string; horaCierre: string }[]
}
