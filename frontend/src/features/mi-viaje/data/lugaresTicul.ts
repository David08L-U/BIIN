import ticulIglesiaSanAntonio from '../../../assets/destinos/ticul-iglesia-san-antonio.jpg'

import ticulComidaMercado from '../../../assets/destinos/ticul-comida-mercado.jpg'

import ticulCorredorCalzado from '../../../assets/destinos/ticul-corredor-calzado.jpg'

import ticulTalleresAlfareros from '../../../assets/destinos/ticul-talleres-alfareros.jpg'

import { duracionPlan } from '../plan/duracion'
/** CU-09 / RF09. Referencias de biin_mi_itinerario_en_ticul/code.html, sin fecha de validación.
 * Tiempos demostrativos, no mediciones geográficas ni servicios confirmados.
 * El traslado a la comida no tiene duración clara: se suponen 4 min a pie. */
export type CategoriaTicul = 'artesanias' | 'gastronomia' | 'patrimonio'
export const categoriasTicul = [
  { id: 'artesanias', nombre: 'Alfarería & Zapaterías', icono: 'palette' },
  { id: 'gastronomia', nombre: 'Gastronomía', icono: 'restaurant' },
  { id: 'patrimonio', nombre: 'Patrimonio', icono: 'church' },
] as const
export const lugaresTicul = [
  {
    "id": "talleres-alfareros",
    "nombre": "Barrio de San Enrique y Talleres Alfareros",
    "categoria": "artesanias",
    "descripcion": "Referencia demostrativa de familias alfareras que modelan tinajas, jaguares y réplicas mayas de barro rojo en torno manual. Consulta las condiciones de visita con cada taller.",
    "etiqueta": "Alfarería tradicional",
    "visitaMinutos": 60,
    "trasladoMinutos": 3,
    "traslado": {
      "tipo": "mototaxi",
      "nombre": "Mototaxi",
      "icono": "electric_moped",
      "supuesto": false
    },
    "imagen": {
      "src": ticulTalleresAlfareros,
      "alt": "Alfarería de barro rojo, imagen del prototipo para Ticul"
    }
  },
  {
    "id": "corredor-calzado",
    "nombre": "Corredor del Calzado Artesanal",
    "categoria": "artesanias",
    "descripcion": "Recorre la tradición de zapaterías y talleres de sandalias, mocasines y calzado de piel de Ticul. Referencia de demostración; consulta precios y condiciones directamente.",
    "etiqueta": "Calzado artesanal",
    "visitaMinutos": 60,
    "trasladoMinutos": 5,
    "traslado": {
      "tipo": "a-pie",
      "nombre": "A pie",
      "icono": "directions_walk",
      "supuesto": false
    },
    "imagen": {
      "src": ticulCorredorCalzado,
      "alt": "Sandalias y calzado artesanal, imagen del prototipo de Ticul"
    }
  },
  {
    "id": "comida-mercado",
    "nombre": "Poc Chuc Ticuleño y Panuchos de Pavo",
    "categoria": "gastronomia",
    "descripcion": "Referencia gastronómica del Mercado Municipal: poc chuc con chiltomate asado, frijol colado y cebolla con naranja agria. Platillos y disponibilidad pendientes de validar.",
    "etiqueta": "Comida tradicional",
    "visitaMinutos": 60,
    "trasladoMinutos": 4,
    "traslado": {
      "tipo": "a-pie",
      "nombre": "A pie",
      "icono": "directions_walk",
      "supuesto": true
    },
    "imagen": {
      "src": ticulComidaMercado,
      "alt": "Poc chuc y acompañamientos, referencia gastronómica del prototipo de Ticul"
    }
  },
  {
    "id": "iglesia-san-antonio",
    "nombre": "Ex Convento e Iglesia de San Antonio de Padua",
    "categoria": "patrimonio",
    "descripcion": "El prototipo propone conocer la edificación franciscana, su atrio abierto y sus retablos. Consulta las condiciones de acceso antes de la visita.",
    "etiqueta": "Patrimonio histórico",
    "visitaMinutos": 30,
    "trasladoMinutos": 2,
    "traslado": {
      "tipo": "a-pie",
      "nombre": "A pie",
      "icono": "directions_walk",
      "supuesto": false
    },
    "imagen": {
      "src": ticulIglesiaSanAntonio,
      "alt": "Iglesia y convento, imagen de patrimonio del prototipo para Ticul"
    }
  }
] as const
export type LugarTicul = typeof lugaresTicul[number]
export const mapaTicul = {
  "src": "https://lh3.googleusercontent.com/aida-public/AB6AXuCm3a4Ug-KpkuDu7U8JnCa230iZy3yiEzfRW0vEZERE6Wx8uzflZMKGmxkge5q6acJ8wYIfBxEmdswfY_2ZchcX7aQrDiQWMo68FTIyO2x1xa90_jNcDED1OZqPdd8sEjokvGE61InHr7U1PDZok9q_-aT0Lp-gYfim58H1sjaEYUKBLB_ie51j00W9Xy0yffiA3qkbVeEWOLr5IGBYGEFLkKOj1goS0Vqy80O5UM2k",
  "alt": "Mapa ilustrativo del Circuito Artesanal Ticul del prototipo"
}
export const REGRESO_TICUL = 3
export const MARGEN_TICUL = 15
export const avisoTrasladoComidaTicul = 'Traslado a la comida: 4 min a pie como supuesto demostrativo.'
export function nombreTrasladoTicul(lugar: LugarTicul): string {
  return `${lugar.traslado.nombre} · ${duracionPlan(lugar.trasladoMinutos)} estimados${lugar.traslado.supuesto ? ' (supuesto)' : ''}`
}
