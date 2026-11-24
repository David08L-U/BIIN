/** CU-09 / RF09: visitas, textos y caminatas del HTML de Valladolid.
 * Demostrativos, sin fecha de validación; no acreditan aperturas, precios o distancias.
 * Las visitas se deducen de los bloques originales: 60, 75, 65 y 40 min.
 */
export const categoriasValladolid = [
  { id: 'gastronomia', nombre: 'Gastronomía', titulo: 'Sabores de Valladolid', icono: 'restaurant', descripcion: 'Referencias gastronómicas de la pantalla original.' },
  { id: 'cenotes', nombre: 'Cenotes', titulo: 'Cenote y entorno del centro', icono: 'pool', descripcion: 'Visitas de naturaleza del prototipo.' },
  { id: 'cultura', nombre: 'Cultura', titulo: 'Calles y patrimonio colonial', icono: 'account_balance', descripcion: 'Paseos culturales de la pantalla original.' },
] as const
export type CategoriaValladolid = typeof categoriasValladolid[number]['id']

export const lugaresValladolid = [
  { id: 'zaci', nombre: 'Cenote Zací y Parque Principal', categoria: 'cenotes', etiqueta: 'Cenote y centro histórico', visitaMinutos: 60, trasladoMinutos: 2, descripcion: 'Visita el impresionante cenote a cielo abierto en pleno centro histórico y camina junto a la Iglesia de San Servacio.', imagen: { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVXPkEueRA9jZUjjEE7JIRjO5KMw1T6GkyG5wk1KnK4tz1cW0QNEnWrmXwaQbsU1xoWcQqO5FTpq0xKyZECAVmOr62RIHsgixNHWKFg5X4HpomUe9eSZ4IrxwbONfNoSozTxkvaVZe_wEP-o7sgZGadGNIw1mhhIwywMphau2mkqwWJyyDXslzex7soTogw-Snnj4T8fXSs5D6mx9KuHSCkbkKBX3e6xjsbAZkz3AG', alt: 'Cenote Zací, imagen de referencia del prototipo' } },
  { id: 'mercado-donato', nombre: 'Mercado Municipal Donato Bates', categoria: 'gastronomia', etiqueta: 'Almuerzo típico', visitaMinutos: 75, trasladoMinutos: 4, descripcion: 'Disfruta lomitos de Valladolid, longaniza asada tradicional y escabeche oriental con tortillas hechas a mano.', imagen: { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpy9x6Xt6ib7JcvA_B1nt-XMAdgXkIBJJtBUFsVvusiBzMMBWnxYK3a1M3mbCG5hueGWMT8lh7GCV6y_nUK_XhSnKtEACjHbQDG1ku2ocNg6MiTRED6AOTsS4YybgWsYcreoabrO9DYTquxM4OgSKo_js74FIvyGi0JRBQ4a7ASmmI-qBemxtSM7stV3naoUdhnASxXzM-a1JEz1SMUl7F6tsUI4IO66Pdyud3M-Ch', alt: 'Gastronomía de Valladolid, imagen del prototipo' } },
  { id: 'calzada-frailes', nombre: 'Calzada de los Frailes y Boutiques', categoria: 'cultura', etiqueta: 'Paseo colonial', visitaMinutos: 65, trasladoMinutos: 6, descripcion: 'Camina por la calle colonial más hermosa de Yucatán con casonas de colores pastel, perfumerías y boutiques de café local.', imagen: { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWbT19C-X7iAJtCzkZyeV9pmEMGMXqhlVPR6cmzXrh2bUImAu0Q4MiR9L7uTc8KTFEhhcgQv15H3gtlXjmYWQm78lVsS4XqRk4GjSvIiJtBuTogX7u36jxe2HQTYfOGvhiU7162L84MdKs9auxmBbtz8SWJGdPMgQ5PoxszTu_D0bZTlms4Q96Dnmqw9VUivL2kYCexu9xTBnOjnUg-nH_x2WWUg5wuEojgVCg9ZeO', alt: 'Calzada de los Frailes, imagen del prototipo' } },
  { id: 'san-bernardino', nombre: 'Ex Convento de San Bernardino de Siena', categoria: 'cultura', etiqueta: 'Patrimonio colonial', visitaMinutos: 40, trasladoMinutos: 3, descripcion: 'Majestuoso conjunto franciscano del siglo XVI en el barrio de Sisal con su noria monumental y murales.' },
] as const

export const MARGEN_VALLADOLID = 15
export const TRASLADO_FINAL_VALLADOLID = 5
