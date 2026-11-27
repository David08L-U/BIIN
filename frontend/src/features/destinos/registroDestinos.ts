import type { DefinicionDestino, DestinoId, ModoDestino, PantallaDestino } from './contratos'
import { rutasPrototipo } from '../transporte/data/rutasPrototipo'
import { detalleIzamalPrototipo } from '../transporte/data/detalleIzamalPrototipo'
import { detalleValladolidPrototipo } from '../transporte/data/detalleValladolidPrototipo'
import { detalleTekitPrototipo } from '../transporte/data/detalleTekitPrototipo'
import { detalleHomunPrototipo } from '../transporte/data/detalleHomunPrototipo'
import { detalleTiculPrototipo } from '../transporte/data/detalleTiculPrototipo'
import { leerBorradorIzamal, cambiarEstanciaIzamal, urlBorrador } from '../mi-viaje/plan/borradorIzamal'
import { leerBorradorValladolid, cambiarEstanciaValladolid, urlBorradorValladolid } from '../mi-viaje/plan/borradorValladolid'
import { leerBorradorTekit, cambiarModalidadTekit, urlBorradorTekit } from '../mi-viaje/plan/borradorTekit'
import { leerBorradorHomun, cambiarEstanciaHomun, urlBorradorHomun } from '../mi-viaje/plan/borradorHomun'
import { leerBorradorTicul, cambiarModalidadTicul, urlBorradorTicul } from '../mi-viaje/plan/borradorTicul'
import { estanciasValladolid } from '../mi-viaje/plan/itinerarioValladolid'
import { estanciasHomun } from '../mi-viaje/plan/itinerarioHomun'

function serializarDetalle(destino: DestinoId, parametros: URLSearchParams, estancia: string): URLSearchParams {
  if (destino === 'izamal') {
    const borrador = leerBorradorIzamal(parametros)
    const nueva = cambiarEstanciaIzamal(borrador.configuracion, estancia)
    return new URL(urlBorrador('detalle', { ...borrador, configuracion: nueva }), 'https://biin.local').searchParams
  }
  if (destino === 'valladolid') {
    if (!Object.hasOwn(estanciasValladolid, estancia)) return parametros
    const borrador = leerBorradorValladolid(parametros)
    return new URL(urlBorradorValladolid('detalle', cambiarEstanciaValladolid(borrador, estancia as keyof typeof estanciasValladolid)), 'https://biin.local').searchParams
  }
  if (destino === 'tekit') {
    const borrador = leerBorradorTekit(parametros)
    return new URL(urlBorradorTekit('detalle', cambiarModalidadTekit(borrador, estancia)), 'https://biin.local').searchParams
  }
  if (destino === 'homun') {
    if (!Object.hasOwn(estanciasHomun, estancia)) return parametros
    const borrador = leerBorradorHomun(parametros)
    return new URL(urlBorradorHomun('detalle', cambiarEstanciaHomun(borrador, estancia as keyof typeof estanciasHomun)), 'https://biin.local').searchParams
  }
  const borrador = leerBorradorTicul(parametros)
  return new URL(urlBorradorTicul('detalle', cambiarModalidadTicul(borrador, estancia)), 'https://biin.local').searchParams
}

function urlDestino(destino: DestinoId, parametros: URLSearchParams, pantalla: PantallaDestino, modo: ModoDestino = 'recomendado'): string {
  if (destino === 'izamal') return urlBorrador(pantalla, { ...leerBorradorIzamal(parametros), modo, generado: false })
  if (destino === 'valladolid') return urlBorradorValladolid(pantalla, { ...leerBorradorValladolid(parametros), modo, generado: false })
  if (destino === 'tekit') return urlBorradorTekit(pantalla, { ...leerBorradorTekit(parametros), modo, generado: false })
  if (destino === 'homun') return urlBorradorHomun(pantalla, { ...leerBorradorHomun(parametros), modo, generado: false })
  return urlBorradorTicul(pantalla, { ...leerBorradorTicul(parametros), modo, generado: false })
}

const rutas = Object.fromEntries(rutasPrototipo.map(ruta => [ruta.id, ruta])) as Record<DestinoId, (typeof rutasPrototipo)[number]>

const destinos: Record<DestinoId, DefinicionDestino> = {
  izamal: {
    id: 'izamal', ruta: rutas.izamal, tieneReferenciaSalida: false,
    leerEstancia: p => leerBorradorIzamal(p).configuracion.estancia,
    cambiarEstancia: (p, v) => serializarDetalle('izamal', p, v),
    urlPlanificador: (p, m) => urlDestino('izamal', p, m === 'recomendado' ? 'itinerario' : 'personalizar', m),
    urlBorrador: (p, pantalla) => urlDestino('izamal', p, pantalla),
    detalle: { ...detalleIzamalPrototipo, opciones: detalleIzamalPrototipo.estancias.map(o => ({ ...o, duracion: o.duracion })), etiqueta: 'Ruta Directa Van', puebloMagico: true,
      descripcion: 'La Ciudad de las Tres Culturas · Yucatán', terminal: 'Terminal Noreste · Calle 67', referenciaTerminal: 'Mérida Centro Histórico', corredor: 'Trayecto Carretera Mérida-Tixkokob-Izamal',
      referenciaCultural: 'Convento Franciscano · Pirámide Kinich Kakmó · Gastronomía', altCultural: 'Atrio y arcadas amarillas del convento de San Antonio de Padua en Izamal', etiquetaCultural: 'Pueblo Mágico Amarillo',
      notaDatos: 'Tarifa y recorrido por confirmar.', notaRecorrido: `El detalle original indica ${detalleIzamalPrototipo.tiempo}; el catálogo, ${rutas.izamal.tiempo}. Tiempos pendientes de validar. El origen es ilustrativo; no representa tu ubicación.`,
      notaRegreso: 'Horarios y opciones de regreso: sin confirmar. Verifica con la terminal antes de viajar.' },
  },
  valladolid: {
    id: 'valladolid', ruta: rutas.valladolid, tieneReferenciaSalida: false,
    leerEstancia: p => leerBorradorValladolid(p).configuracion.estancia,
    cambiarEstancia: (p, v) => serializarDetalle('valladolid', p, v),
    urlPlanificador: (p, m) => urlDestino('valladolid', p, m === 'recomendado' ? 'itinerario' : 'personalizar', m),
    urlBorrador: (p, pantalla) => urlDestino('valladolid', p, pantalla),
    detalle: { ...detalleValladolidPrototipo, opciones: detalleValladolidPrototipo.estancias, corredor: detalleValladolidPrototipo.carretera, tiempo: `~${rutas.valladolid.tiempo}`,
      referenciaCultural: 'Calzada de los Frailes · Cenote Zací · Gastronomía Colonial', altCultural: 'Convento San Bernardino de Valladolid, imagen cultural de referencia', leyenda: 'Tiempo disponible estimado', tituloPrecio: 'Tarifa',
      altMapa: 'Mapa ilustrativo de Mérida a Valladolid', notaMapa: 'Distancia sin validar', notaDatos: 'Tarifa, duración y recorrido por confirmar. Horarios, andén y distancia sin confirmar.' },
  },
  tekit: {
    id: 'tekit', ruta: rutas.tekit, tieneReferenciaSalida: true,
    leerEstancia: p => leerBorradorTekit(p).configuracion.estancia,
    cambiarEstancia: (p, v) => serializarDetalle('tekit', p, v),
    urlPlanificador: (p, m) => urlDestino('tekit', p, m === 'recomendado' ? 'itinerario' : 'personalizar', m),
    urlBorrador: (p, pantalla) => urlDestino('tekit', p, pantalla),
    detalle: { ...detalleTekitPrototipo, opciones: detalleTekitPrototipo.opciones.map(o => ({ ...o, duracion: o.detalle })), corredor: detalleTekitPrototipo.carretera,
      tiempo: `Tiempo estimado de viaje · ~${rutas.tekit.tiempo}`, referenciaCultural: 'Ruta Textil · Talleres de Bordado · Gastronomía Local', altCultural: 'Fotografía representativa de Tekit pendiente de verificar',
      leyenda: 'Estancia o modalidad de visita', tituloPrecio: 'Tarifa', notaPrecio: 'Por validar', etiquetaLugares: 'Lugares destacados de Tekit',
      notaDatos: 'Tarifa, duración y recorrido por confirmar. Salida, horarios, disponibilidad y medios de pago sin confirmar.' },
  },
  homun: {
    id: 'homun', ruta: rutas.homun, tieneReferenciaSalida: false,
    leerEstancia: p => leerBorradorHomun(p).configuracion.estancia,
    cambiarEstancia: (p, v) => serializarDetalle('homun', p, v),
    urlPlanificador: (p, m) => urlDestino('homun', p, m === 'recomendado' ? 'itinerario' : 'personalizar', m),
    urlBorrador: (p, pantalla) => urlDestino('homun', p, pantalla),
    detalle: { ...detalleHomunPrototipo, opciones: detalleHomunPrototipo.estancias, tiempo: `~${rutas.homun.tiempo}`, altCultural: 'Fotografía representativa de Homún pendiente de verificar',
      leyenda: 'Tiempo disponible estimado', tituloPrecio: 'Pasaje', etiquetaLugares: 'Lugares destacados de Homún', notaDatos: 'Tarifa, duración y recorrido por confirmar. Salida, horarios y disponibilidad sin confirmar.' },
  },
  ticul: {
    id: 'ticul', ruta: rutas.ticul, tieneReferenciaSalida: false,
    leerEstancia: p => leerBorradorTicul(p).configuracion.estancia,
    cambiarEstancia: (p, v) => serializarDetalle('ticul', p, v),
    urlPlanificador: (p, m) => urlDestino('ticul', p, m === 'recomendado' ? 'itinerario' : 'personalizar', m),
    urlBorrador: (p, pantalla) => urlDestino('ticul', p, pantalla),
    detalle: { ...detalleTiculPrototipo, opciones: detalleTiculPrototipo.estancias, corredor: detalleTiculPrototipo.referenciaMapa, tiempo: `Duración aproximada · ~${rutas.ticul.tiempo}`,
      notaRecorrido: detalleTiculPrototipo.corredor, altCultural: 'Parroquia de San Antonio de Padua en Ticul', leyenda: 'Estancia o modalidad', tituloPrecio: 'Tarifa por pasaje',
      notaMapa: 'Mapa ilustrativo · Sin verificar', notaPrecio: 'Medios de pago sin confirmar', distintivo: 'Top Destino del Sur', etiquetaLugares: 'Lugares destacados de Ticul', notaDatos: 'Tarifa, duración y recorrido por confirmar.' },
  },
}

export const idsDestino = Object.keys(destinos) as DestinoId[]
export function obtenerDestino(id: string | undefined): DefinicionDestino | undefined {
  return id && Object.hasOwn(destinos, id) ? destinos[id as DestinoId] : undefined
}
export function detalleParaEstancia(destino: DefinicionDestino, estancia: string) {
  const detalle = destino.detalle
  if (destino.id === 'izamal') return { ...detalle, opciones: detalle.opciones.filter(o => o.id !== 'tarde-magica' || estancia === 'tarde-magica') }
  if (destino.id === 'tekit') return { ...detalle, opciones: detalle.opciones.filter(o => o.id !== 'ruta-textil' || estancia === 'ruta-textil') }
  if (destino.id === 'ticul') return { ...detalle, opciones: detalle.opciones.filter(o => o.id !== 'tour-compras' || estancia === 'tour-compras') }
  return detalle
}
export function urlDestinoDesdeBorrador(id: DestinoId, parametros: URLSearchParams, pantalla: PantallaDestino): string {
  return destinos[id].urlBorrador(parametros, pantalla)
}
