import type { TipoRecursoItinerario } from '../mi-viaje/api'

/** Recorridos sugeridos publicados en PostgreSQL. CU-13. */
export interface RecorridoResumen {
  idRecorrido: number; titulo: string; descripcion: string | null
  idLocalidadBase: number; localidadBase: string; idMunicipio: number; municipio: string
  totalEtapas: number; duracionTotalMin: number; fotoPrincipal: string | null; actualizadoEn: string
}
export interface EtapaRecorrido {
  orden: number; idRecurso: number; tipo: TipoRecursoItinerario
  titulo: string; descripcion: string | null; duracionSugeridaMin: number | null
  latitud: number | null; longitud: number | null; localidad: string | null
  fotoPrincipal: string | null; disponible: boolean; aviso: string | null
}
export interface RecorridoDetalle {
  idRecorrido: number; titulo: string; descripcion: string | null
  idLocalidadBase: number; localidadBase: string; idMunicipio: number; municipio: string
  duracionTotalMin: number; actualizadoEn: string; etapas: EtapaRecorrido[]
}
