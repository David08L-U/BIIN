import { lugaresIzamal } from '../../mi-viaje/data/lugaresIzamal'
import { imagenesItinerarioIzamal } from '../../mi-viaje/data/imagenesItinerarioIzamal'
import { lugaresValladolid } from '../../mi-viaje/data/lugaresValladolid'
import { lugaresTekit } from '../../mi-viaje/data/lugaresTekit'
import { detalleTekitPrototipo } from '../../transporte/data/detalleTekitPrototipo'
import { lugaresHomun } from '../../mi-viaje/data/lugaresHomun'
import { lugaresTicul } from '../../mi-viaje/data/lugaresTicul'

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
  imagen?: { src: string; alt: string }
}

const nombresCategoria: Record<string, string> = {
  gastronomia: 'Gastronomía', cultura: 'Cultura', monumentos: 'Monumentos',
  cenotes: 'Cenotes', textil: 'Artesanías y textiles', patrimonio: 'Patrimonio',
  artesanias: 'Artesanías',
}
type LugarFuente = { id: string; nombre: string; categoria: string; descripcion: string; imagen?: { src: string; alt: string } }
function adaptar(destino: DestinoExplorar, elementos: readonly LugarFuente[]): LugarExplorar[] {
  const destinoNombre = destinosExplorar.find(opcion => opcion.id === destino)!.nombre
  return elementos.map(lugar => ({
    id: lugar.id, destino, destinoNombre, nombre: lugar.nombre,
    categoria: lugar.categoria, categoriaNombre: nombresCategoria[lugar.categoria] ?? lugar.categoria,
    descripcion: lugar.descripcion, imagen: lugar.imagen,
  }))
}

export const lugaresExplorar: LugarExplorar[] = [
  ...adaptar('izamal', lugaresIzamal.map(lugar => ({ ...lugar, imagen: imagenesItinerarioIzamal[lugar.id]?.src ? { src: imagenesItinerarioIzamal[lugar.id].src!, alt: imagenesItinerarioIzamal[lugar.id].alt } : undefined }))),
  ...adaptar('valladolid', lugaresValladolid),
  ...adaptar('tekit', lugaresTekit.map(lugar => lugar.id === 'corredor-textil' ? { ...lugar, imagen: { src: detalleTekitPrototipo.imagenCultural, alt: 'Guayaberas textiles de Tekit, imagen de referencia del prototipo' } } : lugar)),
  ...adaptar('homun', lugaresHomun),
  ...adaptar('ticul', lugaresTicul),
]

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
