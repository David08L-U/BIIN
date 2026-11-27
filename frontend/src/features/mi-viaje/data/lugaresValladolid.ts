/** CU-09 / RF09: visitas, textos y caminatas del HTML de Valladolid.
 * Demostrativos, sin fecha de validación; no acreditan aperturas, precios o distancias.
 * Las visitas se deducen de los bloques originales: 60, 75, 65 y 40 min.
 */
export const categoriasValladolid = [
  { id: 'gastronomia', nombre: 'Gastronomía', titulo: 'Sabores de Valladolid', icono: 'restaurant', descripcion: 'Referencias gastronómicas de la pantalla original.' },
  { id: 'cenotes', nombre: 'Cenotes', titulo: 'Cenote y entorno del centro', icono: 'pool', descripcion: 'Visitas de naturaleza de referencia.' },
  { id: 'cultura', nombre: 'Cultura', titulo: 'Calles y patrimonio colonial', icono: 'account_balance', descripcion: 'Paseos culturales de la pantalla original.' },
] as const
export type CategoriaValladolid = typeof categoriasValladolid[number]['id']

export const lugaresValladolid = [
  { id: 'zaci', nombre: 'Cenote Zací y Parque Principal', categoria: 'cenotes', etiqueta: 'Cenote y centro histórico', visitaMinutos: 60, trasladoMinutos: 2, descripcion: 'Visita el impresionante cenote a cielo abierto en pleno centro histórico y camina junto a la Iglesia de San Servacio.' },
  { id: 'mercado-donato', nombre: 'Mercado Municipal Donato Bates', categoria: 'gastronomia', etiqueta: 'Almuerzo típico', visitaMinutos: 75, trasladoMinutos: 4, descripcion: 'Disfruta lomitos de Valladolid, longaniza asada tradicional y escabeche oriental con tortillas hechas a mano.' },
  { id: 'calzada-frailes', nombre: 'Calzada de los Frailes y Boutiques', categoria: 'cultura', etiqueta: 'Paseo colonial', visitaMinutos: 65, trasladoMinutos: 6, descripcion: 'Camina por la calle colonial más hermosa de Yucatán con casonas de colores pastel, perfumerías y boutiques de café local.' },
  { id: 'san-bernardino', nombre: 'Ex Convento de San Bernardino de Siena', categoria: 'cultura', etiqueta: 'Patrimonio colonial', visitaMinutos: 40, trasladoMinutos: 3, descripcion: 'Majestuoso conjunto franciscano del siglo XVI en el barrio de Sisal con su noria monumental y murales.' },
] as const

export const MARGEN_VALLADOLID = 15
export const TRASLADO_FINAL_VALLADOLID = 5
