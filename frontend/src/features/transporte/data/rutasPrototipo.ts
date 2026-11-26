/** Datos del HTML de Melanie: demostrativos y pendientes de validación. */

export interface RutaPrototipo {
  id: string
  nombre: string
  descripcion: string
  etiqueta?: string
  icono: string
  tiempo: string
  frecuencia: number
  precio: number
  directo: boolean
  cenotes: boolean
}

export const rutasPrototipo: RutaPrototipo[] = [
  {
    id: 'izamal',
    nombre: 'Izamal',
    descripcion: 'Ciudad de las Tres Culturas • Pueblo Mágico',
    etiqueta: 'Más popular',
    icono: 'temple_buddhist',
    tiempo: '1 h 15 min',
    frecuencia: 30,
    precio: 50,
    directo: true,
    cenotes: false,
  },
  {
    id: 'valladolid',
    nombre: 'Valladolid',
    descripcion: 'Cenote Zací • Calzada de los Frailes',
    etiqueta: 'Conexión Oriente',
    icono: 'church',
    tiempo: '2 h 10 min',
    frecuencia: 45,
    precio: 120,
    directo: true,
    cenotes: true,
  },
  {
    id: 'tekit',
    nombre: 'Tekit',
    descripcion: 'Ruta artesanal y talleres textiles',
    etiqueta: 'Capital de la Guayabera',
    icono: 'checkroom',
    tiempo: '1 h 05 min',
    frecuencia: 40,
    precio: 45,
    directo: true,
    cenotes: false,
  },
  {
    id: 'homun',
    nombre: 'Homún',
    descripcion: 'Más de 20 cenotes turísticos y rústicos',
    etiqueta: 'Anillo de Cenotes',
    icono: 'water_drop',
    tiempo: '55 min',
    frecuencia: 25,
    precio: 38,
    directo: false,
    cenotes: true,
  },
  {
    id: 'ticul',
    nombre: 'Ticul',
    descripcion: 'La Perla del Sur • Alfarería y calzado',
    icono: 'diagnosis',
    tiempo: '1 h 30 min',
    frecuencia: 35,
    precio: 60,
    directo: true,
    cenotes: false,
  },
]