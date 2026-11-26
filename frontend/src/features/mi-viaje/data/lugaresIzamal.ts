/** CU-09 / RF09. Datos demostrativos del selector HTML de Melanie.
 * Duraciones y caminatas son estimaciones por confirmar, sin validación geográfica.
 * No representan horarios de apertura, precios ni disponibilidad actuales.
 */
export type CategoriaIzamal = 'gastronomia' | 'cultura' | 'monumentos'

export interface LugarIzamal {
  id: string
  nombre: string
  categoria: CategoriaIzamal
  descripcion: string
  visitaMinutos: number
  trasladoMinutos: number
  etiqueta: string
}

export const categoriasIzamal = [
  { id: 'gastronomia', nombre: 'Restaurantes', titulo: '¿Dónde comer?', icono: 'restaurant', descripcion: 'Sabores ancestrales a pasos del zócalo colonial.' },
  { id: 'cultura', nombre: 'Talleres y cultura', titulo: 'Talleres y cultura viva', icono: 'brush', descripcion: 'Encuentros vivenciales con la comunidad artesanal.' },
  { id: 'monumentos', nombre: 'Monumentos', titulo: 'Monumentos y arqueología', icono: 'account_balance', descripcion: 'La Ciudad Amarilla entre pirámides milenarias y santuarios.' },
] as const

export const filtrosRecorridoIzamal = [
  { id: 'monumentos', nombre: 'Cultural & Templos' },
  { id: 'gastronomia', nombre: 'Gastronomía Típica' },
  { id: 'cultura', nombre: 'Talleres & Artesanías' },
] as const

export const lugaresIzamal: LugarIzamal[] = [
  { id: 'kinich', nombre: 'Restaurante Kinich', categoria: 'gastronomia', visitaMinutos: 60, trasladoMinutos: 5, etiqueta: 'Favorito local', descripcion: 'Comida yucateca tradicional de autor: Poc chuc al carbón, queso relleno y agua fresca de chaya con lima.' },
  { id: 'mercado', nombre: 'Mercado Municipal de Izamal', categoria: 'gastronomia', visitaMinutos: 40, trasladoMinutos: 3, etiqueta: 'Sabor popular', descripcion: 'Puestos tradicionales de salbutes crujientes, panuchos de pavo en escabeche y polcanes rellenos recién salidos del comal.' },
  { id: 'conquista', nombre: 'Cafetería La Conquista & Postrería', categoria: 'gastronomia', visitaMinutos: 30, trasladoMinutos: 2, etiqueta: 'Pausa dulce', descripcion: 'Café de olla aromático con canela regional, frappé de horchata artesanal y marquesitas recién enrolladas con queso de bola holandés.' },
  { id: 'ramon', nombre: 'Taller de Semilla de Ramón', categoria: 'cultura', visitaMinutos: 40, trasladoMinutos: 4, etiqueta: 'Joyería botánica', descripcion: 'Demostración de joyería botánica con maestras artesanas mayas y degustación de infusión silvestre.' },
  { id: 'henequen', nombre: 'Taller de Henequén y Tintes', categoria: 'cultura', visitaMinutos: 45, trasladoMinutos: 6, etiqueta: 'Demostración', descripcion: 'Historia del oro verde yucateco, desfibrado tradicional y técnicas de teñido con añil y corteza de chaca.' },
  { id: 'cocina', nombre: 'Muestra de Cocina de Humo', categoria: 'cultura', visitaMinutos: 35, trasladoMinutos: 5, etiqueta: 'Patio colonial', descripcion: 'Tortillado a mano en comal de barro con masa de maíz criollo y molienda en metate en patio virreinal.' },
  { id: 'convento', nombre: 'Convento San Antonio de Padua', categoria: 'monumentos', visitaMinutos: 60, trasladoMinutos: 2, etiqueta: 'Imperdible', descripcion: 'Atrio cerrado monumental con 75 arcos coloniales y Camarín de la Virgen. Información por confirmar.' },
  { id: 'piramide', nombre: 'Pirámide Kinich Kakmó', categoria: 'monumentos', visitaMinutos: 45, trasladoMinutos: 7, etiqueta: 'Vista 360°', descripcion: 'Gran acrópolis maya solar consagrada a la guacamaya de fuego. Vista panorámica sobre las copas de la selva.' },
  { id: 'kabul', nombre: 'Pirámide Kabul & Los Remedios', categoria: 'monumentos', visitaMinutos: 30, trasladoMinutos: 6, etiqueta: 'Histórico', descripcion: 'Mascarón maya del dios Kinich Ahau y capilla abierta virreinal del siglo XVI en tranquila plazoleta. Información por confirmar.' },
]

/** Orden editorial de demostración, sin optimización geográfica. */
export const ordenRecomendadoIzamal = ['convento', 'kinich', 'ramon', 'piramide', 'mercado', 'henequen', 'cocina', 'kabul', 'conquista']
export const MARGEN_FINAL_MINUTOS = 15
export const TRASLADO_FINAL_MINUTOS = 5
