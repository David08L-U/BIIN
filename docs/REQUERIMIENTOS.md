# Requerimientos de BIIN

Fuentes: FigJam → Zona 1 · Investigación (Requerimientos, Historias de usuario, Restricciones y trazabilidad) y Zona 2 · Diagramas (Casos de uso, versión vigente). Las fichas completas de cada caso de uso (actores, pre/postcondiciones, flujos alternos y excepciones) están en FigJam → «Fichas de casos de uso · CU-01 a CU-14».

## 1. Actores

| Actor | Descripción |
|---|---|
| **Viajero o visitante** | Consulta pública sin registro: rutas, sitios, eventos, comida, IA y offline |
| **Viajero registrado** | Además gestiona su cuenta, favoritos e itinerarios |
| **Conductor o checador** | Reporta el cupo disponible de las rutas que tiene autorizadas |
| **Administrador** | Gestiona rutas, paradas, tarifas, sitios, negocios, eventos, usuarios y roles |
| **Colaborador** | *Versión futura* — propone contenido para revisión (fuera del MVP) |

Todos heredan de **Usuario de BIIN**. Servicios externos: mapas (OSM), geolocalización del navegador, LLM e IndexedDB.

## 2. Requerimientos funcionales

| Código | Requerimiento |
|---|---|
| **RF01** | Registro, inicio y cierre de sesión con permisos según rol. La consulta pública de rutas y lugares está disponible **sin registro**. |
| **RF02** | Buscar rutas de combis intermunicipales seleccionando origen y destino. |
| **RF03** | Mostrar el recorrido en un mapa, puntos de abordaje, paradas, horarios, tarifa aproximada y opciones de regreso de cada ruta. |
| **RF04** | Conductores o checadores autorizados actualizan el cupo disponible mostrando la hora del reporte. Sin reporte vigente, indicar que la disponibilidad **no está confirmada**. |
| **RF05** | Consultar negocios gastronómicos y filtrarlos por localidad o tipo de comida, con ubicación, fotos, horarios y precios aproximados. |
| **RF06** | Consultar eventos por localidad, fecha o categoría, con horarios, ubicación, costo y estado (incluye cambios o cancelaciones). |
| **RF07** | Consultar lugares turísticos, culturales y sitios para fotos, con ubicación, descripción y condiciones de acceso. |
| **RF08** | Solicitudes en lenguaje cotidiano al asistente de IA con recomendaciones basadas en los datos de BIIN. Si no hay opciones suficientes, **debe decirlo**. |
| **RF09** | Crear, editar y eliminar itinerarios (fechas, horarios, lugares y actividades), mostrando tiempos estimados de traslado y advirtiendo conflictos de horario. |
| **RF10** | Guardar y eliminar rutas, negocios, eventos y lugares en favoritos. |
| **RF11** | Descargar información básica de rutas e itinerarios para consultarla sin conexión, mostrando la fecha de actualización. |
| **RF12** | Los administradores gestionan rutas, negocios, eventos, lugares y usuarios. Los colaboradores autorizados envían información para revisión antes de publicarse. |

## 3. Requerimientos no funcionales

| Código | Requerimiento | Cómo se comprueba |
|---|---|---|
| **RNF01** | Interfaz adaptable a computadora y celular, sin ocultar controles ni scroll horizontal en las pantallas principales | Revisar pantallas desde **360 px** y en escritorio |
| **RNF02** | Navegación con etiquetas claras y organización consistente | Al menos **4 de 5** participantes encuentran una ruta y cómo regresar sin ayuda |
| **RNF03** | Consultas habituales responden en **≤ 3 segundos** bajo las condiciones definidas para las pruebas | Medir búsquedas de rutas y contenido; IA y servicios externos se evalúan aparte |
| **RNF04** | **HTTPS**, contraseñas con **hash seguro** y permisos **validados en el backend** | Intentar acceder a funciones protegidas con distintos roles |
| **RNF05** | Ubicación solicitada con consentimiento; si se rechaza, el origen se elige manualmente | Probar con permiso aceptado y rechazado |
| **RNF06** | Navegación con teclado, etiquetas comprensibles y contraste mínimo **4.5:1** | Revisar formularios, botones, navegación y contraste |
| **RNF07** | Distinguir información **actualizada, guardada y no confirmada**; no presentar datos antiguos como actuales | Probar reportes de cupo vencidos y consultas offline |
| **RNF08** | Código organizado por módulos, con control de versiones y documentación para ejecutarlo | Otro integrante ejecuta el sistema siguiendo las instrucciones |

## 4. Historias de usuario

| Código | Como… | Quiero… | Para… |
|---|---|---|---|
| HU01 | usuario registrado | iniciar sesión en mi cuenta | conservar mis favoritos e itinerarios |
| HU02 | pasajero | buscar rutas indicando origen y destino | conocer las opciones de transporte de mi viaje |
| HU03 | pasajero | consultar abordaje, recorrido, horario, tarifa y regreso de una ruta | organizar mi traslado completo |
| HU04 | conductor o checador | actualizar el cupo de mi unidad | informar a los pasajeros la disponibilidad reportada |
| HU05 | visitante | buscar comida y negocios locales | elegir dónde comer durante mi visita |
| HU06 | visitante | consultar eventos por localidad y fecha | encontrar actividades que coincidan con mi viaje |
| HU07 | visitante | explorar lugares y paisajes para conocer o fotografiar | elegir sitios de acuerdo con mis intereses |
| HU08 | usuario | pedir recomendaciones al asistente con mis propias palabras | encontrar opciones sin recorrer todos los apartados |
| HU09 | viajero | organizar lugares y actividades en un itinerario | aprovechar mi tiempo y considerar traslados y regreso |
| HU10 | usuario registrado | guardar rutas y lugares como favoritos | encontrarlos fácilmente después |
| HU11 | viajero | descargar información de mi ruta e itinerario | consultarla con poca señal o sin internet |
| HU12 | administrador | revisar y gestionar la información enviada por colaboradores | mantener contenidos correctos y actualizados |

## 5. Trazabilidad RF → HU → prueba de aceptación

| RF | HU | Comprobación de aceptación |
|---|---|---|
| RF01 | HU01 | Registrar cuenta, iniciar y cerrar sesión; verificar permisos por rol |
| RF02 | HU02 | Buscar un origen/destino con rutas registradas y otro sin resultados |
| RF03 | HU03 | Abrir una ruta y comprobar puntos, horarios, tarifa y regreso |
| RF04 | HU04 | Publicar un reporte de cupo y comprobar su hora y vencimiento |
| RF05 | HU05 | Filtrar negocios por localidad y comida; consultar una ficha |
| RF06 | HU06 | Buscar eventos por fecha y comprobar cómo aparece uno cancelado |
| RF07 | HU07 | Abrir un lugar y consultar ubicación y condiciones de acceso |
| RF08 | HU08 | Pedir recomendaciones y comprobar que correspondan a registros existentes; probar una solicitud sin coincidencias |
| RF09 | HU09 | Crear y modificar un itinerario; comprobar advertencia por conflicto de horarios |
| RF10 | HU10 | Agregar y quitar favoritos verificando que los cambios se conserven |
| RF11 | HU11 | Descargar una ruta, desconectar internet y consultar los datos guardados |
| RF12 | HU12 | Enviar un contenido, revisarlo y publicarlo con los roles correspondientes |

## 6. Casos de uso (versión vigente, Unidad 2)

Prioridad **MoSCoW**: **Must** (obligatorio en el MVP) · **Should** (importante) · **Could** (deseable si hay tiempo) · **Won't** (fuera de esta versión). Fuente: nota de cada diagrama por caso de uso en FigJam.

| CU | Nombre | MoSCoW | Traza | Módulo del MVP | Actor | Funciones que lo componen |
|---|---|---|---|---|---|---|
| CU-01 | Gestionar cuenta y sesión | **Must** | RF01 / HU01 | T01 Transversal | Viajero registrado (y todo rol con cuenta) | Registrarse · iniciar sesión · cerrar sesión |
| CU-02 | Buscar rutas por origen y destino | **Must** | RF02 / HU02 | M7 Transporte y Tarifas | Viajero / visitante | Validar origen y destino · usar ubicación actual |
| CU-03 | Consultar detalle de una ruta | **Must** | RF03 / HU03 | M7 Transporte y Tarifas | Viajero / visitante | Paradas y puntos de abordaje · horarios y tarifa aproximada · opciones de regreso |
| CU-04 | Reportar cupo disponible | Could | RF04 / HU04 | M7 Operación de transporte | Conductor o checador | Seleccionar ruta y salida · registrar asientos disponibles · vigencia del reporte |
| CU-05 | Consultar negocios gastronómicos | **Must** | RF05 / HU05 | M5 Sabores Locales | Viajero / visitante | Horarios y precios aproximados |
| CU-06 | Consultar eventos | **Must** | RF06 / HU06 | M4 Cartelera de Eventos | Viajero / visitante | Estado y cambios del evento |
| CU-07 | Consultar lugares de interés | **Must** | RF07 / HU07 | M1 Sitios y Atractivos | Viajero / visitante | Ficha del sitio · filtrar por localidad |
| CU-08 | Solicitar recomendaciones al asistente de IA | Should | RF08 / HU08 | T06 Transversal | Viajero / visitante | Recomendaciones con datos de BIIN |
| CU-09 | Gestionar itinerarios | **Must** | RF09 / HU09 | M6 Mi Viaje | Viajero registrado | Crear itinerario · editar itinerario (*Should*) · advertir conflicto (*Could*) |
| CU-10 | Gestionar favoritos | **Must** | RF10 / HU10 | M6 Mi Viaje | Viajero registrado | Guardar favorito · quitar favorito |
| CU-11 | Descargar datos para consulta sin conexión | Could | RF11 / HU11 | T07 Transversal | Viajero / visitante | Copia local con fecha de actualización |
| CU-12 | Gestionar contenidos y usuarios | **Must** | RF12 / HU12 | T04 / T08 Transversal | Administrador | Rutas, paradas y tarifas · sitios y recorridos · negocios y eventos · usuarios y roles |
| CU-13 | Consultar recorridos sugeridos | **Must** | MVP M2-01 / M2-02 | M2 Recorridos Sugeridos | Viajero / visitante | Mapa con paradas en orden |
| CU-14 | Explorar turismo por interés | **Must** | MVP M3-01 / M3-02 | M3 Turismo por Interés | Viajero / visitante | Elegir categoría |
| *(T08)* | *Proponer contenido* | ***Won't*** | — | — | *Colaborador* | *Fuera del MVP (versión futura)* |

**Resumen:** 11 Must · 1 Should (CU-08) · 2 Could (CU-04, CU-11) · 1 Won't (colaboradores).

> CU-13 y CU-14 no tienen RF propio: vienen de los módulos del MVP (M2 y M3) agregados en la Unidad 2. Si el equipo los formaliza, agregar sus RF/HU aquí.

**Dos formas de agrupar módulos** (ambas aparecen en FigJam):

- **Módulos del MVP** (columna de la tabla): M1 Sitios y Atractivos · M2 Recorridos Sugeridos · M3 Turismo por Interés · M4 Cartelera de Eventos · M5 Sabores Locales · M6 Mi Viaje · M7 Transporte y Tarifas / Operación · T01–T08 funciones transversales.
- **Diagramas radiales por módulo** (casos de uso ampliados): Transporte (CU-02, 03, 13) · Exploración (CU-05, 06, 07, 14) · Mi Viaje (CU-08, 09, 10, 11) · Operador (CU-04) · Administrador (CU-12) · CU-01 transversal.

## 7. Alcance del MVP

**Entra:** consulta pública de rutas y contenidos, cuentas con roles, reporte de cupo, gastronomía/eventos/lugares, itinerarios, favoritos, asistente de IA, PWA offline y administración de contenidos.

**No entra (versión futura):** flujo de colaboradores y moderación (T08, paquete 12.1.7), mapas completos descargables para offline.

## 8. Restricciones

- La primera versión abarca **rutas y localidades seleccionadas**; la cobertura depende de la información que el equipo logre validar.
- El desarrollo está condicionado por el tiempo, presupuesto y recursos del proyecto integrador.
- La IA y la actualización de información **requieren internet**.
- La consulta offline se limita a contenidos descargados antes. Los mapas completos requerirían una solución específica de descarga.
- El cupo depende de reportes de conductores o checadores; **no garantiza** un asiento al llegar.
- Las recomendaciones de IA y los itinerarios usan información registrada y tiempos estimados; **no deben inventar** tarifas, horarios ni recorridos.
- Los servicios de mapas e IA están sujetos a sus condiciones, límites y posibles costos.

## 9. Supuestos

- Habrá colaboración de responsables del transporte para validar rutas, horarios, tarifas y puntos de abordaje.
- Los negocios y organizadores proporcionarán información y fotografías publicables.
- Los responsables comunicarán cambios importantes (tarifas, cancelaciones de eventos).
- Los usuarios tendrán un dispositivo con navegador compatible y conexión para descargar o actualizar información.
- Los recorridos se revisarán con operadores locales antes de publicarse.
- Los horarios disponibles permitirán construir itinerarios estimados; cuando falten datos, la plataforma lo indicará.
