# Explorar: datos y futura integración

La pantalla actual usa como datos demostrativos los mismos catálogos de lugares que alimentan los planificadores locales de Izamal, Valladolid, Tekit, Homún y Ticul. Los textos y tiempos de esos prototipos no acreditan horarios, precios, apertura ni disponibilidad. Las imágenes solo se muestran cuando existe un recurso local registrado para ese lugar.

Al conectar un servicio, Explorar necesitará una fuente de lugares publicada por destino con identificadores estables y únicos dentro del destino, nombre, descripción, categoría, fotografía autorizada y su texto alternativo, además del estado/fecha de validación. El servicio debe poder consultar por texto, destino y categorías disponibles y devolver resultados paginados. Esta implementación no crea un contrato ni hace llamadas remotas.

La acción «Planear visita» abre el detalle y el planificador ya existentes del destino; no añade automáticamente un lugar al borrador.
