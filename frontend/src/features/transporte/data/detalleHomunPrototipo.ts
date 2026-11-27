
/** CU-03 / RF03. Referencias demostrativas del HTML de Homún de Melanie.
 * Sin fecha de validación. Tarifa y duración se reutilizan desde el catálogo.
 * Se omiten los lugares copiados de Valladolid y se usa un alt cultural neutral;
 * la imagen original no acredita la identidad ni la ubicación de ningún sitio.
 */
export const detalleHomunPrototipo = {
  etiqueta: 'Ruta colectiva van · Anillo de Cenotes',
  descripcion: 'Paraíso de Cenotes y Naturaleza Maya · Yucatán',
  terminal: 'Terminal Parque San Juan · Calle 69',
  referenciaTerminal: 'Mérida Centro',
  corredor: 'Corredor Oriente Cenotes',
  imagenRecorrido: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxpHJPsN46xsmqIIafjqq99a6hNdtsaLbJHBwus0vS0lRgkW_K87OFyOmpdJYIjSnsERnH9YctGN1PK4LskOh4oR6ta5NVTCCBfZ7xSRCjn7PQ2qbqwwp7-TO0UpsgaPsKzDVqqHZSNkfVTWasCKxwa-WeF75uBbZJnRRIeo9oesEKTtrOKIn4MlW_udQf28xV9qzLVKxte_yAWaYacJxwWDJlolygIkbE71GfRH9F',
  imagenCultural: undefined,
  referenciaCultural: 'Cenote Tza Ujun Kat · Cenote Santa Rosa',
  paradas: [
    { nombre: 'Mérida (Parque San Juan)', descripcion: 'Calle 69 x 62 · Referencia de salida', tipo: 'origen', etiqueta: 'Origen' },
    { nombre: 'Periférico Oriente', descripcion: 'Parada rápida', tipo: 'intermedia' },
    { nombre: 'Acanceh (Entronque)', descripcion: 'Parada de descenso intermedio', tipo: 'intermedia' },
    { nombre: 'Cuzamá', descripcion: 'Acceso a parador de cenotes', tipo: 'intermedia' },
    { nombre: 'Homún Centro', descripcion: 'Frente al Palacio Municipal', tipo: 'destino', etiqueta: 'Destino' },
  ],
  estancias: [
    { id: 'medio-dia', nombre: 'Medio día', duracion: '4–5 horas' },
    { id: 'dia-completo', nombre: 'Día completo', duracion: '8–10 horas' },
    // Dos días de visita, sin convertirlos en horas continuas de actividades.
    { id: 'fin-de-semana', nombre: 'Fin de semana', duracion: '2 días' },
  ],
  lugares: ['Cenote Santa Rosa', 'Cenote Tza Ujun Kat'],
} as const

export type EstanciaHomun = typeof detalleHomunPrototipo.estancias[number]['id']
