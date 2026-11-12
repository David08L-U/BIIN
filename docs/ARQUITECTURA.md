# Arquitectura de BIIN

Fuentes: Notion §2 (Stack y arquitectura) y FigJam → Zona 2 · Diagramas (Modelo de base de datos y Diagramas de clases, Versión 2).

## 1. Stack tecnológico

| Área | Tecnología | Uso |
|---|---|---|
| Backend | **C# + ASP.NET Core Web API** | Servicios REST, autenticación **JWT**, permisos por rol, rutas, contenidos, itinerarios y orquestación del asistente de IA |
| Base de datos | **PostgreSQL** | Modelo relacional en **3FN, 27 tablas**. Acceso con **Entity Framework Core + Npgsql** |
| Frontend | **React + TypeScript**, HTML, CSS | Interfaz responsive **desde 360 px**, para celular y computadora |
| PWA | Web Manifest, **Service Worker**, **IndexedDB** | Instalación desde el navegador y consulta sin conexión de rutas e itinerarios |
| Mapas | **Leaflet + OpenStreetMap** | Recorridos, paradas, puntos de abordaje y ubicaciones de sitios y negocios |
| IA | API de LLM (**proveedor por seleccionar**) | Interpretar lenguaje natural y recomendar **solo con datos de PostgreSQL** |
| Diseño / colaboración | Figma, VS Code, Visual Studio 2022, pgAdmin, Git + GitHub, Notion | Prototipos, desarrollo, BD, control de versiones y planeación |

## 2. Arquitectura del sistema

Cliente-servidor en **tres capas**, comunicadas por **API REST con JSON sobre HTTPS**.

```
┌──────────────────────────── Presentación ────────────────────────────┐
│  PWA React + TS · Leaflet · Service Worker · IndexedDB (copia local)  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTPS · JSON · JWT
┌───────────────────────── Lógica de negocio ──────────────────────────┐
│  ASP.NET Core Web API                                                 │
│  Controllers → Services → Repositories                                │
│  Búsqueda de rutas · JWT y roles · validaciones · orquestación de IA  │
└───────────────┬───────────────────────────────────┬──────────────────┘
                │ EF Core + Npgsql                  │ HTTPS
┌───────────────▼────────────┐        ┌─────────────▼─────────────────┐
│  Datos: PostgreSQL (3FN)   │        │  Externos: teselas OSM · LLM  │
└────────────────────────────┘        └───────────────────────────────┘
```

| Capa | Responsabilidad |
|---|---|
| Presentación | Pantallas, navegación, mapas, consulta sin conexión |
| Lógica de negocio | Reglas de búsqueda de rutas, autenticación, permisos por rol, validaciones, IA |
| Datos | Persistencia y restricciones de integridad |
| Servicios externos | Mapas base y generación de recomendaciones |

### Reglas de arquitectura que no se negocian

1. **Los permisos se validan en el backend**, nunca solo en el frontend (RNF04).
2. **La IA no inventa datos.** El backend consulta PostgreSQL, arma el contexto con contenidos **publicados** y se lo pasa al LLM. Si no hay datos suficientes, responde que no tiene esa información (RF08). No se guardan conversaciones ni se duplican contenidos.
3. **PostgreSQL es la fuente de verdad.** IndexedDB guarda una copia local con sus identificadores y **fecha de actualización**, y la interfaz debe distinguir datos actualizados, guardados (offline) y no confirmados (RNF07).
4. La IA y la actualización de información requieren internet. Offline solo se consulta lo descargado antes.
5. La ubicación del usuario se pide con consentimiento; si la rechaza, elige su origen manualmente (RNF05).

## 3. Estructura de carpetas (propuesta — se define en H7)

> Esto es una propuesta inicial. Se confirma al cerrar la actividad 7 «Arquitectura y repositorio». Si cambia, actualizar aquí.

```
BIIN/
├── README.md
├── docs/
├── backend/
│   ├── Biin.Api/              # Controllers, Program.cs, configuración, JWT
│   ├── Biin.Application/      # Services, DTOs, validaciones, reglas de negocio
│   ├── Biin.Domain/           # Entidades y enums (TipoRecurso, EstadoPublicacion, EstadoEvento…)
│   ├── Biin.Infrastructure/   # DbContext (EF Core + Npgsql), Repositories, migraciones, cliente LLM
│   └── Biin.Tests/            # xUnit
├── frontend/
│   ├── public/                # manifest, íconos
│   └── src/
│       ├── modules/           # transporte, exploracion, mi-viaje, operador, admin, auth, asistente
│       ├── components/        # componentes compartidos
│       ├── services/          # cliente de la API
│       ├── offline/           # Service Worker e IndexedDB
│       └── maps/              # Leaflet
└── database/
    ├── schema.sql             # o migraciones de EF Core
    └── seed/                  # datos validados de prueba
```

Los módulos del frontend siguen los 5 módulos funcionales de los casos de uso: **Transporte, Exploración, Mi Viaje, Operador y Administrador**.

## 4. Modelo de base de datos (27 tablas, 3FN)

Convención de la documentación: tablas y columnas en **snake_case, en español y en plural** (`usuarios`, `id_usuario`). PK = clave primaria, FK = clave foránea.

> Los diagramas de clases de la Unidad 2 usan `UUID` como tipo de identificador. Confirmar el tipo de las PK (UUID vs. entero) al aprobar el modelo (H6).

### 4.1 Usuarios y ubicación geográfica (6)

| Tabla | Campos principales | Propósito |
|---|---|---|
| `usuarios` | id_usuario PK, nombre, correo, hash_contrasena, activo, fecha_registro | Cuentas de la plataforma |
| `roles` | id_rol PK, nombre | viajero, colaborador, operador de transporte, administrador |
| `usuario_rol` | id_usuario PK/FK, id_rol PK/FK | Una persona puede tener varios roles |
| `municipios` | id_municipio PK, codigo, nombre | Municipios incluidos en BIIN |
| `localidades` | id_localidad PK, id_municipio FK, nombre | Pueblos y localidades de cada municipio |
| `ubicaciones` | id_ubicacion PK, id_localidad FK, direccion_referencia, latitud, longitud | Puntos físicos: paradas, negocios, eventos y lugares |

Una ubicación guarda solo su localidad; el municipio se obtiene por la relación (no se repite).

### 4.2 Contenidos de la plataforma (9)

`recursos` es la tabla general de todo lo que se puede consultar, guardar como favorito o agregar a un itinerario. **Cada recurso tiene exactamente un detalle según su tipo** (ruta, negocio, evento o lugar).

| Tabla | Campos principales | Propósito |
|---|---|---|
| `recursos` | id_recurso PK, tipo, titulo, descripcion, estado_publicacion, id_creador FK, id_revisor FK (opcional), fecha_revision, actualizado_en | Datos generales y estado de revisión |
| `categorias` | id_categoria PK, nombre | comida regional, bazar, baile, cenote, paisaje… |
| `recurso_categoria` | id_recurso PK/FK, id_categoria PK/FK | Un contenido en varias categorías |
| `fotografias` | id_fotografia PK, id_recurso FK, url_archivo, texto_alternativo, orden | Fotos de un recurso |
| `colaborador_recurso` | id_usuario PK/FK, id_recurso PK/FK | Personas autorizadas para proponer cambios a un contenido |
| `negocios` | id_recurso PK/FK, id_ubicacion FK, telefono, precio_minimo_aprox, precio_maximo_aprox | Establecimientos gastronómicos |
| `eventos` | id_recurso PK/FK, id_ubicacion FK, inicio, fin, costo_entrada, estado_evento, contacto_organizador | Actividades con fecha y posibles cancelaciones |
| `lugares` | id_recurso PK/FK, id_ubicacion FK, costo_acceso, condiciones_acceso | Sitios turísticos, culturales y para fotos |
| `horarios_visita` | id_horario PK, id_recurso FK, dia_semana, hora_apertura, hora_cierre | Horarios semanales de negocios y lugares |

- `estado_publicacion`: **pendiente · publicado · archivado**.
- `estado_evento`: **programado · cancelado · finalizado**. Son datos distintos al estado de publicación.

### 4.3 Transporte intermunicipal (9)

- **Ida y regreso son rutas independientes**, porque pueden tener paradas y horarios distintos.
- Para buscar origen → destino se consultan las **localidades de las paradas respetando su orden**.
- Las tarifas referencian dos paradas de la misma ruta con **FK compuestas** `(id_ruta, orden_origen)` y `(id_ruta, orden_destino)`.
- La `capacidad_habilitada` de una salida es dato histórico: no cambia si después cambia la capacidad de la unidad.

| Tabla | Campos principales | Propósito |
|---|---|---|
| `rutas` | id_recurso PK/FK, codigo, activa | Cada recorrido y sentido de circulación |
| `ruta_parada` | id_ruta PK/FK, orden PK, id_ubicacion FK, permite_abordar, permite_descender | Paradas en su orden real |
| `puntos_recorrido` | id_ruta PK/FK, orden PK, latitud, longitud | Puntos para dibujar el recorrido en el mapa |
| `horarios_ruta` | id_horario PK, id_ruta FK, dia_semana, hora_salida, vigente_desde, vigente_hasta (opcional) | Salidas programadas y su vigencia |
| `tarifas` | id_tarifa PK, id_ruta FK, orden_origen, orden_destino, monto, vigente_desde, vigente_hasta (opcional) | Tarifas aproximadas por tramo |
| `unidades` | id_unidad PK, identificador, capacidad, activa | Combis de los operadores |
| `salidas` | id_salida PK, id_ruta FK, id_unidad FK, salida_programada, capacidad_habilitada, estado | Un viaje concreto de una unidad |
| `operador_ruta` | id_usuario PK/FK, id_ruta PK/FK | Conductores o checadores autorizados en una ruta |
| `reportes_cupo` | id_reporte PK, id_salida FK, id_autor FK, asientos_disponibles, registrado_en, valido_hasta | Reportes de disponibilidad y su vigencia |

### 4.4 Planificación de viaje (3)

| Tabla | Campos principales | Propósito |
|---|---|---|
| `itinerarios` | id_itinerario PK, id_usuario FK, nombre, inicio, fin, presupuesto_estimado, fecha_creacion | Planes de viaje de cada usuario |
| `actividades_itinerario` | id_actividad PK, id_itinerario FK, id_recurso FK, orden, inicio_previsto, fin_previsto, notas | Visitas, eventos, comidas y trayectos |
| `favoritos` | id_usuario PK/FK, id_recurso PK/FK, fecha_guardado | Contenidos guardados por el usuario |

### 4.5 Relaciones principales

| Relación | Cardinalidad |
|---|---|
| Municipio → localidades | 1 : N |
| Localidad → ubicaciones | 1 : N |
| Usuarios ↔ roles | N : M (`usuario_rol`) |
| Recursos ↔ categorías | N : M (`recurso_categoria`) |
| Recurso → detalle de su tipo | 1 : 1 |
| Recurso → fotografías | 1 : N |
| Ruta → paradas, puntos, horarios y tarifas | 1 : N |
| Usuarios ↔ rutas operadas | N : M (`operador_ruta`) |
| Ruta → salidas · Unidad → salidas | 1 : N |
| Salida → reportes de cupo | 1 : N |
| Usuario → itinerarios · Itinerario → actividades | 1 : N |
| Usuarios ↔ recursos favoritos | N : M (`favoritos`) |

### 4.6 Restricciones e integridad

| Restricción | Aplicación |
|---|---|
| PRIMARY KEY | Identificador único; tablas intermedias con claves compuestas |
| FOREIGN KEY | No relacionar usuarios, rutas, recursos o ubicaciones inexistentes |
| NOT NULL | Datos indispensables: correo, título, claves de relación, fechas de reportes |
| UNIQUE | Correos sin duplicar (**sin distinguir mayúsculas**), códigos de ruta, relaciones duplicadas |
| CHECK | Importes ≥ 0, capacidades > 0, coordenadas válidas, coherencia de fechas |
| Eliminación | **No se borra** información referenciada que deba conservarse; se retira con estados de actividad o publicación |

Reglas adicionales:

- Latitud entre −90 y 90; longitud entre −180 y 180.
- El orden de paradas, puntos y actividades es positivo.
- Días de la semana con valores **0 a 6**.
- La fecha final de un evento, itinerario o vigencia no puede ser anterior a su inicio.
- En una tarifa, la parada destino va **después** de la de origen.
- **No puede haber vigencias de tarifa superpuestas** para el mismo tramo → *exclusion constraint* de PostgreSQL.
- Un reporte de cupo **no puede superar** la `capacidad_habilitada` de su salida → trigger + validación en backend.
- El autor de un reporte debe estar **autorizado en esa ruta** (`operador_ruta`) → trigger + validación en backend.
- Los horarios de visita solo se asocian a negocios o lugares.
- El detalle de cada recurso debe coincidir con su `tipo`.

### 4.7 Pendientes del modelo

- **Bitácora de cambios administrativos** (paquete 17.1.5 en Notion) y el registro de quién y cuándo reportó cupo (11.1.6) — revisar si requiere tabla nueva.
- **RecorridoSugerido / EtapaRecorrido** aparecen en el diagrama de clases como *propuesta M2* para CU-13 «Recorridos sugeridos»; no están en las 27 tablas.
- Tipo de las PK (UUID o entero).

## 5. Diagramas de clases (Unidad 2)

Tres áreas del dominio (ver FigJam → Zona 2 → Versión 2 → Diagramas de clases):

1. **Identidad, geografía y catálogo:** Usuario, Rol, `Recurso` (*abstracta*) con herencia a **Lugar, Evento y Negocio**; Categoría, Fotografía, Ubicación, Localidad, Municipio.
2. **Transporte intermunicipal:** Ruta (`buscarPorOrigenDestino()`), RutaParada (mínimo 2), PuntoRecorrido, HorarioRuta, Tarifa (`esVigente()`), Unidad, Salida (`validarCapacidad()`), ReporteCupo (`estaVigente()`), UsuarioOperador (`reportarCupo()`).
3. **Mi Viaje y ampliaciones:** Itinerario (`agregarActividad()`, `calcularTraslados()`), ActividadItinerario (`comprobarConflicto()`), Favorito, **ServicioIA** (*servicio no persistente*, `recomendarConDatos()`), y RecorridoSugerido / EtapaRecorrido (*propuesta M2*).

## 6. Pruebas

| Nivel | Herramienta | Qué se verifica |
|---|---|---|
| Unitarias backend | **xUnit** | Servicios y reglas: búsqueda por orden de paradas, vigencia del cupo |
| Unitarias frontend | **Vitest + React Testing Library** | Componentes y validación de formularios |
| API / integración | **Postman** | Endpoints, códigos de respuesta, JWT y permisos por rol |
| PWA, rendimiento, accesibilidad | **Lighthouse** | Instalación, offline, tiempos de carga, contraste (RNF01, 03, 06, 07) |
| Funcionales | Plan basado en trazabilidad RF → HU → CU | Que cada RF se cumpla |
| Usabilidad | Pruebas con usuarios | Al menos 4 de 5 completan las tareas principales (RNF02) |
