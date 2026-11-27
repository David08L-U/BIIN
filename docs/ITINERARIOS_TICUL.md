# Itinerarios estimados de Ticul · CU-09 / RF09

> Documento histórico del prototipo. La composición y persistencia vigentes se describen en [Entrega del frontend dinámico](ENTREGA_FRONTEND_DINAMICO.md).

El detalle, el recorrido y la personalización usan la composición visual de
Izamal con las referencias artesanales, fotografías y mapa de Ticul. Día
completo (Ruta Puuc) y Tour de Compras empiezan con ambos campos vacíos.

El tiempo disponible se introduce en Horas y Minutos. El total válido va de
15 min a 12 h. La URL y los planes guardados siguen utilizando minutos totales.

## Alcance y referencias

Implementación frontend del recomendado y la selección personalizada de Ticul.
Se consultaron los archivos locales de ../BIIN-prototipo-melanie:

- biin_mi_itinerario_en_ticul/code.html.
- biin_detalle_de_ruta_ticul/code.html.
- biin-compatible.css y las interacciones pertinentes de biin-interaction.js.

## Modalidades y configuración

| Modalidad | Minutos iniciales | Alcance del recomendado |
|---|---:|---|
| Medio día (3–4 horas) | 240, editables | Referencias de Ticul que caben completas |
| Día completo (Ruta Puuc) | Vacío; exige introducir minutos | Solo las cuatro referencias de Ticul de esta etapa |
| Tour de Compras | Vacío; exige introducir minutos | Solo alfarería y calzado; otras categorías requieren elección personal |

Ruta Puuc conserva el nombre del prototipo; no incluye excursiones a otras
localidades. Los minutos deben ser enteros entre 15 y 720, como en la validación
compartida existente. Fecha y hora se construyen con el calendario local del
navegador; una fecha inválida o una hora local inexistente impide generar.
No se interpreta YYYY-MM-DD como UTC. El inicio y el regreso son objetivos del
usuario y no horarios confirmados del transporte.

Los parámetros estancia, fecha, inicio, minutos, modo, lugares y generado
constituyen el borrador. Las configuraciones parciales no reciben silenciosamente
valores completos. Se rechazan campos de configuración repetidos, modo inválido,
marcadores de generación inválidos, destino ajeno y selecciones desconocidas o
repetidas. Antes de generar se valida toda la configuración y la selección.

La URL mantiene configuración, orden de selección y resultado al recargar,
volver y abrir el acceso. Alternar modo conserva configuración y selección;
la selección personal inicial es vacía. Cambiar configuración, modalidad o lugares
invalida el resultado. Cambiar modalidad conserva fecha, hora y selección, pero
restablece el presupuesto a 240 o vacío según su definición. Restablecer lugares
limpia selección y resultado, conservando configuración.

## Datos y cálculo

| Referencia demostrativa | Visita | Traslado entrante | Procedencia |
|---|---:|---|---|
| Barrio de San Enrique y Talleres Alfareros | 60 min | 3 min en mototaxi | Prototipo |
| Corredor del Calzado Artesanal | 60 min | 5 min a pie | Prototipo |
| Poc Chuc Ticuleño y Panuchos de Pavo · Mercado Municipal | 60 min | **4 min a pie** | **Supuesto demostrativo**, duración y medio no especificados claramente para esta conexión |
| Ex Convento e Iglesia de San Antonio de Padua | 30 min | 2 min a pie | Prototipo |
| Regreso final al punto de referencia | — | 3 min a pie | Prototipo |
| Margen final | 15 min | — | Regla de planificación |

Los valores son estimaciones demostrativas, no mediciones geográficas. El traslado
entrante se asocia a cada referencia, también cuando la selección omite o reordena
lugares; no se recalcula una red de distancias reales. El tipo de traslado se
conserva en datos, tarjetas y texto descargado. Mototaxi no equivale a servicio
contratado o disponible.

Se reutiliza recorridoSecuencial.ts para resumen, selección recomendada y bloques;
no se duplicó ni modificó el motor compartido. La validación de fecha, hora y
presupuesto reutiliza la existente de Izamal. Las piezas de dos jornadas de
Valladolid y Homún permanecen intactas.

Las cuatro visitas requieren **210 + (3 + 5 + 4 + 2 + 3) + 15 = 242 minutos**.
No caben en 240: el personalizado conserva las cuatro y explica un exceso de
2 minutos. El recomendado recorre los candidatos en orden, aceptando solo visitas
completas que caben con regreso y margen. En medio día elige alfarería, calzado y
comida: 180 + 15 + 15 = **210 minutos**, con **30 minutos libres**. No promete una
optimización geográfica ni el máximo número de visitas. Con 300 minutos, Compras
recomienda las dos referencias artesanales: 120 + 11 + 15 = **146 minutos**, con
154 minutos libres. No se añaden comida ni visitas repetidas para llenar huecos.

Cada bloque comienza donde termina el anterior; visitas, traslados, regreso y
margen usan minutos enteros. El tiempo libre se muestra después del plan hasta
la hora objetivo del usuario. El filtro del resultado solo cambia las tarjetas
visibles: no altera los horarios ni el plan completo usado al guardar o descargar.

## Guardado, acceso y acciones

El almacenamiento conserva versión y claves biin:itinerarios:v1:<idUsuario>.
Se añade destino ticul sin migrar, borrar ni reescribir registros anteriores:
Izamal sin campo destino, Valladolid y Homún de una o dos jornadas, y Tekit con
modalidad textil. La lectura valida los registros. Ante JSON dañado o registros
incompatibles recupera los válidos y bloquea escrituras para evitar pérdidas.
También maneja lectura bloqueada y falta de espacio. Solo comunica éxito después
de que guardarItinerarioLocal devuelve el registro guardado.

La identidad incluye destino, modalidad, modo, fecha/hora, presupuesto numérico y
selección efectiva ordenada. Cada cuenta tiene su propia clave. Mi viaje lista y
abre los cinco destinos con enlaces propios. Su ruta sigue protegida; no se
modificaron autenticación, permisos, backend ni dependencias.

Un invitado prepara la vista previa sin guardar. El botón Guardar usa el acceso
existente con el borrador completo en state.desde; al volver conserva el resultado
para guardarlo. Las acciones reutilizan accionesPlan.ts: Web Share, copia real al
portapapeles o enlace seleccionable para copia manual si las API faltan o fallan.
AbortError cancela sin copiar ni anunciar éxito. La URL compartida reproduce
configuración y selección y no contiene datos de cuenta.

Descargar plan crea un archivo UTF-8 .txt con modalidad, fecha, horarios, todas las
actividades, tipos de traslado, supuesto de comida, sumas, tiempo libre y regreso
objetivo. Es una descarga de texto, sin mapas offline ni reservas. La acción del
mapa abre el detalle de la ruta. Las cinco imágenes originales tienen alternativa
accesible si fallan.

## Límites reales

Datos e imágenes son demostrativos y carecen de fecha de validación. No se
confirman precios, aperturas, gratuidad, frecuencia de vans, disponibilidad del
mototaxi, llegada o salida predeterminada, GPS ni distancia geográfica. Se invita
a consultar empaque y condiciones de transporte sin garantizar embalaje ni
integridad de las piezas. El mapa es ilustrativo. Guardado local sin sincronización
ni servicio de itinerarios en el servidor. Las imágenes remotas pueden no cargar.
La implementación responsive y sus estados requieren revisión visual y ejecución
de comprobaciones por el revisor.

## Direcciones para revisar

- /rutas/ticul: detalle y tres modalidades.
- /rutas/ticul/itinerario: configuración y recomendado.
- /rutas/ticul/personalizar: selección inicial vacía.
- /mi-viaje: cinco destinos; requiere acceso.

Ejemplos reproducibles (sin datos de cuenta):

- /rutas/ticul/itinerario?estancia=medio-dia&fecha=2026-11-30&inicio=09%3A00&minutos=240&modo=recomendado&generado=1
- /rutas/ticul/itinerario?estancia=tour-compras&fecha=2026-11-30&inicio=09%3A00&minutos=300&modo=recomendado&generado=1
- /rutas/ticul/personalizar?estancia=medio-dia&fecha=2026-11-30&inicio=09%3A00&minutos=240&modo=personalizado&lugares=talleres-alfareros,corredor-calzado,comida-mercado,iglesia-san-antonio

## Archivos y grupos sugeridos para commits

Rutas de cálculo e interfaz relativas a frontend/src/features/mi-viaje:

| Grupo | Archivos | Propósito |
|---|---|---|
| Cálculo y datos | Nuevos data/lugaresTicul.ts, plan/itinerarioTicul.ts, plan/borradorTicul.ts | Cuatro referencias, tipos de traslado, sumas reales, modalidades y borrador reproducible sobre el motor compartido |
| Almacenamiento | Modificados storage/itinerariosLocales.ts y pages/MiViajePage.tsx | Destino Ticul y cinco destinos, preservando v1 y separación por cuenta |
| Interfaz | Nuevos components/ConfiguracionTicul.tsx, components/ModosTicul.tsx, hooks/useBorradorTicul.ts, pages/ItinerarioTiculPage.tsx, pages/PersonalizarTiculPage.tsx, plan/accionesTicul.ts | Configuración, selección, resultado y acciones reales |

También en interfaz, relativos a frontend/src:

- Nuevo styles/itinerario-ticul.css.
- Modificados features/transporte/pages/DetalleTiculPage.tsx,
  styles/detalle-ticul.css, app/router.tsx y components/layout/Layout.tsx.

Grupo de pruebas, relativas a frontend/tests:

- Nuevas mi-viaje/itinerarioTicul.test.ts, mi-viaje/almacenamientoTicul.test.ts,
  mi-viaje/accionesTicul.test.ts, mi-viaje/FlujoTicul.test.tsx.
- Modificada DetalleTicul.test.tsx: reemplaza el aviso pendiente por navegación desde
  las tres opciones, valores iniciales, personalización y retorno; conserva el resto.
- Cubren validación y parámetros, selección entre categorías, contadores, limpieza,
  tiempos enteros, exceso, tiempo libre, invalidación, recarga e historial, guardado
  y aislamiento, compatibilidad antigua, acceso, cinco destinos, fallos e imágenes,
  compartir/cancelar/copia manual y descarga de un archivo real.
- Se conservan las suites anteriores, incluidas las de Homún y Valladolid de dos días.

Grupo de documentación: nuevo docs/ITINERARIOS_TICUL.md y modificado
docs/ARQUITECTURA.md. Son cinco grupos sugeridos; no se hizo ningún commit.

## Verificación pendiente del revisor

No se ejecutaron terminal, instalaciones, pruebas, lint ni build. Desde la raíz:

```powershell
git diff --check
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

Para iniciar el servidor si hace falta:

```powershell
npm --prefix frontend run dev
```

Revisar a **360, 393 y 480 px**: ausencia de desbordamiento horizontal, cabecera,
cronología y fotografías, teclado, etiquetas y foco, acciones finales sobre la
navegación inferior, modalidades, validación, filtros y selección, vuelta del acceso,
recarga e historial, guardado, compartir/cancelar/copia y contenido del archivo.
Revisar también los cuatro destinos anteriores, en especial las dos jornadas de
Valladolid y Homún. No se afirma compilación ni éxito de pruebas.
