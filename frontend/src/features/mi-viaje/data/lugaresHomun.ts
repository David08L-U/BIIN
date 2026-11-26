import homunRestauranteCenote from '../../../assets/destinos/homun-restaurante-cenote.jpg'

import homunTzaUjunKat from '../../../assets/destinos/homun-tza-ujun-kat.jpg'

import homunSantaRosa from '../../../assets/destinos/homun-santa-rosa.jpg'

import { duracionPlan } from '../plan/duracion'
/** Referencias demostrativas de biin_mi_itinerario_en_hom_n/code.html, sin fecha de validación.
 * Duraciones y traslados son supuestos, no mediciones geográficas ni servicios confirmados. */
export type CategoriaHomun = 'cenotes' | 'gastronomia' | 'patrimonio'
export const categoriasHomun = [
  { id: 'cenotes', nombre: 'Cenotes & Cavernas', icono: 'water_drop' },
  { id: 'gastronomia', nombre: 'Gastronomía', icono: 'restaurant' },
  { id: 'patrimonio', nombre: 'Patrimonio', icono: 'church' },
] as const
export const lugaresHomun = [
  {
    "id": "santa-rosa",
    "nombre": "Cenote Santa Rosa",
    "categoria": "cenotes",
    "descripcion": "Información por confirmar: cenote cerrado en gruta subterránea, aguas turquesas y plataforma de madera. Consulta condiciones de acceso y servicios con el establecimiento.",
    "etiqueta": "Gruta subterránea",
    "icono": "water_drop",
    "visitaMinutos": 75,
    "trasladoMinutos": 3,
    "traslado": {
      "tipo": "mototaxi",
      "nombre": "Mototaxi",
      "icono": "electric_rickshaw"
    },
    "imagen": {
      "src": homunSantaRosa,
      "alt": "Caverna y agua turquesa en Cenote Santa Rosa"
    }
  },
  {
    "id": "tza-ujun-kat",
    "nombre": "Cenote Tza Ujun Kat",
    "categoria": "cenotes",
    "descripcion": "Descripción pendiente de validar: una caverna semiabierta con luz natural, golondrinas y estalactitas. Información demostrativa pendiente de validar.",
    "etiqueta": "Bóveda y luz natural",
    "icono": "wb_sunny",
    "visitaMinutos": 65,
    "trasladoMinutos": 5,
    "traslado": {
      "tipo": "senderos",
      "nombre": "Traslado entre senderos",
      "icono": "transfer_within_a_station"
    },
    "imagen": {
      "src": homunTzaUjunKat,
      "alt": "Caverna semiabierta con luz natural en Cenote Tza Ujun Kat"
    }
  },
  {
    "id": "restaurante-cenote",
    "nombre": "Restaurante El Cenote y Cocina Tradicional",
    "categoria": "gastronomia",
    "descripcion": "Información gastronómica por confirmar: cochinita pibil, queso relleno y agua de pitahaya. Nombre, menú y disponibilidad pendientes de validar.",
    "etiqueta": "Almuerzo regional",
    "icono": "restaurant",
    "visitaMinutos": 60,
    "trasladoMinutos": 4,
    "traslado": {
      "tipo": "mototaxi",
      "nombre": "Mototaxi",
      "icono": "electric_rickshaw"
    },
    "imagen": {
      "src": homunRestauranteCenote,
      "alt": "Comida yucateca asociada a Homún"
    }
  },
  {
    "id": "plaza-parroquia",
    "nombre": "Plaza Principal y Parroquia de San Buenaventura",
    "categoria": "patrimonio",
    "descripcion": "Descripción pendiente de validar: la plaza y el templo franciscano, con referencias a nieves artesanales de coco y mamey. Confirma las condiciones de visita.",
    "etiqueta": "Plaza y patrimonio",
    "icono": "church",
    "visitaMinutos": 35,
    "trasladoMinutos": 2,
    "traslado": {
      "tipo": "a-pie",
      "nombre": "A pie",
      "icono": "directions_walk"
    }
  }
] as const
export type LugarHomun = typeof lugaresHomun[number]
export const mapaHomun = {
  "src": "https://lh3.googleusercontent.com/aida-public/AB6AXuDXb-oSp1XZIQxyW53PSlcgUV-gQg399RRFnbHQ5XSptF82DDG-BtMVts-cKK1Ko-fGIx7xAUi9dfjT2UOpNWuLdlaGtmAMVZaTgXzh4DXYKh782R5nidCYqkP9BzeHSrPXxsXXrMZI0yuKrAoFWfhSZPxgdI4RpPgEzWoMfytTxKXoFeHFpH2CSywv-6L3XdYKdYRNn2aiZjB0Jmgpmjl2NU3ZEAg3miawSjV8wGNt",
  "alt": "Mapa ilustrativo del Circuito Cenotes Homún de referencia"
}
export const MARGEN_HOMUN = 15
/** El HTML no define duración ni medio del regreso final. Supuesto de planificación. */
export const REGRESO_HOMUN = 5
export const avisoRegresoHomun = 'Regreso final: supuesto de 5 min, con medio y trayecto por confirmar; el HTML no define ese traslado.'
export function nombreTrasladoHomun(lugar: LugarHomun): string {
  return `${lugar.traslado.nombre} · ${duracionPlan(lugar.trasladoMinutos)} estimados`
}
