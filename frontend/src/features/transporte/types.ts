/** Contratos de RutasDtos, MapaRutaDtos y TarifasDtos. RF03 / CU-03. */
export interface RutaResumen {
  idRuta: number; codigo: string; titulo: string; descripcion: string | null
  origen: string; destino: string; totalParadas: number; tarifaAproximada: number | null
  proximaSalida: string | null; estadoCupo: string; asientosDisponibles: number | null
  fotoPrincipal: string | null; actualizadoEn: string
}
export interface Fotografia {
  idFotografia: number; urlArchivo: string; textoAlternativo: string; orden: number
}
export interface PuntoMapa { orden: number; latitud: number; longitud: number }
export interface ParadaMapa extends PuntoMapa {
  idUbicacion: number; direccionReferencia: string | null; idLocalidad: number
  localidad: string; idMunicipio: number; municipio: string
  permiteAbordar: boolean; permiteDescender: boolean
}
export interface HorarioRuta {
  idHorario: number; diaSemana: number; horaSalida: string
  vigenteDesde: string; vigenteHasta: string | null
}
export interface TarifaVigente {
  idTarifa: number; idRuta: number; ordenOrigen: number; localidadOrigen: string
  ordenDestino: number; localidadDestino: string; monto: number
  vigenteDesde: string; vigenteHasta: string | null
}
export interface RutaRegreso {
  idRuta: number; codigo: string; titulo: string; origen: string; destino: string
  tarifaAproximada: number | null
}
export interface SalidaConCupo {
  idSalida: number; idRuta: number; unidad: string; salidaProgramada: string
  capacidadHabilitada: number; estadoSalida: string; estadoCupo: string
  asientosDisponibles: number | null; registradoEn: string | null; validoHasta: string | null
}
export interface RutaDetalle {
  idRuta: number; codigo: string; titulo: string; descripcion: string | null
  actualizadoEn: string; notaTarifa: string; fotografias: Fotografia[]
  paradas: ParadaMapa[]; puntosRecorrido: PuntoMapa[]; horarios: HorarioRuta[]
  tarifas: TarifaVigente[]; rutasRegreso: RutaRegreso[]; proximasSalidas: SalidaConCupo[]
}
