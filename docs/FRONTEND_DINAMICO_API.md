# Frontend dinámico conectado a la API

Rama de trabajo: `feature/aaron-mejoras`, basada en `a4eed997a1acb09af54ec57467b67ab33681984b` de `main`.
Trazabilidad: RF02, RF03, RF05–RF07, RF09; CU-02, CU-03, CU-09, CU-13, CU-14; RNF01, RNF04, RNF06–RNF08.

## Pantallas y fuente de datos

| URL | Componente | Fuente |
| --- | --- | --- |
| `/rutas/:id` | `DetalleRutaPage` y `DetalleRutaPublicada` | `GET /api/rutas/{id}` |
| `/rutas/:id/itinerario` | `PlanificadorPage`, recomendado | Ruta → localidad de destino → recorridos publicados |
| `/rutas/:id/personalizar` | El mismo `PlanificadorPage`, personalizado | El mismo recorrido y sus etapas |
| `/recorridos/:idRecorrido/itinerario` | `PlanificadorPage`, recomendado | `GET /api/recorridos/{id}` |
| `/recorridos/:idRecorrido/personalizar` | El mismo `PlanificadorPage`, personalizado | `GET /api/recorridos/{id}` |
| `/mi-viaje` | `MiViajePage` | `GET /api/itinerarios`, requiere sesión |
| `/mi-viaje/:idItinerario` | `ItinerarioGuardadoPage` | Detalle y CRUD de actividades de la cuenta actual |
| `/explorar` | `ExplorarPage` | `GET /api/explorar` |
| `/explorar/:tipo/:id` | `ExplorarDetallePage` | Lugares, negocios o eventos publicados |

No se importan catálogos locales por pueblo. Se retiraron las cinco páginas de detalle, cinco de itinerario y cinco de personalización, junto con sus motores locales, hooks de borrador y diez hojas de estilo específicas. `destino.css` y `planificador.css` mantienen la base visual compartida.

El servidor devuelve identificadores enteros. Una sexta localidad publicada se consulta sin editar el router ni añadir condiciones por nombre. Los enlaces antiguos de detalle que contienen nombres se resuelven consultando `/api/rutas?destino=...`; si hay varias rutas, el usuario elige una. Los enlaces anteriores a lugares del prototipo muestran cómo buscar el contenido publicado; sus ids locales no se convierten en ids de base de datos.

## Guardado y edición

- Recomendado: `POST /api/itinerarios/desde-recorrido/{idRecorrido}`, con fechas, presupuesto y hora local de Yucatán. El backend asigna horarios y traslados estimados y devuelve sus advertencias.
- Personalizado: selección y orden de etapas de la API; `POST /api/itinerarios` y altas de actividades por `idRecurso`. Los horarios y notas se editan sobre el plan guardado; los eventos conservan sus fechas publicadas.
- Los borradores conservan nombre, fechas, presupuesto, hora y selección en la URL al cambiar de modo, recargar o iniciar sesión. No incluyen tokens.
- Los cambios de nombre, fechas, presupuesto, horarios, notas, orden y selección de actividades usan el CRUD normalizado existente. La respuesta del servidor sustituye el estado mostrado.
- No hay nuevas tablas, migraciones ni documentos JSONB. Se usan `itinerarios` y `actividades_itinerario` mediante `ItinerariosController`.
- Las escrituras se serializan. Un fallo parcial conserva el id creado y dirige a completar ese plan; una respuesta incierta tras POST pide revisar Mis itinerarios antes de crear otro.
- Los cambios de cuenta o destino descartan respuestas antiguas. El guardado deja de encadenar escrituras al abandonar la pantalla o cambiar la sesión.

Los datos v1 que ya existían en `localStorage` no se borran ni se migran automáticamente. Mi viaje y Perfil consultan los planes del servidor. El favorito de ruta sigue siendo una preferencia del navegador, identificada por el id real de ruta y rotulada como local.

## Datos faltantes y vigencia

Una consulta vacía no se rellena con precios, imágenes, paradas ni horarios del prototipo. Se muestran carga, error con reintento, catálogo vacío y contenido no publicado. Cero pesos y cero asientos son valores válidos; no equivalen a un dato ausente.

La ficha muestra actualización, tarifas por tramo, horarios vigentes, regresos y salidas con fecha de reporte y vencimiento. La vigencia del cupo se reevalúa con la pantalla abierta. El mapa utiliza las coordenadas y el trazo publicados; si no hay trazo solo presenta ubicaciones. No conecta visitas con una línea que parezca un recorrido de calles confirmado.

Las fechas de actividades se muestran en `America/Merida`. Las entradas se convierten explícitamente desde Yucatán a UTC al enviarse al backend. Los itinerarios pueden consultarse con fechas pasadas; se valida el orden de fechas y el máximo de 60 días.

La descarga JSON de un itinerario incluye fecha de descarga y datos recibidos del servidor; no implementa navegación offline ni actualización automática de esa copia.

## Ejecución y revisión

1. Seguir `README.md` para PostgreSQL, `appsettings.Development.json` y usuario de prueba.
2. Ejecutar la API en `http://localhost:5080` y comprobar `/api/salud`.
3. Ejecutar `npm ci --prefix frontend` y `npm run dev --prefix frontend`.
4. Cargar contenidos publicados. Para una prueba local ficticia, el script existente `pwsh ./database/cargar_demo.ps1` carga la demo sin recrear la base. Revisar los scripts y respaldar los datos según el flujo del equipo.
5. Abrir Rutas, elegir una ruta por id, consultar detalle, recomendar o personalizar, guardar y editar desde Mi viaje. Probar una localidad adicional sin tocar el frontend.
6. Revisar a 360, 393, 480 px y escritorio: foco, controles de fecha, campos largos, mapa y acciones por encima de la navegación inferior. Esta revisión visual y la prueba contra la base de datos del equipo quedan pendientes del usuario.

Validación automatizada: `npm test --prefix frontend` (151 pruebas en 22 archivos), `npm run lint --prefix frontend -- --deny-warnings`, `npm run build --prefix frontend`, `git diff --check`. Las pruebas de API del frontend simulan respuestas compatibles con los DTO de este repositorio; no son una ejecución del backend ni de PostgreSQL real. No se modificó el backend en esta rama. La compilación emite el aviso de Vite sobre el tamaño del paquete principal; termina correctamente.

La revisión y aprobación del equipo preceden a cualquier merge de esta rama a `main`.
