# Itinerarios de Tekit — CU-09 / RF09, HU09

El detalle, el recorrido y la personalización usan la composición visual de
Izamal con el contenido textil y el circuito ilustrativo de Tekit. Ruta Textil
· Compras empieza con ambos campos vacíos.

El tiempo disponible se introduce en Horas y Minutos. El total válido va de
15 min a 12 h. La URL y los planes guardados siguen utilizando minutos totales.

Implementación frontend demostrativa de la actividad 13 del plan del proyecto.
Se conservan los flujos de Izamal y Valladolid y el detalle aprobado de Tekit.
No añade dependencias ni modifica backend, autenticación, permisos o modelo de BD.

## Pantallas y navegación

- `/rutas/tekit`: las tres opciones del detalle abren el planificador y conservan
  la modalidad; volver al detalle conserva configuración y selección. Puedes
  reabrir el modo con el botón de recomendado o de personalización.
- `/rutas/tekit/itinerario`: configuración y resultado recomendado o personalizado.
- `/rutas/tekit/personalizar`: patrón de categorías, selección, contadores y
  presupuesto de tiempo de la plantilla de Izamal, con los lugares de Tekit.
- `/mi-viaje`: protegido con el acceso existente; lista los planes de la cuenta para los cinco destinos.

Hay una sola navegación inferior, con Rutas activa. Los controles tienen etiquetas,
foco visible, uso de teclado y espacio final sobre la navegación.

## Configuración y borrador

La URL conserva `estancia`, `fecha`, `inicio`, `minutos`, `modo`, `lugares` en orden
de selección y `generado=1`. No incluye cuenta, correo ni credenciales. Las fechas
y horas se construyen en la zona local del navegador; no se interpreta YYYY-MM-DD
como UTC. Al compartir, el receptor usa su propia zona local.

Un acceso directo vacío inicia sin fecha, sin selección y sin resultado. Medio día
inicia con 240 minutos y día completo con 360; ambos son editables. Ruta Textil ·
Compras es una modalidad y deja los minutos vacíos para que el usuario los indique.
La hora inicial editable es una sugerencia de configuración, no una llegada de van.
Se admiten minutos enteros de 15 a 720, como en el cálculo de Izamal. Se permiten
ventanas que crucen medianoche; las horas que cambian de fecha muestran el día.
Este límite de tiempo es del planificador, no una afirmación sobre aperturas.

Los parámetros parciales dejan los campos faltantes pendientes. Fechas imposibles,
horas inválidas, modalidades desconocidas, modos, campos repetidos, duraciones y
selecciones manipuladas impiden generar. La lectura no elimina duplicados para
ocultar una selección inválida. Editar configuración o selección invalida el resultado.
Recarga y retorno del acceso recuperan el borrador desde la URL; guardar después
del acceso requiere una nueva pulsación. Restablecer limpia selección y generación.

Recomendado y personalizado se alternan conservando configuración y selección
actual. Personalizar un resultado hereda sus visitas. Una personalización nueva
comienza vacía. Cambiar filtros conserva las selecciones de otras categorías.
Los filtros del resultado solo cambian las tarjetas visibles: guardar, compartir,
descargar, cierre y circuito usan el plan completo y conservan los horarios.

## Datos y cálculo

Fuente: `../BIIN-prototipo-melanie/biin_mi_itinerario_en_tekit/code.html`, junto con
el detalle de Tekit, `biin-compatible.css` y las interacciones relevantes de
`biin-interaction.js`. Los nombres y textos son referencias demostrativas sin
fecha de validación. No se confirman precios, aperturas, menús ni visitas guiadas.
No se añaden negocios para llenar tiempo disponible.

| Referencia | Visita (min) | Desplazamiento previo (min) |
|---|---:|---:|
| Corredor Textil y Tiendas de Fabricantes | 65 | 2 |
| Taller Artesanal de Bordado y Deshilado | 45 | 3 |
| Cocina Económica Doña Lupita y Mercado | 50 | 4 |
| Parroquia de San Antonio de Padua | 30 | 2 |

Todos esos valores son **supuestos del prototipo**, no mediciones geográficas.
Cada plan añade 3 minutos de regreso final y 15 de margen: las cuatro visitas
suman 190 + 14 + 15 = **219 minutos (3 h 39 min)**. Medio día deja 21 minutos
libres y día completo, 141. El tiempo libre se muestra separado del recorrido,
con su intervalo, sin repetir visitas ni afirmar una duración fija de 3 h 30 min.
El margen de 15 minutos se reserva también en el contador previo sin selección;
no constituye un resultado generado ni una visita.

El recomendado recorre los candidatos en el orden del prototipo y añade solo
visitas completas que caben con todos los conceptos. Si una no cabe, considera
las siguientes; si ninguna cabe, lo explica. Ruta Textil recomienda únicamente
corredor y taller: juntos suman 133 minutos. Comida y patrimonio requieren selección
explícita en personalizado para esa modalidad. No se afirma optimización geográfica.

Personalizado conserva el orden elegido y explica el exceso completo sin quitar
lugares ni truncar visitas. Los bloques usan minutos enteros, contiguos y sin
solapamientos. La hora objetivo de regreso deriva de la ventana del usuario;
no se afirma una salida a las 14:00 ni una frecuencia real del transporte.

`recorridoSecuencial.ts` extrae solamente resumen, recomendación secuencial y
bloques de Izamal. Izamal conserva nombres de funciones, tipos, títulos de bloques,
duraciones y reglas existentes. Tekit parametriza el mismo cálculo. Valladolid
conserva su cálculo independiente de una o dos jornadas.

## Persistencia compatible

Se mantiene `biin:itinerarios:v1:<idUsuario>` y `{ version: 1, itinerarios: [...] }`.
No se cambian claves ni se borra o migra el contenido existente. Los registros
sin destino siguen siendo Izamal con sus identificadores originales. Valladolid
conserva ventanas y selecciones por jornada. Tekit usa destino explícito en registro
y borrador. La lectura valida tipos y recalcula el plan antes de aceptarlo.

La identidad considera destino, modalidad, modo, fecha, inicio, minutos y selección
efectiva ordenada. Pulsar guardar varias veces devuelve el registro existente.
Cada cuenta tiene su clave y listado. Un JSON dañado o parcialmente incompatible
produce aviso y bloquea escrituras sobre el original; se siguen mostrando los
registros válidos que se puedan leer. Los errores de acceso o espacio no devuelven
éxito ni sustituyen datos anteriores. La UI anuncia guardado solo tras éxito real.

Es almacenamiento local por cuenta, sin sincronización, cifrado ni persistencia
de servidor. Abrir un plan recalcula con los datos demostrativos actuales, como
en los otros destinos. `/mi-viaje` mantiene la protección existente.

## Compartir y descargar

`accionesPlan.ts` comparte la implementación de Web Share, Clipboard y descarga
de texto con Valladolid, manteniendo sus exports anteriores. `AbortError`, incluso
como objeto de otro contexto, representa cancelación: no copia ni anuncia éxito.
Si Web Share no está disponible o falla por otro motivo, intenta Clipboard; si
tampoco funciona, muestra un enlace seleccionable para copia manual.

Descargar plan solicita un `.txt` UTF-8 con fecha de generación, referencias,
modalidad, fecha local, bloques, suma, tiempo libre y objetivo de regreso. Revoca
la URL temporal. La UI informa de la solicitud o del error; no afirma haber
guardado el archivo en disco. No descarga mapas offline, hace reservas ni usa GPS.
La antigua acción «Abrir vista en vivo» se sustituye por abrir el detalle de ruta.

## Archivos y grupos sugeridos para commits

Rutas del módulo relativas a `frontend/src/features/mi-viaje/`:

| Grupo | Archivos | Propósito |
|---|---|---|
| Cálculo y datos | Nuevos `data/lugaresTekit.ts`, `plan/itinerarioTekit.ts`, `plan/borradorTekit.ts`, `plan/recorridoSecuencial.ts`; modificado `plan/itinerarioIzamal.ts` | Catálogo de cuatro referencias, supuestos, validación, cálculo parametrizado y URL. |
| Almacenamiento | Modificados `storage/itinerariosLocales.ts`, `pages/MiViajePage.tsx` | Destino Tekit, identidad y listado de tres destinos sin alterar el formato v1. |
| Interfaz y acciones | Nuevos `components/ConfiguracionTekit.tsx`, `components/ModosTekit.tsx`, `hooks/useBorradorTekit.ts`, `pages/ItinerarioTekitPage.tsx`, `pages/PersonalizarTekitPage.tsx`, `plan/accionesPlan.ts`, `plan/accionesTekit.ts`; modificado `plan/accionesValladolid.ts` | Configuración, selección, resultado, acciones compartidas y recuperación del borrador. |

El grupo de interfaz también incluye, relativos a `frontend/src/`:

- Nuevos `styles/itinerario-tekit.css`.
- Modificados `app/router.tsx`, `components/layout/Layout.tsx`,
  `features/transporte/pages/DetalleTekitPage.tsx`, `styles/detalle-tekit.css`.

Grupo de pruebas, relativo a `frontend/tests/`:

- Nuevos `mi-viaje/itinerarioTekit.test.ts`, `mi-viaje/almacenamientoTekit.test.ts`,
  `mi-viaje/accionesTekit.test.ts`, `mi-viaje/FlujoTekit.test.tsx`.
- Modificado `DetalleTekit.test.tsx`: sustituye el aviso de planificador pendiente
  por navegación desde las tres opciones y retorno, conservando las otras pruebas.
- Se conservan las suites de Izamal, Valladolid, compatibilidad y acciones, que
  también cubren los contratos de las extracciones compartidas.

Grupo de documentación: este archivo nuevo y el apartado provisional actualizado
en `docs/ARQUITECTURA.md`. No se ejecuta ningún commit automáticamente.

## Verificación pendiente del revisor

No se ejecutaron terminal, instalaciones, pruebas, lint ni build al implementar.
Desde la raíz, ejecutar:

```powershell
git diff --check
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

Para revisar la interfaz si el servidor no está iniciado:

```powershell
npm --prefix frontend run dev
```

Revisar `/rutas/tekit`, `/rutas/tekit/itinerario`, `/rutas/tekit/personalizar`
y `/mi-viaje` a 360, 393 y 480 px. Confirmar teclado, foco, radio del detalle,
las tres modalidades, tiempos, vuelta desde acceso, recarga, navegación atrás,
cancelación de compartir, copia manual y archivo descargado. Repetir una revisión
de Izamal y Valladolid, incluyendo Valladolid de dos jornadas. La revisión visual
y la ejecución de las suites quedan pendientes; no se afirma compilación ni éxito.
