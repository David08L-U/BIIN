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
      "src": "https://lh3.googleusercontent.com/aida-public/AB6AXuAbXh8BR_HDvPYg-YJaMHXHWFwJFifKAw3es39uBNF5hVXVMbE4J7x47-s58FB-09XUle84Lo_rqbpZNjUzceoz-l9SGefgcjkkquvQyTts6lWdT_3u1XjpctJBRksaUeunqatQkVxyImes7fHld5UWS6t-lEmpP-NKB8obrFq4d2uom3zORl-E4YU6oyUSg67IvovhOmplixKeDYUr0njALlBjKrfbEGHIK3Qst0Y1",
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
      "src": "https://lh3.googleusercontent.com/aida-public/AB6AXuDWrqDXqjjwOJJmS_RYSypzhrX0V3IXJ6PCH_Ms3dkJ7kl0vPHh406Y3k3XCBBgIaNHpbzslT5rI21kKAKcxGIBdfWnnR9ZO8rOKeJKbAkvF6Fn4z9ReMyQRJBEsMwBQWJk-UVM6gDuYbeZaagVElxLI93lDACxIQCFgJLla0eh1JyuBt2Gj2iTisjoRhD3-1axGCCW49ig9lenJZ_igunauRKyzpQIJIOi0zlxyRu7",
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
      "src": "https://lh3.googleusercontent.com/aida-public/AB6AXuDjod6eh5VqSfplSYttBEUVVoFjeHnA0xPW9j1BluLQa31vpxNrzjsAq8MsW9R4U1PTlILejH7tMlJhqXHctg_tWZN5VNoJ4RTXQWPf1S_uQ3rWCeHLXuwtZgvqN5sgXEz50bMtUAYlxlotq779MDPUiiCHsV41r44JHRjj2gpENK9aMJsWVzj0VilbXWDy6ruRLCjb6uuaAS1uTtO5BjgQtgpY1c9vo2F2SnP8xF2b",
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
      "src": "https://lh3.googleusercontent.com/aida-public/AB6AXuDc6Oknxj_hoioA7wPZDy29itei25EBcm4yedBiqiFK2LhpS3mliEUYwwTb_5oUT-p9nlkxidp3SQ3vUvmUy9vv6vR9aoomifkGvj4o6tNC8DL4ohn9d0QCJGN-awOUbXaaRESsskXLv3cMbszZi-Z5g2IogOxNQBpf7dIbwzzSJBInuK03Xy__9CHLeZ4xOeaNjHk5zoO-sRAw2fGSuKMqRmiErJSRtz2QQILvd2gJ",
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
