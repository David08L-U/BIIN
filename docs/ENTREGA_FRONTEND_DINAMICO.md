# Entrega del frontend dinámico de BIIN

Alcance de esta entrega. Detalle de rutas (CU-03) y gestión de itinerarios (CU-09 / RF09).

Las rutas públicas resuelven Izamal, Valladolid, Tekit, Homún y Ticul con tres entradas compartidas.

| URL | Composición |
| --- | --- |
| `/rutas/:id` | `DetalleRutaPage` resuelve el destino y monta `DetalleDestino`. |
| `/rutas/:id/itinerario` | `ItinerarioPage` configura, genera y presenta el plan. Coordina guardado, enlace y descarga. |
| `/rutas/:id/personalizar` | `PersonalizarPage` conserva categorías, orden de selección, presupuesto y asignación de visitas por jornada. |

`registroDestinos` vincula cada slug con la ruta y los datos de detalle. `registroPlanificadores` conecta los datos de presentación, la configuración y las capacidades tipadas de cada destino. `adaptarPlanificador` convierte los resultados y selecciones al modelo de las vistas. `usePlanificador` coordina lectura, generación y edición de la URL. Las páginas reinician su estado local al cambiar de slug. Los filtros actúan sobre las tarjetas visibles y dejan intacto el plan que se envía al servidor o a la descarga.

## Archivos retirados y responsabilidades que se conservan

- Se retiraron las 15 páginas antiguas `Detalle*Page`, `Itinerario*Page` y `Personalizar*Page` de los cinco destinos, los cinco hooks `useBorrador*`, los tres envoltorios `Modos*` particulares y el índice de imágenes de Izamal sin consumidores. La búsqueda de fotos reutiliza `fotografiaLugar` y las referencias de Explorar.
- `detalle*Prototipo` conserva descripciones, opciones y referencias locales de transporte. `lugares*` conserva categorías, nombres, orden de catálogo y estimaciones de cada destino.
- `borrador*` conserva codecs de URL, parámetros históricos y cambios de modalidad. Las configuraciones particulares adaptan esos campos al formulario `ConfiguracionVisita`, incluida la preferencia temática de Tekit y Ticul y las etiquetas de jornadas de Homún y Valladolid.
- `itinerario*` conserva reglas, preferencias y recomendaciones de cada destino. `recorridoJornadas` y `recorridoSecuencial` calculan los tramos compartidos. En fin de semana se muestra una llegada inicial y un regreso final. Los traslados locales siguen en cada jornada.
- `acciones*` conserva los formatos de descarga existentes. Para Izamal se incorporó descarga de texto desde el planificador. `planificador.css` reúne los estilos del planificador, la entrada y Mi viaje.
- Mi viaje sigue usando la API de itinerarios para abrir, actualizar y eliminar viajes por cuenta, y mantiene la importación local explícita. Un enlace generado con fecha pasada permite consulta y descarga. Si se modifica el borrador para volver a generar, se aplica la validación de fecha local. Los registros anteriores sin borrador siguen disponibles en su vista histórica.

## Validación

Los contratos recorren los cinco destinos con dos jornadas, verifican el orden, las horas, el enlace y el tramo final. Las regresiones del router cubren identificadores desconocidos, cambio de slug, Atrás, teclado y lectura de una fecha pasada. Las suites de detalle, viajes y acceso conservan las verificaciones de validación, filtros, invalidación, persistencia simulada, importación, eliminación, descarga, errores y retorno tras acceso.

La suite pasó con 667 pruebas en 50 archivos. Se agregaron cinco casos de contrato y cinco regresiones de router y presentación, sin retirar casos. `git diff --check`, lint con `--deny-warnings` y build pasaron. Vite emitió su advertencia de 500 kB para el JavaScript principal, que quedó en 654.53 kB minificado y 191.05 kB gzip.

En PowerShell, repite las comprobaciones desde la raíz con `git diff --check`, `npm.cmd test --prefix frontend`, `npm.cmd run lint --prefix frontend -- --deny-warnings` y `npm.cmd run build --prefix frontend`. En otras terminales usa `npm`. Las pruebas de persistencia del frontend usan una API simulada. Esta entrega conserva la implementación de PostgreSQL existente.

Se revisaron capturas de detalle, itinerario y personalización de Tekit en Edge. En 360, 393 y 480 px se verificaron el ancho, el foco, la navegación inferior única con Rutas activa y las acciones finales del itinerario. También se comprobó el ancho y la navegación a 1280 px.

Para repetir la revisión, inicia `npm.cmd run dev --prefix frontend` y abre Edge DevTools en modo adaptable. En 360, 393 y 480 px, abre `/rutas/tekit`, genera un recomendado con una fecha futura y abre Personalizar desde las acciones finales. Recorre con Tab los filtros, las casillas y las acciones. Repite con fin de semana para revisar ambas jornadas. Para revisar Inicio, permite y deniega ubicación en dos sesiones y comprueba el encuadre y la marquesita.

## Continuidad del equipo

Quedan los catálogos de backend y su integración con el frontend, administración, operador, Google y recuperación de contraseña. Los catálogos de detalle y lugares de este cambio siguen siendo locales. La persistencia de itinerarios usa el contrato de API previo.
