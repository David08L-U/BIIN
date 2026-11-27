import valladolidConvento from '../../../assets/explorar/valladolid-san-bernardino.jpg'

/** CU-03 / RF03. Datos demostrativos del detalle HTML de Valladolid de Melanie.
 * Sin fecha de validación. Recorrido, referencias y terminal no son datos operativos.
 * Tarifa y duración se reutilizan desde rutasPrototipo para evitar contradicciones.
 */
export const detalleValladolidPrototipo = {
  etiqueta: 'Ruta intermunicipal · Pueblo Mágico Heroico',
  descripcion: 'La Sultana del Oriente · Yucatán',
  terminal: 'Terminal Noreste · Calle 50 x 67',
  referenciaTerminal: 'Mérida Centro Histórico · Conexión directa',
  carretera: 'Carretera Federal 180D',
  imagenRecorrido: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRKuF3o1LIjk5dlKJTYfrPFCjyYdKgacvMKTyhNN-wP91REmUuhXyjYmZnKA5nuhL4XXsXYzzEecn-RxgkDbBrRlaesWwZWmjx6YrUtTwtNbRZpfN0eqm9PwR2l1nIM7D_i5_VD34cs-wlhANhb7NXdjVFEKW_f4mB4TffDwqyQhuMJwiy89p_aaEPOomiGHrjF9f5YbbC9WoHi6XgxHEWag1g_a6Lvz8sY1Bet1HI',
  imagenCultural: valladolidConvento,
  paradas: [
    { nombre: 'Mérida (Terminal Noreste)', descripcion: 'Calle 50 x 67 · Referencia de salida', tipo: 'origen', etiqueta: 'Origen' },
    { nombre: 'Kanasín / Entronque Cancún', descripcion: 'Parada rápida de ascenso vial', tipo: 'conexion' },
    { nombre: 'Kantunil', descripcion: 'Entronque Autopista Cuota', tipo: 'intermedia' },
    { nombre: 'Pisté / Chichén Itzá', descripcion: 'Parada intermedia turística', tipo: 'intermedia' },
    { nombre: 'Valladolid Centro', descripcion: 'Frente al Parque Principal Francisco Cantón', tipo: 'destino', etiqueta: 'Destino' },
  ],
  estancias: [
    { id: 'medio-dia', nombre: 'Medio día', duracion: '4 h 30 min' },
    { id: 'dia-completo', nombre: 'Día completo', duracion: '9 h' },
    // Representa dos días de visita, sin convertirlos en horas continuas.
    { id: 'fin-de-semana', nombre: 'Fin de semana', duracion: '2 días · 9 h por jornada' },
  ],
  lugares: ['Convento San Bernardino', 'Cenote Zací', 'Calzada de los Frailes', 'Mercado Municipal Bazar'],
} as const

export type EstanciaValladolid = typeof detalleValladolidPrototipo.estancias[number]['id']
