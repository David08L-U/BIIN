/** CU-03 / RF03. Referencias demostrativas del detalle HTML de Tekit de Melanie.
 * Sin fecha de validación: no son horarios, disponibilidad ni posiciones GPS.
 * Tarifa y duración se leen del catálogo rutasPrototipo.
 */
export const detalleTekitPrototipo = {
  etiqueta: 'Ruta colectiva van · Capital de la Guayabera',
  descripcion: 'Villa de Guayaberas y Tradición Textil · Yucatán',
  terminal: 'Terminal Parque San Juan · Calle 69',
  referenciaTerminal: 'Mérida Centro, entre 62 y 64',
  carretera: 'Carretera Costera del Golfo / Mérida - Tekit',
  imagenRecorrido: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfxf9PrW3Ny9xfIuB9T76nyCgoGUXEojQ1Y960o1NS7jrk-60_R97q7EImzyuu6r0hX9_0NOQFRVej4John21_JVGgZtHspyCguUaq-IPrsN2UlAMHPmoEtLd5Wm6-cg14K_WcZw5PpSnK1W-9bqnxiYNSAfpCvoOA3Pq0IsunbRU_KeGhkHa5gTP3U08ruO717r_FSpfMF0pu595ex7s0A7rJMadh04mZ84IxiMd7',
  imagenCultural: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE_ZCaLg9GcdVRYQffmNr0_atBkPXTGUbU8ESLCBeqku8_5-2G-3JgGZYQtL4VA5t_8gVnPcvrr_kYwQDQI1USc5pnIECpX6m90pfFwzzk7ADepF5FTV_mRNhZdSrfiZX0egHRz23BZdD_WzfrkUd1OwuRlAu39gTXI0q2Ve0ohXoMn2esfeaFEj7JQesPk_cLSRK9zFl5JygGEwkovRdu4mXL59xhcOrN6fzG1cyZ',
  paradas: [
    { nombre: 'Mérida (Parque San Juan)', descripcion: 'Calle 69 x 64 · Referencia de salida', tipo: 'origen', etiqueta: 'Origen' },
    { nombre: 'Periférico Sur / Kanasín', descripcion: 'Parada de ascenso e incorporación vial', tipo: 'intermedia' },
    { nombre: 'Acanceh Centro', descripcion: 'Plaza principal / Pirámide de los Mascarones', tipo: 'intermedia' },
    { nombre: 'Tecoh', descripcion: 'Entronque Comunal y parada intermedia', tipo: 'intermedia' },
    { nombre: 'Tekit Centro', descripcion: 'Frente a la Parroquia de San Antonio de Padua', tipo: 'destino', etiqueta: 'Destino' },
  ],
  opciones: [
    { id: 'medio-dia', nombre: 'Medio día', detalle: '3–4 horas' },
    { id: 'dia-completo', nombre: 'Día completo', detalle: '6 horas' },
    // Modalidad de visita; no representa una duración numérica.
    { id: 'ruta-textil', nombre: 'Ruta Textil', detalle: 'Compras' },
  ],
  lugares: ['Talleres de Guayaberas', 'Parroquia San Antonio', 'Cenote Bekal', 'Panaderías Tradicionales'],
} as const

export type OpcionVisitaTekit = typeof detalleTekitPrototipo.opciones[number]['id']
