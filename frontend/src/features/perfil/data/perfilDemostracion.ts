import type { DatosPerfil } from '../components/PerfilVista'

/** Datos del prototipo; solo se importan desde la vista previa de desarrollo. */
export const perfilDemostracion: DatosPerfil = {
  "nombre": "Melanie González",
  "correo": "perfil.ejemplo@biin.test",
  "telefono": "Teléfono de ejemplo",
  "foto": "https://lh3.googleusercontent.com/aida-public/AB6AXuC7crpE345eynpUQq5MHlY4Uzd-OioEIWQ9lzK8uKoxXrGwe0tZ0Xrh-HVJ7Sq4-DL8qNrcHzAg0LmetseuQFEbTsFMZVxGvbQanxrzshywseGZQ39oRRvK_35YZcIhTnWwy1ufUNlmtUmrRf_hJm5rQ1veT6NFo0TtHHLddq0fkUopi5d1lD4EiJUkJnltZaXS4kJpgjsGAcm86TGSxUWaXryu7cGBbHHEdArGv19h",
  "periodo": "Octubre · ejemplo",
  "movilidad": [
    18,
    4,
    3
  ],
  "ultimoTrayecto": {
    "codigo": "R-07",
    "servicio": "Interurbano Noreste · ejemplo",
    "tarifa": "$50.00 MXN · ejemplo",
    "origen": "Mérida (Terminal Noreste)",
    "destino": "Izamal Centro (Convento)",
    "salida": "10:30 AM",
    "llegada": "Ayer · ejemplo"
  },
  "itinerarios": [
    {
      "id": "ejemplo-izamal",
      "nombre": "Izamal Express",
      "paradas": 4,
      "url": "/rutas/izamal/itinerario",
      "icono": "navigation"
    },
    {
      "id": "ejemplo-homun",
      "nombre": "Homún Cenotes",
      "paradas": 2,
      "url": "/rutas/homun/itinerario",
      "icono": "pool"
    }
  ]
}
