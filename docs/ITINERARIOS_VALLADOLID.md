# Itinerarios de Valladolid — CU-09 / RF09

Implementación de demostración en `frontend/src/features/mi-viaje`, con datos,
cálculo puro, borrador de URL, interfaz y almacenamiento separados. No añade
dependencias ni modifica backend, autenticación o permisos. `/mi-viaje` mantiene
la protección existente. Las pantallas y los exports de Izamal siguen disponibles.

## Pantallas y borrador

- `/rutas/valladolid`: conserva el selector aprobado y abre el planificador.
- `/rutas/valladolid/itinerario`: recomendado o resultado personalizado.
- `/rutas/valladolid/personalizar`: selección inicialmente vacía y asignación por día.
- `/mi-viaje`: lista y abre los planes de ambos destinos de la cuenta actual.

La URL conserva estancia, fecha inicial, `inicio`/`minutos` de la primera jornada,
`inicio2`/`minutos2` de la segunda, modo, lugares (`dia1`/`dia2`) y `generado=1`.
La segunda fecha siempre se deriva de la primera por calendario local; no se
acepta como fecha independiente ni se suman 24 horas en milisegundos. Un cambio
de configuración o selección invalida la generación. Los filtros solo cambian las
tarjetas visibles: guardar y descargar usan el plan completo.

Una dirección sin parámetros inicia con valores editables y sin fecha ni resultado.
Si se proporciona una configuración parcial, los campos ausentes quedan pendientes:
no se completa silenciosamente una URL manipulada para generar un plan. Fechas,
horas, números, modo, estancia, duplicados y asignaciones se validan antes del cálculo.
Los enlaces no incluyen identificadores de cuenta ni credenciales. Se interpretan
en la zona local del navegador que los abre, también después del acceso existente.

## Datos y cálculo

Los cuatro lugares, descripciones, tres imágenes de visitas, mapa y tiempos proceden
de `biin_mi_itinerario_en_valladolid/code.html`. El convento no tiene imagen de visita
en esa pantalla. No se usan precios de entrada, accesos gratuitos, aperturas,
horarios de transporte, GPS ni distancias como información confirmada.

| Visita | Minutos de visita | Traslado previo de demostración |
|---|---:|---:|
| Cenote Zací y Parque Principal | 60 | 2 |
| Mercado Municipal Donato Bates | 75 | 4 |
| Calzada de los Frailes y Boutiques | 65 | 6 |
| Ex Convento de San Bernardino de Siena | 40 | 3 |

Cada jornada añade 5 minutos de traslado final y 15 de margen final. Los cuatro
lugares suman 275 minutos con estos conceptos, por lo que no caben todos en el
valor inicial de medio día (270). El recomendado elige visitas completas que caben;
no recorta visitas ni afirma optimización geográfica. La personalización conserva
la selección y explica el exceso de cada jornada, sin compensarlo con tiempo de otra.

Medio día inicia con 270 minutos (referencia 4–5 horas); día completo, con 540
(referencia 8–10 horas). Fin de semana inicia con dos ventanas de 270 minutos y
exige una visita al menos en cada jornada, sin repetir automáticamente lugares.
Las duraciones son enteros editables entre 15 y 720 minutos por día. Las ventanas
deben empezar y terminar entre 06:00 y 22:00 en la misma fecha. Este es un límite
del planificador para evitar visitas nocturnas, no una afirmación sobre aperturas.
No se calcula alojamiento, traslado nocturno ni transporte entre jornadas.

El orden personalizado sigue la selección dentro de cada día. El recomendado
evalúa las asignaciones de solo cuatro lugares: prioriza cantidad de visitas,
reparto entre jornadas y tiempo de visita, siempre dentro de cada ventana. Si no
hay combinación para ambas jornadas, pide ampliar ventanas o cambiar la estancia.
La hora de regreso es un objetivo del usuario, no una salida reservada o confirmada.

## Compatibilidad y guardado local

Se conserva `biin:itinerarios:v1:<idUsuario>` y el envoltorio `{ version: 1,
itinerarios: [...] }`. No hay migración ni borrado de otra clave:

- Los registros antiguos sin `destino` se leen como Izamal, con su identificador original.
- Los nuevos registros indican `destino: 'izamal'` o `destino: 'valladolid'`.
- Valladolid también identifica el destino en el borrador y guarda ambas ventanas y selección.
- La identidad incluye destino, estancia, modo, configuración y selección por jornada.
- Guardar repetidamente un mismo plan devuelve el registro existente.
- La lectura conserva los registros válidos de un conjunto parcialmente dañado y
  avisa del resto; cualquier error de lectura bloquea nuevas escrituras sobre el original.
- Una escritura fallida devuelve error y conserva los registros anteriores.

No hay sincronización con el servidor. Las claves por cuenta separan listados,
sin sustituir autorización del backend ni cifrar datos del navegador. El resultado
se recalcula con los datos de demostración al abrirlo, como en Izamal. Los invitados
pueden preparar una vista previa y volver a ella tras iniciar sesión; guardar
requiere la cuenta existente y solo anuncia éxito después de una respuesta correcta.

## Acciones y límites

Compartir usa Web Share cuando está disponible; si falla, intenta copiar mediante
Clipboard. Una cancelación no afirma éxito ni copia sin petición. Si ambas vías
fallan, muestra el enlace seleccionable para copia manual. La URL reproduce la
vista previa, sin alterar el plan guardado.

Descargar plan genera un `.txt` UTF-8 con fechas, bloques, objetivos y sumas de ambas
jornadas. No incluye mapas offline ni reservas. La interfaz comunica la solicitud
de descarga o el fallo real; no afirma que el archivo se haya guardado en disco.
El mapa ofrece ver el detalle de ruta y una alternativa si su imagen falla.

## Verificación pendiente

El revisor ejecuta desde la raíz `git diff --check`, `npm --prefix frontend test`,
`npm --prefix frontend run lint` y `npm --prefix frontend run build`. Revisar también
ambos flujos a 360, 393 y 480 px, foco/teclado, cronología, imágenes y controles
sobre la navegación inferior. No se ejecutaron terminal, pruebas ni build al implementar.

## Archivos de esta etapa y grupos para revisión

Las rutas del módulo siguientes parten de `frontend/src/features/mi-viaje/`.

| Grupo | Archivos nuevos | Archivos modificados | Propósito |
|---|---|---|---|
| Cálculo y datos | `data/lugaresValladolid.ts`, `plan/itinerarioValladolid.ts`, `plan/borradorValladolid.ts`, `plan/tiempoLocal.ts` | `plan/itinerarioIzamal.ts` | Datos originales, cálculo por jornada, validación y URL. Extrae las fechas locales conservando los exports de Izamal. |
| Compatibilidad de almacenamiento | — | `storage/itinerariosLocales.ts`, `pages/MiViajePage.tsx` | Unión por destino, compatibilidad v1, identidad, protección de datos dañados y enlaces propios en el listado. |
| Interfaz | `components/ConfiguracionValladolid.tsx`, `hooks/useBorradorValladolid.ts`, `pages/ItinerarioValladolidPage.tsx`, `pages/PersonalizarValladolidPage.tsx`, `plan/accionesValladolid.ts` | `components/ImagenItinerario.tsx` | Dos pantallas, configuración, selección, acciones reales e imágenes compartidas con clase opcional. |

Integración y estilos, relativos a `frontend/src/`:

- Nuevo `styles/itinerario-valladolid.css`: composición propia del itinerario y ajustes exclusivos del selector de Valladolid.
- Modificados `app/router.tsx` y `components/layout/Layout.tsx`: rutas públicas del flujo, una sola cabecera y Rutas activa.
- Modificado `features/transporte/pages/DetalleValladolidPage.tsx`: conexión del botón y conservación de estancia en URL.
- Modificado `styles/detalle-valladolid.css`: retira únicamente dos reglas del aviso pendiente que ya no se usa.

Pruebas, relativas a `frontend/tests/`:

- Nuevas `mi-viaje/itinerarioValladolid.test.ts`, `mi-viaje/compatibilidadItinerarios.test.ts`, `mi-viaje/accionesValladolid.test.ts` y `mi-viaje/FlujoValladolid.test.tsx`.
- Modificada `DetalleValladolid.test.tsx`: sustituye la expectativa de planificador pendiente por navegación y retorno conservando estancia.

Documentación: nuevo `docs/ITINERARIOS_VALLADOLID.md`; modificados
`docs/ITINERARIOS_IZAMAL.md` y `docs/ARQUITECTURA.md` para describir la ampliación
compatible. Se pueden incluir con el grupo de cálculo o de almacenamiento según
el fragmento. Ningún grupo implica ejecutar commits automáticamente.
