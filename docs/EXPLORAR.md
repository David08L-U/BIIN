# Explorar: datos y futura integración

> Documento histórico del prototipo anterior. La implementación vigente en `feature/aaron-mejoras` se describe en [FRONTEND_DINAMICO_API.md](FRONTEND_DINAMICO_API.md); sus catálogos locales y páginas por pueblo ya no se utilizan.

La pantalla actual usa como datos demostrativos los mismos catálogos de lugares que alimentan los planificadores locales de Izamal, Valladolid, Tekit, Homún y Ticul. Los textos y tiempos de esos prototipos no acreditan horarios, precios, apertura ni disponibilidad. Las imágenes solo se muestran cuando existe un recurso local registrado para ese lugar.

Al conectar un servicio, Explorar necesitará una fuente de lugares publicada por destino con identificadores estables y únicos dentro del destino, nombre, descripción, categoría, fotografía autorizada y su texto alternativo, además del estado/fecha de validación. El servicio debe poder consultar por texto, destino y categorías disponibles y devolver resultados paginados. Esta implementación no crea un contrato ni hace llamadas remotas.

La acción «Planear visita» abre el planificador recomendado ya existente. «Agregar a itinerario» ofrece el borrador actual del mismo destino (si se llegó desde un planificador), los viajes guardados de esa cuenta y crear un plan nuevo. Los viajes guardados se identifican por destino, fecha y estado temporal; las opciones pertenecen solo al destino del lugar.

Al elegir un borrador o viaje guardado, el lugar se suma a la selección personalizada y se abre el planificador existente con el resultado invalidado para que vuelva a calcularse. En planes de varias jornadas se puede elegir el día. Un viaje guardado no cambia en este paso: para editarlo debe generarse un nuevo resultado y confirmarse «Guardar cambios». Cancelar la edición conserva el guardado original. Si el usuario no ha iniciado sesión, se conserva el lugar en la URL de retorno al acceso. Todo el guardado sigue usando el almacenamiento local v1 por identificador de cuenta; no se crea otro sistema ni se sincroniza con el servidor.

## Fotografías con procedencia

Las nueve fotografías con correspondencia identificable y licencia están empaquetadas en `frontend/src/assets/explorar`; las tarjetas no dependen de una petición de imagen externa en tiempo de ejecución. La tabla conserva procedencia, autor y licencia. Las imágenes cargan de forma diferida, tienen texto alternativo y muestran una alternativa accesible si falla la carga local. Los registros restantes no reutilizan fotos genéricas como si fueran lugares concretos.

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
