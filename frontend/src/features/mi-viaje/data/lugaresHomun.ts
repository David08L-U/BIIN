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
    "descripcion": "Referencia del prototipo: cenote cerrado en gruta subterránea, aguas turquesas y plataforma de madera. Consulta condiciones de acceso y servicios con el establecimiento.",
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
      "src": "https://lh3.googleusercontent.com/aida-public/AB6AXuApQL6IOvtYDNkbM5UiJiVx7oMuc1H8sJSpFQTj7jjRjppW9QdX8kpFQdlcw4SamQe2BCyFmDXOETzQYeRxa6cwdV11DGmNxMM5KBhfoLjjq3N_lQN168uM6aiZufbO08j8G98v3tMsiC6rQv8AkfSBVhM9najSlIsFWTuo6PmN7_KSBCfOMf7PtSLN-HTN5c-RRrMhpTF3d3eviCGGxl28owsmk6_s0glyw8uncwPT",
      "alt": "Caverna y agua turquesa, referencia del prototipo para Cenote Santa Rosa"
    }
  },
  {
    "id": "tza-ujun-kat",
    "nombre": "Cenote Tza Ujun Kat",
    "categoria": "cenotes",
    "descripcion": "El prototipo describe una caverna semiabierta con luz natural, golondrinas y estalactitas. Información demostrativa pendiente de validar.",
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
      "src": "https://lh3.googleusercontent.com/aida-public/AB6AXuATcKspI8n4-M9alQiGm8wdiAgDDNFNg8ZYArL0ldKyudoqSK5ypaXt4CF9ILMNhxYFHL9jYhNf1svpOIuw57Pjq84UX9EV6tTzkGSDs2i8EXMHUOOcMvnoAf2ESnXmsbtxXk2aXf5RnfHTO1hsVV4p1_0fF7otwZPlnoM6cVL0J4s-BWuP1kZMk5HUTbNAY5iuiW7gU5dJebisD1RsjtT5xAjJZSMBgRVllXLfg48u",
      "alt": "Caverna semiabierta con luz natural, referencia del prototipo para Cenote Tza Ujun Kat"
    }
  },
  {
    "id": "restaurante-cenote",
    "nombre": "Restaurante El Cenote y Cocina Tradicional",
    "categoria": "gastronomia",
    "descripcion": "Referencia gastronómica del prototipo: cochinita pibil, queso relleno y agua de pitahaya. Nombre, menú y disponibilidad pendientes de validar.",
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
      "src": "https://lh3.googleusercontent.com/aida-public/AB6AXuDCxuC0Cb-eqwKI4yV05m1jnCDyuVVLSUl7jRoImvHSn17dYA3jK_EKwVNgwvLzQfXGAt10BPv23DGcYCI1-XK9HvoEf_u1tBoOecliJFmaQ4SsgloW1jjmtyuqgay2sHzuafWDEkynyLFjidLRXHE2m7-SmFHvuL8jCPkZlS6ZXjkgTXPuVOXKBqrxpMT6vVoAfR825L6VDX6e2xbXtd04LhHWg3fJrKGgex3-iDAR",
      "alt": "Comida yucateca, referencia gastronómica del prototipo de Homún"
    }
  },
  {
    "id": "plaza-parroquia",
    "nombre": "Plaza Principal y Parroquia de San Buenaventura",
    "categoria": "patrimonio",
    "descripcion": "El prototipo propone conocer la plaza y el templo franciscano, con referencias a nieves artesanales de coco y mamey. Confirma las condiciones de visita.",
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
  "alt": "Mapa ilustrativo del Circuito Cenotes Homún del prototipo"
}
export const MARGEN_HOMUN = 15
/** El HTML no define duración ni medio del regreso final. Supuesto de planificación. */
export const REGRESO_HOMUN = 5
export const avisoRegresoHomun = 'Regreso final: supuesto de 5 min, con medio y trayecto por confirmar; el HTML no define ese traslado.'
export function nombreTrasladoHomun(lugar: LugarHomun): string {
  return `${lugar.traslado.nombre} · ${duracionPlan(lugar.trasladoMinutos)} estimados`
}
