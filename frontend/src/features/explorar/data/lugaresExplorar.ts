import { lugaresIzamal } from '../../mi-viaje/data/lugaresIzamal'
import { lugaresValladolid } from '../../mi-viaje/data/lugaresValladolid'
import { lugaresTekit } from '../../mi-viaje/data/lugaresTekit'
import { lugaresHomun } from '../../mi-viaje/data/lugaresHomun'
import { lugaresTicul } from '../../mi-viaje/data/lugaresTicul'
import izamalMercado from '../../../assets/explorar/izamal-mercado.jpg'
import izamalKinich from '../../../assets/explorar/izamal-kinich.jpg'
import izamalConvento from '../../../assets/explorar/izamal-convento.jpg'
import izamalPiramide from '../../../assets/explorar/izamal-piramide.jpg'
import valladolidZaci from '../../../assets/explorar/valladolid-zaci.jpg'
import valladolidMercado from '../../../assets/explorar/valladolid-mercado-donato.jpg'
import valladolidCalzada from '../../../assets/explorar/valladolid-calzada-frailes.jpg'
import valladolidConvento from '../../../assets/explorar/valladolid-san-bernardino.jpg'
import ticulIglesia from '../../../assets/explorar/ticul-iglesia-san-antonio.jpg'

export const destinosExplorar = [
  { id: 'izamal', nombre: 'Izamal' },
  { id: 'valladolid', nombre: 'Valladolid' },
  { id: 'tekit', nombre: 'Tekit' },
  { id: 'homun', nombre: 'Homún' },
  { id: 'ticul', nombre: 'Ticul' },
] as const

export type DestinoExplorar = typeof destinosExplorar[number]['id']
export interface LugarExplorar {
  id: string
  destino: DestinoExplorar
  destinoNombre: string
  nombre: string
  categoria: string
  categoriaNombre: string
  descripcion: string
  imagen?: { src: string; alt: string; credito: string; fuente: string }
}

const nombresCategoria: Record<string, string> = {
  gastronomia: 'Gastronomía', cultura: 'Cultura', monumentos: 'Monumentos',
  cenotes: 'Cenotes', textil: 'Artesanías y textiles', patrimonio: 'Patrimonio',
  artesanias: 'Artesanías',
}
type LugarFuente = { id: string; nombre: string; categoria: string; descripcion: string }
function adaptar(destino: DestinoExplorar, elementos: readonly LugarFuente[]): LugarExplorar[] {
  const destinoNombre = destinosExplorar.find(opcion => opcion.id === destino)!.nombre
  return elementos.map(lugar => ({
    id: lugar.id, destino, destinoNombre, nombre: lugar.nombre,
    categoria: lugar.categoria, categoriaNombre: nombresCategoria[lugar.categoria] ?? lugar.categoria,
    descripcion: lugar.descripcion,
  }))
}

interface FotografiaCommons { archivo: string; recurso: string; autor: string; licencia: string; fuente: string; alt: string }
const fotografiasVerificadas: Record<string, FotografiaCommons> = {
  'izamal:mercado': { archivo: 'Mercado Municipal De Izamal 02.jpg', recurso: izamalMercado, autor: 'Codas', licencia: 'CC BY-SA 4.0', fuente: 'https://commons.wikimedia.org/wiki/File:Mercado_Municipal_De_Izamal_02.jpg', alt: 'Interior del Mercado Municipal de Izamal' },
  'izamal:kinich': { archivo: 'Restaurante Kinich, Izamal, Yucatan, Mexico - Abril 2021.jpg', recurso: izamalKinich, autor: 'Sharon Hahn Darlin', licencia: 'CC BY 2.0', fuente: 'https://commons.wikimedia.org/wiki/File:Restaurante_Kinich,_Izamal,_Yucatan,_Mexico_-_Abril_2021.jpg', alt: 'Fachada del restaurante Kinich en Izamal' },
  'izamal:convento': { archivo: 'Corredores del Convento de San Antonio de Padua en Izamal.jpg', recurso: izamalConvento, autor: 'Lorena Allende', licencia: 'CC BY-SA 4.0', fuente: 'https://commons.wikimedia.org/wiki/File:Corredores_del_Convento_de_San_Antonio_de_Padua_en_Izamal.jpg', alt: 'Arcadas del convento de San Antonio de Padua en Izamal' },
  'izamal:piramide': { archivo: 'Piramide Kinich Izamal.jpg', recurso: izamalPiramide, autor: 'Patrickrichaud', licencia: 'CC BY-SA 4.0', fuente: 'https://commons.wikimedia.org/wiki/File:Piramide_Kinich_Izamal.jpg', alt: 'Pirámide Kinich Kakmó en Izamal' },
  'valladolid:zaci': { archivo: 'Cenote Zací 01.jpg', recurso: valladolidZaci, autor: 'Haakon S. Krohn', licencia: 'CC BY 4.0', fuente: 'https://commons.wikimedia.org/wiki/File:Cenote_Zac%C3%AD_01.jpg', alt: 'Cenote Zací en Valladolid' },
  'valladolid:mercado-donato': { archivo: 'Mercado Municipal de Valladolid, Yucatán.jpg', recurso: valladolidMercado, autor: 'Jars.b', licencia: 'CC BY-SA 4.0', fuente: 'https://commons.wikimedia.org/wiki/File:Mercado_Municipal_de_Valladolid,_Yucat%C3%A1n.jpg', alt: 'Mercado Municipal General Donato Bates de Valladolid' },
  'valladolid:calzada-frailes': { archivo: 'Calzada frailes.jpg', recurso: valladolidCalzada, autor: 'Alcocermr', licencia: 'Dominio público', fuente: 'https://commons.wikimedia.org/wiki/File:Calzada_frailes.jpg', alt: 'Calzada de los Frailes en Valladolid' },
  'valladolid:san-bernardino': { archivo: 'Convento de San Bernardino de Siena.jpg', recurso: valladolidConvento, autor: 'Haakon S. Krohn', licencia: 'CC BY 4.0', fuente: 'https://commons.wikimedia.org/wiki/File:Convento_de_San_Bernardino_de_Siena.jpg', alt: 'Convento de San Bernardino de Siena en Valladolid' },
  'ticul:iglesia-san-antonio': { archivo: 'Parroquia San Antonio de Padua - Ticul, Yucatán México.jpg', recurso: ticulIglesia, autor: 'Joanygg90', licencia: 'CC BY-SA 4.0', fuente: 'https://commons.wikimedia.org/wiki/File:Parroquia_San_Antonio_de_Padua_-_Ticul,_Yucat%C3%A1n_M%C3%A9xico.jpg', alt: 'Parroquia de San Antonio de Padua en Ticul' },
}

function fotografia(lugar: LugarExplorar): LugarExplorar['imagen'] {
  const recurso = fotografiasVerificadas[`${lugar.destino}:${lugar.id}`]
  if (!recurso) return undefined
  return {
    src: recurso.recurso,
    alt: recurso.alt,
    credito: `${recurso.autor} · ${recurso.licencia} · Wikimedia Commons`,
    fuente: recurso.fuente,
  }
}

export const lugaresExplorar: LugarExplorar[] = [
  ...adaptar('izamal', lugaresIzamal),
  ...adaptar('valladolid', lugaresValladolid),
  ...adaptar('tekit', lugaresTekit),
  ...adaptar('homun', lugaresHomun),
  ...adaptar('ticul', lugaresTicul),
].map(lugar => ({ ...lugar, imagen: fotografia(lugar) }))

export const categoriasExplorar = [...new Set(lugaresExplorar.map(lugar => lugar.categoria))]
  .map(id => ({ id, nombre: nombresCategoria[id] ?? id }))

export function buscarLugares(texto: string, destino = '', categoria = ''): LugarExplorar[] {
  const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim()
  const consulta = normalizar(texto)
  return lugaresExplorar.filter(lugar =>
    (!destino || lugar.destino === destino) && (!categoria || lugar.categoria === categoria) &&
    (!consulta || normalizar(`${lugar.nombre} ${lugar.descripcion} ${lugar.destinoNombre} ${lugar.categoriaNombre}`).includes(consulta)),
  )
}
