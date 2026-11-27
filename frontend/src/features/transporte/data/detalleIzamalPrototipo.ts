import izamalConvento from '../../../assets/explorar/izamal-convento.jpg'

/**
 * CU-03 / RF03. Transcripción demostrativa de
 * BIIN-prototipo-melanie/biin_detalle_de_ruta_izamal/code.html.
 * Sin fecha de validación: no son datos operativos ni una posición GPS.
 * La tarifa y el tiempo del catálogo se leen de rutasPrototipo.
 */
export const detalleIzamalPrototipo = {
  tiempo: '~58 min',
  imagenRecorrido: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwmx1eXUWd5HJLNqx3NsG28MpKo7oyLXXa3RbYEvHpvo4KvGVNKBrPAFGAnJsUrhOPR4GjmPYSEgXJizB8uHCg5BILU4tM2dAVwfdtx5f5LcQdU8Ig-VmxoGkSxrgeG0jbzPn_b5c08x3R8XmnJuj3Ytgxjt-7ehF20nKLIBtmN2tiPMMVcGiWSwyxPHF8vANDySY6aoqehZiwwVW79rDr6BDWoRHOavthahpG6-OW',
  imagenCultural: izamalConvento,
  recorteCultural: 'inset(6% 0 0)',
  paradas: [
    {
      nombre: 'Mérida (Terminal Noreste)',
      descripcion: 'Calle 67 x 50 y 52 · Horario sin confirmar',
      tipo: 'origen',
      etiqueta: 'Origen',
    },
    {
      nombre: 'Kanasín / Periférico Oriente',
      descripcion: 'Parada de ascenso rápido',
      tipo: 'intermedia',
    },
    {
      nombre: 'Tixkokob',
      descripcion: 'Parque Principal',
      tipo: 'intermedia',
    },
    {
      nombre: 'Ekmul',
      descripcion: 'Entronque Comunal',
      tipo: 'intermedia',
    },
    {
      nombre: 'Izamal Centro',
      descripcion: 'Frente al Convento San Antonio de Padua',
      tipo: 'destino',
      etiqueta: 'Destino',
    },
  ],
  estancias: [
    { id: 'medio-dia', nombre: 'Medio día', duracion: '3 - 4 hrs' },
    { id: 'dia-completo', nombre: 'Día completo', duracion: '6 - 8 hrs' },
    { id: 'tarde-magica', nombre: 'Tarde mágica', duracion: 'Atardecer' },
  ],
  lugares: [
    { nombre: 'Convento San Antonio', icono: 'church' },
    { nombre: 'Pirámide Kinich Kakmó', icono: 'temple_hindu' },
    { nombre: 'Restaurante Kinich', icono: 'restaurant' },
    { nombre: 'Talleres Artesanales', icono: 'palette' },
  ],
} as const
