# Mapa de Inicio

Inicio usa Leaflet y React Leaflet mediante `MapaBase`. El mapa comienza con
una vista general de Mérida. Los detalles de ruta conservan sus mapas
ilustrativos y sus referencias de transporte.

El proveedor de teselas es OpenStreetMap. La atribución enlaza a los derechos
de autor desde el propio mapa. El navegador carga las teselas HTTPS a demanda
y utiliza la caché HTTP del proveedor. No se requieren claves privadas.
La capa base se presenta a color, sin filtros ni transformaciones de teselas. Las
jerarquías de calles y sus rótulos proceden de la cartografía del proveedor.

El botón **Usar mi ubicación** inicia `watchPosition` en un contexto seguro.
La primera lectura y el botón de recentrado ajustan el mapa a un radio aproximado
de 2 km. Leaflet ajusta el zoom a los límites geográficos y al espacio visible.
Las lecturas siguientes actualizan el punto y su círculo de precisión sin mover
la vista. El radio del encuadre es independiente de la precisión del dispositivo.
La aplicación cancela el seguimiento al salir de Inicio o si falla.
Una lectura anterior se señala como desactualizada mientras siga visible.

BIIN mantiene la lectura solo en memoria de la pantalla. Sus coordenadas
no se guardan ni se incluyen en URLs, registros, analítica o peticiones a
la API de BIIN. El proveedor cartográfico recibe las solicitudes normales de
teselas correspondientes al área visible, identificadas por índice de tesela.
La ubicación representa al usuario y su precisión estimada.

- [Documentación de Leaflet](https://leafletjs.com/reference.html)
- [Documentación de React Leaflet](https://react-leaflet.js.org/docs/api-map/)
- [Política de teselas de OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/)
