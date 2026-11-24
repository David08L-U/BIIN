/** CU-03 / RF03: referencias demostrativas del HTML de Ticul de Melanie.
 * Sin fecha de validación. Tarifa y duración se reutilizan desde el catálogo.
 * Las imágenes y paradas no acreditan un trazado ni una operación vigente.
 */
export const detalleTiculPrototipo = {
  etiqueta: 'Ruta intermunicipal · La Perla del Sur',
  descripcion: 'Cuna del Calzado Artesanal y la Alfarería Maya · Yucatán',
  terminal: 'Terminal Parque San Juan · Calle 69',
  referenciaTerminal: 'Mérida Centro',
  corredor: 'Ruta Puuc Sur',
  referenciaMapa: 'Carretera Federal 261',
  imagenRecorrido: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCm3a4Ug-KpkuDu7U8JnCa230iZy3yiEzfRW0vEZERE6Wx8uzflZMKGmxkge5q6acJ8wYIfBxEmdswfY_2ZchcX7aQrDiQWMo68FTIyO2x1xa90_jNcDED1OZqPdd8sEjokvGE61InHr7U1PDZok9q_-aT0Lp-gYfim58H1sjaEYUKBLB_ie51j00W9Xy0yffiA3qkbVeEWOLr5IGBYGEFLkKOj1goS0Vqy80O5UM2k',
  imagenCultural: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyAvX6bLjauMosqN30-V-zRdFHLtXkG01EgrrWoTD3BIjKS9eueh7ioLqBPXzkhb6nbGBIVCRgdt7qqDSxzfs4fVjqYKdKwCc2QtQvvBxonw3ifQ92bnb1-CZslFUHTozWobBIHvrfgNEYtfb4iO9HvOmbZ4sS-maLmPQ12jniLw94TzNpCkAyXvBsHoE0y8GobnuqPamqbyvwlmWpw64PE_pKZluCbQb7TdUHK-Kb',
  referenciaCultural: 'Barrio Alfarero de San Enrique · Calzado Fino · Ruta Puuc',
  paradas: [
    { nombre: 'Mérida (Parque San Juan)', descripcion: 'Calle 69 x 64 · Referencia de salida', tipo: 'origen', etiqueta: 'Origen' },
    { nombre: 'Umán / Entronque Carretera', descripcion: 'Referencia de parada del prototipo', tipo: 'intermedia' },
    { nombre: 'Muna Centro', descripcion: 'Mirador Ruta Puuc · Referencia del prototipo', tipo: 'intermedia' },
    { nombre: 'Entronque San José Tipceh', descripcion: 'Parada intermedia regional', tipo: 'intermedia' },
    { nombre: 'Ticul Centro', descripcion: 'Frente al Mercado Municipal y Plaza de Armas', tipo: 'destino', etiqueta: 'Destino' },
  ],
  estancias: [
    { id: 'medio-dia', nombre: 'Medio día (3–4 horas)' },
    // Modalidades del prototipo, sin convertirlas en duraciones numéricas.
    { id: 'dia-completo', nombre: 'Día completo (Ruta Puuc)' },
    { id: 'tour-compras', nombre: 'Tour de Compras' },
  ],
  lugares: [
    { nombre: 'Corredor del Calzado', icono: 'local_mall' },
    { nombre: 'Talleres de Alfarería', icono: 'brush' },
    { nombre: 'Iglesia de San Antonio', icono: 'church' },
    { nombre: 'Mercado Municipal', icono: 'restaurant' },
  ],
} as const

export type EstanciaTicul = typeof detalleTiculPrototipo.estancias[number]['id']
