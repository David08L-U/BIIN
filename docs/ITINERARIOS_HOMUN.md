# Itinerarios de Homún — CU-09 / RF09, HU09

Implementación frontend demostrativa de la actividad 13 del plan del proyecto.
Reutiliza el cálculo secuencial y el comportamiento de jornadas de Valladolid,
manteniendo los contratos de los tres destinos existentes. No añade dependencias
ni cambia backend, autenticación, permisos o modelo de BD.

## Pantallas y composición

- `/rutas/homun`: el botón del detalle abre el flujo con la estancia elegida.
- `/rutas/homun/itinerario`: configuración y resultado recomendado o personalizado.
- `/rutas/homun/personalizar`: selección inicialmente vacía por categorías, contador
  y presupuesto independiente por jornada. Las visitas de fin de semana se asignan
  a Día 1 o Día 2 con un selector nativo.
- `/mi-viaje`: conserva la protección existente y abre Izamal, Valladolid, Tekit y Homún.

El itinerario conserva la composición propia del HTML de Homún: título junto al
regreso, resumen del circuito, conexión blanca con bloques beige de inicio y regreso,
filtros horizontales, tarjetas con tres imágenes originales, cierre beige, mapa,
consejos y acciones finales. La plaza no tiene imagen de visita en ese HTML.
Las imágenes tienen alternativa visible si fallan. Hay una sola navegación inferior
con Rutas activa, controles nativos, etiquetas y foco visible. El CSS usa el prefijo
`hm-`, sin alterar los estilos de otras pantallas.

Fuentes locales leídas:

- `../BIIN-prototipo-melanie/biin_mi_itinerario_en_hom_n/code.html`.
- `../BIIN-prototipo-melanie/biin_detalle_de_ruta_hom_n/code.html`.
- `biin-compatible.css` y las interacciones de navegación, planificación, guardado,
  filtros, compartir y descarga de `biin-interaction.js`.

No se importan sus simulaciones de guardado/descarga, tarifas o condiciones de acceso.
Se conserva el detalle aprobado, incluidas sus referencias culturales neutrales.

## Configuración y borrador

Medio día inicia con **270 minutos** editables; día completo, con **540**. Fin de
semana inicia con **dos jornadas de 270 minutos**, cada una editable por separado.
Las horas iniciales son sugerencias editables, no llegadas confirmadas de transporte.

La primera fecha se elige y la segunda se deriva por calendario local, como en
Valladolid. Las horas se interpretan en la zona local del navegador, sin leer
YYYY-MM-DD como UTC. Cada ventana admite de 15 a 720 minutos enteros y debe
empezar y terminar entre 06:00 y 22:00 de su fecha. Ese horario es un límite del
planificador, no una afirmación sobre aperturas. No se modelan actividades nocturnas,
alojamiento, transporte entre jornadas ni 48 horas continuas de visitas.

El borrador vive en la URL: `estancia`, `fecha`, `inicio`, `minutos`, `inicio2`,
`minutos2`, `modo`, `dia1`, `dia2` y `generado=1`. Conserva el orden de selección
dentro de cada jornada. No contiene identificadores de cuenta ni credenciales.
Recarga, acceso directo, regreso al detalle y navegación atrás/adelante recuperan
el estado desde la URL. Una configuración parcial deja los campos faltantes pendientes;
fechas imposibles, horas, enteros, estancia, modo, parámetros repetidos y selecciones
inválidas impiden producir un resultado. También se rechazan asignaciones ajenas
a las jornadas disponibles y lugares de otros destinos.

Cambiar configuración, selección, asignación o modo invalida el resultado anterior.
Personalizar un resultado hereda su configuración y visitas. Una personalización
nueva comienza vacía. Restablecer limpia todas las selecciones y la generación,
conservando configuración. Al pasar de dos jornadas a una, las visitas se asignan
al Día 1 y se valida de nuevo, sin eliminar visitas si ya no caben.

## Datos, traslados y cálculo

Las cuatro referencias y sus imágenes proceden del itinerario HTML de Homún.
Son demostrativas, sin fecha de validación. No se añaden negocios para completar tiempo.

| Lugar | Visita (min) | Traslado previo del prototipo |
|---|---:|---|
| Cenote Santa Rosa | 75 | 3 min en mototaxi |
| Cenote Tza Ujun Kat | 65 | 5 min entre senderos |
| Restaurante El Cenote y Cocina Tradicional | 60 | 4 min en mototaxi |
| Plaza Principal y Parroquia de San Buenaventura | 35 | 2 min a pie |

Los datos conservan tipo, nombre e icono de traslado. El resultado y el archivo
descargado mantienen el medio de cada trayecto; no se convierten todos en caminatas.
Los tiempos son supuestos de planificación del prototipo, no mediciones geográficas.
El mototaxi no se contrata y su disponibilidad o precio no están confirmados.

El HTML no define duración, medio ni trayecto del regreso final. Se reserva un
**supuesto explícito de 5 minutos** por jornada, con medio y trayecto por confirmar,
además de **15 minutos de margen**. Las cuatro visitas en una jornada suman:

`235 min de visitas + 14 min de traslados previos + 5 min de regreso + 15 min de margen = 269 min (4 h 29 min)`.

Medio día deja 1 minuto libre y día completo, 271. En fin de semana, repartir las
cuatro visitas añade un segundo regreso y margen: 289 minutos de plan entre ambas
jornadas, sin incluir la noche. Cada jornada muestra su suma e intervalo de tiempo
libre. No se fija la duración del chip a 4 h 15 min ni se repiten visitas para rellenar.
El contador vacío reserva 15 minutos de margen; no representa un plan generado.

`recorridoJornadas.ts` extrae de Valladolid únicamente ventanas, validación,
asignación recomendada y cálculo por jornada. Parametriza lugares, regreso, margen
y título del regreso, y llama a `recorridoSecuencial.ts` para sumas y bloques.
Valladolid conserva sus exports, interfaces, títulos, selección recomendada y tiempos.
Homún aporta su catálogo y etiqueta los tipos de traslado en los bloques resultantes.

El recomendado evalúa combinaciones de los cuatro lugares, priorizando cantidad,
reparto por jornadas y minutos de visita, como Valladolid. Cada jornada debe contener
al menos una visita y caber con regreso y margen. Personalizado explica el exceso
por día sin compensarlo con tiempo de otra jornada ni quitar o truncar lugares.
Los bloques tienen minutos enteros, contiguos y sin solapamientos.

Los filtros del selector conservan las selecciones de otras categorías. En el
resultado, Ruta Sugerida muestra todas las visitas; Cenotes & Cavernas y Gastronomía
filtran solo las tarjetas visibles. Guardar, compartir, descargar, cierre y cronología
usan siempre el plan completo.

## Mensajes y acciones

No se presentan como verificados precios de entradas, chaleco incluido, acceso,
aperturas, frecuencia de vans, distancia del circuito, GPS ni metros hasta la parada.
Las descripciones y fotos son referencias del prototipo. Los consejos invitan a
consultar requisitos, servicios y normas de conservación de cada establecimiento.
El regreso es un objetivo del usuario, no una salida de van confirmada.

Compartir reutiliza `accionesPlan.ts`: Web Share, copia real mediante Clipboard y
enlace seleccionable si ambas vías faltan o fallan. `AbortError`, también como objeto
de otro contexto, cancela sin copiar ni anunciar éxito. El enlace reproduce el
borrador en la zona local del navegador que lo abre, sin datos de cuenta.

Descargar plan solicita un `.txt` UTF-8 con fecha de generación, fechas locales,
tipo de traslado, bloques, sumas, tiempo libre, supuestos y objetivos de cada jornada.
La URL temporal se revoca. Se anuncia la solicitud o el fallo, sin afirmar que el
archivo se haya guardado en disco. No incluye mapas offline ni reservas. El mapa
abre el detalle de ruta en lugar de simular una vista en vivo.

## Guardado compatible

Se mantiene `biin:itinerarios:v1:<idUsuario>` y el envoltorio `{ version: 1,
itinerarios: [...] }`. No se migran ni borran claves. Los registros antiguos sin
destino siguen siendo Izamal con su identificador original. Valladolid conserva
una o dos jornadas y Tekit su modalidad textil. Homún indica `destino: 'homun'`
tanto en el registro como en el borrador.

La identidad considera destino, estancia, modo, fechas, horas, minutos y selección
ordenada de cada jornada activa. Guardar repetidamente devuelve el registro existente.
Las cuentas conservan claves y listados separados. La lectura valida tipos y el
cálculo antes de aceptar registros. Un conjunto parcialmente dañado permite leer
los registros válidos y bloquea escrituras sobre el original. JSON dañado, acceso
bloqueado y falta de espacio no anuncian éxito ni sustituyen los datos previos.

Los invitados pueden preparar una vista previa. Guardar utiliza el acceso existente,
recupera la URL de borrador y requiere pulsar guardar después del acceso. No cambia
autenticación ni permisos. `/mi-viaje` sigue protegido. El guardado es local y sin
sincronización de servidor; al abrir, el plan se recalcula con el catálogo actual.

## Archivos y grupos sugeridos para commits

Rutas del módulo relativas a `frontend/src/features/mi-viaje/`:

| Grupo | Archivos | Propósito |
|---|---|---|
| Cálculo y datos | Nuevos `data/lugaresHomun.ts`, `plan/recorridoJornadas.ts`, `plan/itinerarioHomun.ts`, `plan/borradorHomun.ts`; modificado `plan/itinerarioValladolid.ts` | Referencias e imágenes, tipos de traslado, jornadas parametrizadas y borrador validado. |
| Almacenamiento | Modificados `storage/itinerariosLocales.ts`, `pages/MiViajePage.tsx` | Destino Homún, identidad compatible y enlaces de los cuatro destinos. |
| Interfaz | Nuevos `components/ConfiguracionHomun.tsx`, `components/ModosHomun.tsx`, `hooks/useBorradorHomun.ts`, `pages/ItinerarioHomunPage.tsx`, `pages/PersonalizarHomunPage.tsx`, `plan/accionesHomun.ts` | Configuración, selección, resultado y acciones reales sobre las piezas existentes. |

También en interfaz, relativos a `frontend/src/`:

- Nuevo `styles/itinerario-homun.css`.
- Modificados `features/transporte/pages/DetalleHomunPage.tsx`,
  `styles/detalle-homun.css`, `app/router.tsx` y `components/layout/Layout.tsx`.

Pruebas, relativas a `frontend/tests/`:

- Nuevas `mi-viaje/itinerarioHomun.test.ts`, `mi-viaje/almacenamientoHomun.test.ts`,
  `mi-viaje/accionesHomun.test.ts`, `mi-viaje/FlujoHomun.test.tsx`.
- Modificada `DetalleHomun.test.tsx`: sustituye el aviso pendiente por navegación
  desde las tres estancias, configuración inicial y retorno. Conserva los demás casos.
- Se conservan las suites existentes de Izamal, Valladolid y Tekit, incluidas las de
  dos jornadas y contratos de almacenamiento y acciones compartidas.

Documentación: nuevo `docs/ITINERARIOS_HOMUN.md` y modificado `docs/ARQUITECTURA.md`.
Estos cinco grupos son sugerencias; no se ejecutó ningún commit.

## Verificación pendiente del revisor

No se ejecutaron terminal, instalaciones, pruebas, lint ni build durante esta
implementación. La lectura del código no sustituye la ejecución ni la revisión visual.
Desde la raíz:

```powershell
git diff --check
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

Si hace falta iniciar el servidor para revisar:

```powershell
npm --prefix frontend run dev
```

Revisar las cuatro direcciones indicadas a **360, 393 y 480 px**: foco y teclado,
estancias, ventanas independientes, filtros, imágenes y alternativa, cronología,
tiempo libre, vuelta desde acceso, recarga, atrás/adelante, guardado, compartir,
cancelación, copia manual y archivo descargado. Repetir una revisión de los destinos
anteriores, especialmente Valladolid de dos jornadas. No se afirma compilación
ni éxito de las pruebas.
