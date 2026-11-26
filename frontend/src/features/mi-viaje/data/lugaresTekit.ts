/** Referencias demostrativas de biin_mi_itinerario_en_tekit/code.html.
 * Sin fecha de validación. Visitas y traslados son supuestos del prototipo,
 * no mediciones geográficas, aperturas, precios ni servicios confirmados.
 */
export type CategoriaTekit = 'textil' | 'gastronomia' | 'patrimonio'
export const categoriasTekit = [
  { id: 'textil', nombre: 'Ruta Textil & Talleres', icono: 'styler' },
  { id: 'gastronomia', nombre: 'Gastronomía', icono: 'restaurant' },
  { id: 'patrimonio', nombre: 'Patrimonio', icono: 'church' },
] as const
export const lugaresTekit = [
  { id: 'corredor-textil', categoria: 'textil', nombre: 'Corredor Textil y Tiendas de Fabricantes', descripcion: 'Recorre la tradición familiar de guayaberas de lino y algodón. Consulta directamente las condiciones de visita y compra.', etiqueta: 'Guayaberas y lino', icono: 'styler', visitaMinutos: 65, trasladoMinutos: 2 },
  { id: 'taller-bordado', categoria: 'textil', nombre: 'Taller Artesanal de Bordado y Deshilado', descripcion: 'Una referencia para conocer el bordado en punto de cruz y el deshilado fino tradicional. Confirma con las artesanas si es posible visitar el taller.', etiqueta: 'Bordado y deshilado', icono: 'gesture', visitaMinutos: 45, trasladoMinutos: 3 },
  { id: 'comida-mercado', categoria: 'gastronomia', nombre: 'Cocina Económica Doña Lupita y Mercado', descripcion: 'Referencia gastronómica del prototipo: poc chuc, frijol con puerco y aguas de frutas. Nombre, menú y disponibilidad pendientes de validar.', etiqueta: 'Sabor yucateco', icono: 'restaurant', visitaMinutos: 50, trasladoMinutos: 4 },
  { id: 'parroquia', categoria: 'patrimonio', nombre: 'Parroquia de San Antonio de Padua', descripcion: 'El prototipo propone conocer el templo colonial y su plaza arbolada. Consulta las condiciones de acceso antes de la visita.', etiqueta: 'Patrimonio histórico', icono: 'church', visitaMinutos: 30, trasladoMinutos: 2 },
] as const
export const REGRESO_TEKIT = 3
export const MARGEN_TEKIT = 15
