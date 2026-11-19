import type { Actividad, Interes } from '../../../types/catalogo'
function ficha(destinoId:string,id:string,titulo:string,categoria:Interes,minutos:number,traslado:number,descripcion:string,acceso:string,foto?:string):Actividad {
 return {destinoId,id:`${destinoId}-${id}`,titulo,categoria,minutos,traslado,descripcion,acceso,foto:foto ? `/assets/${foto}` : undefined}
}
// Contenido de muestra transcrito de las pantallas del equipo; acceso sujeto a validación.
export const actividadesDemo:Actividad[]=[
 ficha('izamal','convento','Convento de San Antonio de Padua','Cultura',60,2,'Recorre el atrio y sus arcos amarillos. Conoce la historia de este conjunto franciscano.','Acceso por confirmar','izamal-visita-1.jpg'),
 ficha('izamal','kinich','Restaurante Kinich','Gastronomía',60,5,'Cocina yucateca tradicional: poc chuc, queso relleno y agua de chaya con lima.','Consumo no incluido'),
 ficha('izamal','mercado','Mercado Municipal','Gastronomía',40,3,'Puestos tradicionales de panuchos, escabeche y antojitos locales.','Consumo no incluido'),
 ficha('izamal','cafe','Cafetería La Conquista','Gastronomía',30,2,'Una pausa de café, horchata y marquesitas frente al centro.','Consumo no incluido'),
 ficha('izamal','semilla','Taller de Semilla de Ramón','Talleres',40,4,'Demostración de joyería botánica con artesanas locales.','Acceso por confirmar'),
 ficha('izamal','henequen','Taller de Henequén y Bordado','Talleres',45,6,'Historia del oro verde yucateco y técnicas tradicionales.','Costo por confirmar'),
 ficha('izamal','cocina','Muestra de Cocina de Patio','Talleres',35,5,'Conoce el comal de barro y la elaboración de tortillas a mano.','Acceso por confirmar'),
 ficha('izamal','piramide','Pirámide Kinich Kakmó','Cultura',45,7,'Gran basamento maya con vistas de la ciudad y sus cúpulas coloniales.','Acceso por confirmar','izamal-visita-2.jpg'),
 ficha('izamal','kabul','Pirámide Kabul y Los Remedios','Cultura',30,6,'Patrimonio maya y capilla virreinal entre calles y plazoletas.','Acceso por confirmar'),
 ficha('valladolid','zaci','Cenote Zací y Parque Principal','Cenotes',60,2,'Cenote a cielo abierto y paseo por el centro histórico.','Costo por confirmar','valladolid-visita-1.jpg'),
 ficha('valladolid','mercado','Mercado Municipal Donato Bates','Gastronomía',60,4,'Lomitos, longaniza y escabeche oriental con tortillas hechas a mano.','Consumo no incluido','valladolid-visita-2.jpg'),
 ficha('valladolid','frailes','Calzada de los Frailes','Cultura',60,6,'Paseo entre casonas de colores, perfumerías y café local.','Acceso por confirmar','valladolid-visita-3.jpg'),
 ficha('valladolid','convento','Ex Convento de San Bernardino de Siena','Cultura',40,3,'Conjunto franciscano del barrio de Sisal.','Acceso por confirmar','valladolid-ruta-1.jpg'),
 ficha('homun','santarosa','Cenote Santa Rosa','Cenotes',75,3,'Gruta subterránea de aguas turquesa. Consulta las condiciones de visita.','Costo por confirmar','homun-visita-1.jpg'),
 ficha('homun','tzaujun','Cenote Tza Ujun Kat','Cenotes',60,5,'Caverna semiabierta con entrada de luz natural y estalactitas.','Costo por confirmar','homun-visita-2.jpg'),
 ficha('homun','comida','Cocina tradicional del centro','Gastronomía',55,4,'Cochinita pibil, queso relleno y aguas frescas regionales.','Consumo no incluido','homun-visita-3.jpg'),
 ficha('homun','plaza','Plaza Principal y Parroquia de San Buenaventura','Cultura',30,2,'Pasea por el centro y prueba una nieve artesanal antes de regresar.','Acceso por confirmar'),
 ficha('tekit','textil','Corredor Textil y Tiendas de Fabricantes','Talleres',60,2,'Talleres familiares de guayaberas de lino y algodón.','Compras no incluidas','tekit-ruta-1.jpg'),
 ficha('tekit','bordado','Taller Artesanal de Bordado y Deshilado','Talleres',40,3,'Observa el punto de cruz y el deshilado fino tradicional.','Acceso por confirmar'),
 ficha('tekit','comida','Cocina Económica y Mercado','Gastronomía',45,4,'Poc chuc, frijol con puerco y aguas de frutas frescas.','Consumo no incluido'),
 ficha('tekit','parroquia','Parroquia de San Antonio de Padua','Cultura',30,2,'Templo colonial y plaza arbolada para una pausa al final del paseo.','Acceso por confirmar'),
 ficha('ticul','barro','Barrio de San Enrique y Talleres Alfareros','Talleres',60,3,'Conoce el trabajo de las familias que moldean barro rojo tradicional.','Acceso por confirmar','ticul-visita-1.jpg'),
 ficha('ticul','calzado','Corredor del Calzado Artesanal','Talleres',50,5,'Sandalias, mocasines y calzado de piel hechos en talleres locales.','Compras no incluidas','ticul-visita-2.jpg'),
 ficha('ticul','comida','Poc Chuc Ticuleño y Panuchos de Pavo','Gastronomía',50,5,'Comida regional en el Mercado Municipal.','Consumo no incluido','ticul-visita-3.jpg'),
 ficha('ticul','convento','Ex Convento e Iglesia de San Antonio de Padua','Cultura',30,2,'Atrio y arquitectura franciscana en el centro de Ticul.','Acceso por confirmar','ticul-visita-4.jpg'),
]
