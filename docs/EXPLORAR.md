# Explorar: datos y futura integración

La pantalla actual usa como datos demostrativos los mismos catálogos de lugares que alimentan los planificadores locales de Izamal, Valladolid, Tekit, Homún y Ticul. Los textos y tiempos de esos prototipos no acreditan horarios, precios, apertura ni disponibilidad. Las imágenes solo se muestran cuando existe un recurso local registrado para ese lugar.

Al conectar un servicio, Explorar necesitará una fuente de lugares publicada por destino con identificadores estables y únicos dentro del destino, nombre, descripción, categoría, fotografía autorizada y su texto alternativo, además del estado/fecha de validación. El servicio debe poder consultar por texto, destino y categorías disponibles y devolver resultados paginados. Esta implementación no crea un contrato ni hace llamadas remotas.

La acción «Planear visita» abre el detalle y el planificador ya existentes del destino; no añade automáticamente un lugar al borrador.

## Fotografías con procedencia

Las tarjetas solo muestran una foto cuando el archivo de Commons identifica el sitio concreto. La tarjeta enlaza su atribución/licencia. Se usa `Special:FilePath` con ancho de 960 px y carga diferida; si el proveedor no sirve el archivo se muestra la alternativa accesible. Las imágenes decorativas/genéricas del prototipo no se usan como fotos de lugares.

| Destino · registro | Fuente / autor | Licencia |
|---|---|---|
| Izamal · Mercado Municipal | [Mercado Municipal De Izamal 02](https://commons.wikimedia.org/wiki/File:Mercado_Municipal_De_Izamal_02.jpg) · Codas | CC BY-SA 4.0 |
| Izamal · Restaurante Kinich | [Restaurante Kinich (abril 2021)](https://commons.wikimedia.org/wiki/File:Restaurante_Kinich,_Izamal,_Yucatan,_Mexico_-_Abril_2021.jpg) · Sharon Hahn Darlin | CC BY 2.0 |
| Izamal · Convento de San Antonio | [Corredores del convento](https://commons.wikimedia.org/wiki/File:Corredores_del_Convento_de_San_Antonio_de_Padua_en_Izamal.jpg) · Lorena Allende | CC BY-SA 4.0 |
| Izamal · Pirámide Kinich Kakmó | [Pirámide Kinich Izamal](https://commons.wikimedia.org/wiki/File:Piramide_Kinich_Izamal.jpg) · Patrickrichaud | CC BY-SA 4.0 |
| Valladolid · Cenote Zací | [Cenote Zací 01](https://commons.wikimedia.org/wiki/File:Cenote_Zac%C3%AD_01.jpg) · Haakon S. Krohn | CC BY 4.0 |
| Valladolid · Mercado General Donato Bates | [Mercado Municipal de Valladolid](https://commons.wikimedia.org/wiki/File:Mercado_Municipal_de_Valladolid,_Yucat%C3%A1n.jpg) · Jars.b | CC BY-SA 4.0 |
| Valladolid · Calzada de los Frailes | [Calzada frailes](https://commons.wikimedia.org/wiki/File:Calzada_frailes.jpg) · Alcocermr | Dominio público |
| Valladolid · Ex Convento de San Bernardino | [Convento de San Bernardino de Siena](https://commons.wikimedia.org/wiki/File:Convento_de_San_Bernardino_de_Siena.jpg) · Haakon S. Krohn | CC BY 4.0 |
| Ticul · Parroquia de San Antonio de Padua | [Parroquia de Ticul](https://commons.wikimedia.org/wiki/File:Parroquia_San_Antonio_de_Padua_-_Ticul,_Yucat%C3%A1n_M%C3%A9xico.jpg) · Joanygg90 | CC BY-SA 4.0 |

Pendientes de contenido fotográfico identificable, sin usar imágenes genéricas como sustituto: Izamal (Cafetería La Conquista, Taller de Semilla de Ramón, Taller de Henequén y Tintes, Muestra de Cocina de Humo, Pirámide Kabul & Los Remedios); Tekit (Corredor Textil, Taller de Bordado, Cocina Doña Lupita y Mercado, Parroquia); Homún (Cenote Santa Rosa, Cenote Tza Ujun Kat, Restaurante El Cenote y Cocina Tradicional, Plaza y Parroquia de San Buenaventura); Ticul (Talleres Alfareros, Corredor del Calzado, Comida/Mercado). Los recursos anteriores de estos registros eran imágenes de prototipo sin correspondencia fotográfica/licencia verificable.
