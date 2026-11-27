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

## 3. Estructura de carpetas

Cada carpeta tiene un `.gitkeep` con una línea que explica qué va ahí. Se puede borrar el `.gitkeep` en cuanto la carpeta tenga archivos.

```
BIIN/
├── README.md
├── docs/                          Documentación del proyecto
├── .github/workflows/             Compilar y ejecutar pruebas en cada push
├── postman/                       Colecciones y entornos de Postman
├── database/
│   ├── schema/                    Tablas, llaves e índices
│   ├── triggers/                  Reglas entre tablas (cupo, operador autorizado)
│   └── seed/                      Datos validados y ficticios de prueba
├── backend/
│   ├── src/
│   │   ├── Biin.Api/              Capa HTTP
│   │   │   ├── Controllers/
│   │   │   ├── Middleware/
│   │   │   ├── Extensions/
│   │   │   └── Configuration/
│   │   ├── Biin.Application/      Reglas de negocio
│   │   │   ├── Services/
│   │   │   ├── DTOs/              Comun/ (paginación), Catalogos/, Contenidos/, Itinerarios/, Admin/…
│   │   │   ├── Interfaces/        IAppDbContext, IReloj, IBitacoraAdmin…
│   │   │   ├── Consultas/         FuncionesBd: f_normalizar() usable en LINQ
│   │   │   ├── Validators/
│   │   │   └── Mappings/
│   │   ├── Biin.Domain/           Modelo sin dependencias externas
│   │   │   ├── Entities/
│   │   │   ├── Vistas/            Filas de las vistas v_* (solo lectura)
│   │   │   ├── Enums/
│   │   │   └── Exceptions/
│   │   └── Biin.Infrastructure/   Datos y servicios externos
│   │       ├── Persistence/
│   │       │   ├── Configurations/
│   │       │   └── Migrations/
│   │       ├── Repositories/
│   │       ├── ExternalServices/
│   │       ├── Tiempo/            RelojSistema (IReloj)
│   │       └── Security/
│   └── tests/
│       ├── Biin.UnitTests/
│       └── Biin.IntegrationTests/
└── frontend/
    ├── public/icons/
    ├── tests/
    └── src/
        ├── app/                   Arranque, enrutador y proveedores
        ├── assets/
        ├── components/
        │   ├── ui/
        │   └── layout/
        ├── features/              Un módulo por dominio
        │   ├── auth/
        │   ├── transporte/
        │   ├── cupo/
        │   ├── exploracion/
        │   ├── mi-viaje/
        │   ├── asistente/
        │   └── admin/
        ├── hooks/
        ├── services/
        ├── offline/
        ├── maps/
        ├── types/
        ├── utils/
        └── styles/
```

### Dependencias entre capas del backend

`Api → Application → Domain` y `Infrastructure → Application → Domain`. **Domain no depende de nadie.** Application define interfaces (`Interfaces/`) que Infrastructure implementa; así el código de negocio no conoce Npgsql ni el proveedor del LLM.

- Los servicios (`Application/Services`) consultan con `IAppDbContext`, que expone los `DbSet` de EF Core. `Repositories/` queda para consultas complejas que convenga aislar.
- Las reglas de negocio lanzan las excepciones de `Domain/Exceptions`; `ManejoErroresMiddleware` las convierte en el código HTTP correcto (400, 401, 403, 404, 409) con `ProblemDetails`.
- Cada servicio nuevo se registra en `Application/DependencyInjection.cs`.
- Las vistas de `004_vistas.sql` se leen como entidades sin llave (`VRecursosPublicados`, `VParadasRuta`, `VCupoVigente`). Lo que ve el público o el asistente de IA debe salir de contenido **publicado** (RF08).
- Para buscar sin acentos dentro de una consulta: `FuncionesBd.Normalizar(columna).Contains(FuncionesBd.NormalizarTexto(texto))`; EF Core lo traduce a `f_normalizar()` y usa los índices trigram.
- Las reglas que dependen de la hora usan `IReloj` (no `DateTime.UtcNow`) y `ZonaYucatan` para convertir a la hora local (UTC−6). Las columnas `timestamptz` se guardan en UTC; una hora sin zona se rechaza con 400.
- Los enums viajan en JSON como texto snake_case (`"cancelado"`, `"en_curso"`), igual que en la base.

### Versiones

| Pieza | Versión |
|---|---|
| .NET / ASP.NET Core | **10** (`net10.0`). Visual Studio 2022 no lo soporta: usar Visual Studio 2026, VS Code con C# Dev Kit o Rider |
| EF Core + Npgsql | 10.0 |
| React / TypeScript / Vite | 19 / 7 / 8 |
| React Router | 8 (`createBrowserRouter`) |
| Leaflet / react-leaflet | 1.9 / 5 |
| Pruebas | xUnit, Vitest 5 + Testing Library |

### Dónde va cada módulo

| Módulo | Casos de uso | Frontend | Backend (Controllers / Services) |
|---|---|---|---|
| Cuenta y sesión | CU-01 | `features/auth` | Auth, Usuarios |
| Transporte | CU-02, CU-03, CU-13 | `features/transporte` | Rutas, Tarifas, Horarios |
| Operador | CU-04 | `features/cupo` | Salidas, ReportesCupo |
| Exploración | CU-05, CU-06, CU-07, CU-14 | `features/exploracion` | Catalogos, Negocios, Eventos, Lugares, Explorar |
| Mi Viaje | CU-09, CU-10 | `features/mi-viaje` | Itinerarios, Favoritos |
| Asistente de IA | CU-08 | `features/asistente` | Asistente |
| Consulta sin conexión | CU-11 | `src/offline` | (usa los endpoints de consulta) |
| Administración | CU-12 | `features/admin` | Admin* |

### Endpoints del backend ya implementados

| Ruta | Acceso | Qué hace |
|---|---|---|
| `POST /api/auth/registro` | Público | RF01, paso 1: valida datos y dominio del correo, guarda el registro pendiente y manda un código de 6 dígitos (202). **No crea la cuenta** |
| `POST /api/auth/registro/verificar` | Público | RF01, paso 2: con el código correcto crea la cuenta como viajero e inicia sesión (201) |
| `POST /api/auth/registro/reenviar` | Público | Manda otro código si ya pasaron 60 s; el anterior deja de servir (202) |
| `POST /api/auth/login`, `GET /api/auth/yo`, `POST /api/auth/logout`, `PUT /api/auth/contrasena` | Público / Sesión | CU-01: sesión JWT con revocación |
| `POST /api/auth/recuperar-contrasena`, `POST /api/auth/recuperar-contrasena/confirmar` | Público | CU-01 / RF01: restablecimiento de contraseña por código al correo (anti-enumeración) y cierre de sesiones previas |
| `GET/PUT/DELETE /api/usuarios/perfil`, `GET /api/usuarios/perfil/resumen` | Sesión | CU-01: consulta/edición de perfil propio, conteos reales de itinerarios/favoritos y desactivación lógica |
| `GET /api/catalogos/{categorias,municipios,localidades}` | Público | Filtros; localidades buscan sin acentos |
| `GET /api/ubicaciones/cercanas` | Público | RF02 / RNF05: localidades y paradas de abordaje cercanas ordenadas por distancia (GPS opcional) |
| `GET /api/negocios`, `/api/negocios/{id}` | Público | RF05: localidad, municipio, categoría, presupuesto, texto; horarios y «abierto ahora» |
| `GET /api/eventos`, `/api/eventos/{id}` | Público | RF06: próximos por defecto, rango de días en hora de Yucatán, estado (incluye cancelados) |
| `GET /api/lugares`, `/api/lugares/{id}` | Público | RF07: categoría, costo máximo, condiciones de acceso |
| `GET /api/explorar` | Público | CU-14 / RNF05: todo lo publicado de una categoría (sin rutas ni eventos terminados), con proximidad GPS opcional (`lat`, `lng`, `radioKm`) |
| `GET /api/rutas/{idRuta}/tarifas` | Público | RF03 / RNF07: tarifas aproximadas vigentes por ruta o tramo (fecha local Yucatán) |
| `/api/itinerarios[/{id}[/actividades…]]` | Viajero | RF09: CRUD, actividades, reordenar, traslados estimados y advertencias |
| `/api/admin/contenidos…` | Administrador | RF12: crear/editar negocios, lugares y eventos, publicar, archivar, cancelar evento, horarios, fotos |
| `/api/admin/rutas/{idRuta}/tarifas…` | Administrador | RF12 / CU-12: listar histórico, crear, editar y cerrar vigencia de tarifas sin solapamiento + bitácora |
| `/api/admin/{localidades,ubicaciones,bitacora}` | Administrador | Alta y edición (`PUT`) de geografía (con validación en Yucatán) y bitácora 17.1.5 |

**Confirmación de correo al registrarse (solo viajeros, RF01, RNF04):**

- El viajero llena el formulario y recibe un código de 6 dígitos que vale 15 minutos. Solo se guarda el hash del código (BCrypt). Si el correo no existe, el código nunca llega y la cuenta nunca se crea.
- Antes de enviar, `DnsValidadorDominioCorreo` revisa que el dominio tenga MX (o A/AAAA) y rechaza dominios inexistentes o con MX nulo. Si el DNS no responde, deja pasar: el código sigue siendo obligatorio. Se apaga con `VerificacionCorreo:ValidarDominio = false`.
- **Regresar a corregir:** volver a registrarse con el mismo correo reemplaza nombre y contraseña. Si no han pasado 60 s no reenvía y el código que ya llegó sigue sirviendo. Con otro correo se crea otro pendiente. Un registro sin confirmar nunca bloquea el correo.
- Cinco códigos incorrectos o el vencimiento anulan el pendiente. El login con un pendiente vigente avisa que falta confirmar, solo si la contraseña coincide.
- El envío lo hace `SmtpEnvioCorreo` con la sección `Correo` (servidor, puerto, usuario, contraseña, SSL, remitente). Sin `Correo:Servidor`, en Development el código se escribe en la consola de la API (`RegistroEnvioCorreo`); en cualquier otro ambiente el registro responde 503.
- Administradores, operadores y colaboradores no pasan por aquí: se crean con `crear_usuario.ps1` o desde `/api/admin/usuarios`.
- **Revocación de JWT distribuible (`DistribuidaRevocacionToken`):** la revocación por `jti` y el cierre global por usuario (por `iat` al cambiar contraseña o desactivar cuenta) corren sobre `IDistributedCache`. En una sola instancia del MVP se respalda con `AddDistributedMemoryCache()` sin dependencias extra; al escalar a múltiples nodos basta registrar un `IDistributedCache` compartido (por ejemplo Redis) sin cambiar servicios ni tablas de PostgreSQL.
- En el frontend, `RegistroPage` muestra `features/auth/components/VerificacionCorreo.tsx` después del formulario, con «Reenviar código» (cuenta regresiva) y «Volver y corregir mis datos», que conserva lo escrito.

**Advertencias de un itinerario** (no bloquean, se devuelven en el detalle): `conflicto_horario`, `traslado_insuficiente`, `fuera_de_fechas`, `fuera_de_horario`, `evento_cancelado`, `contenido_no_disponible`. El traslado es una estimación (haversine × 1.3 a 40 km/h) y no sustituye horarios ni recorridos reales.

Dentro de cada `features/<modulo>/` se usan las subcarpetas que hagan falta: `components/`, `pages/`, `hooks/` y `api/`. Se crean conforme se programe el módulo.

**Implementación provisional de itinerarios de Izamal, Valladolid, Tekit, Homún y Ticul (CU-09 / RF09):**
`features/mi-viaje` separa datos demostrativos (`data/`), cálculo puro (`plan/`),
interfaz y almacenamiento (`storage/`). Mientras no exista un servicio HTTP de
itinerarios, guarda en `localStorage` por `idUsuario`, sin sincronización con el
servidor. `/mi-viaje` conserva la protección de sesión. El borrador se conserva en
la URL para recarga y retorno desde login. Ver [ITINERARIOS_IZAMAL.md](ITINERARIOS_IZAMAL.md)
para límites y supuestos de Izamal. Valladolid añade dos jornadas de calendario local
independientes para fin de semana y registros con destino explícito, conservando la
lectura de los registros antiguos de Izamal en la misma clave v1. Ver
[ITINERARIOS_VALLADOLID.md](ITINERARIOS_VALLADOLID.md) para cálculo, acciones y
compatibilidad de persistencia. Tekit añade una jornada con modalidad textil,
borrador en URL y guardado compatible en la misma clave. El resumen y los bloques
secuenciales se comparten con Izamal; las acciones de compartir y descarga de texto
se comparten con Valladolid, conservando sus contratos. Ver
[ITINERARIOS_TEKIT.md](ITINERARIOS_TEKIT.md). Homún reutiliza las jornadas de
Valladolid mediante un cálculo parametrizado que conserva sus contratos y usa
`recorridoSecuencial.ts` para sumas y bloques. Conserva tipos de traslado, imágenes
del prototipo y guardado compatible en la misma clave. Ver
[ITINERARIOS_HOMUN.md](ITINERARIOS_HOMUN.md). Ticul añade una jornada con modalidades
de alfarería y calzado, duración solicitada para Ruta Puuc y Tour de Compras,
cronología propia y las mismas acciones y clave v1. Reutiliza el motor secuencial,
sin modificar los cálculos anteriores. Ver [ITINERARIOS_TICUL.md](ITINERARIOS_TICUL.md).
No cambia el modelo de BD.

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

### 4.7 Decisiones de implementación (11 nov 2026)

- **Identificadores:** enteros autoincrementales (`integer GENERATED BY DEFAULT AS IDENTITY`), no UUID.
- **3 tablas agregadas al MVP** (en `database/schema/002_ampliaciones_mvp.sql`), con lo que el total queda en **30**:
  - `recorridos_sugeridos` y `etapas_recorrido` → CU-13 Recorridos sugeridos.
  - `bitacora_admin` → paquete 17.1.5 Bitácora de cambios administrativos.
- **1 tabla para confirmar correos** (en `database/schema/005_verificacion_correo.sql`), con lo que el total queda en **31**:
  - `registros_pendientes` → RF01: nombre, correo, hash de la contraseña, hash del código, intentos, `enviado_en` y `expira_en`. La cuenta en `usuarios` se crea solo al confirmar el código; si el correo no existe, el código nunca llega y la fila caduca. Índice único sobre `lower(correo)`.
- Quién y cuándo reportó cupo (11.1.6) ya queda en `reportes_cupo.id_autor` y `registrado_en`.
- Los estados (`tipo`, `estado_publicacion`, `estado_evento`, `salidas.estado`) son `varchar` con `CHECK`, guardados en minúsculas y snake_case (`en_curso`).
- **El esquema vive en SQL**, no en migraciones de EF Core: `database/schema` → `database/triggers` → `database/seed`. EF Core solo mapea.

### 4.8 Cómo se crea la base de datos

`database/crear_bd.ps1` ejecuta, en orden, sobre una base vacía llamada `biin`:

1. `database/schema/001_esquema.sql` — 27 tablas del modelo.
2. `database/schema/002_ampliaciones_mvp.sql` — 3 tablas del MVP.
3. `database/schema/003_busqueda.sql` — extensiones `unaccent`, `pg_trgm` y `pgcrypto`; función `f_normalizar()` e índices de búsqueda.
4. `database/schema/004_vistas.sql` — vistas de consulta.
5. `database/schema/005_verificacion_correo.sql` — registros de viajeros que esperan confirmar su correo.
6. `database/triggers/001_reglas.sql` — tipo de detalle, horarios de visita, cupo ≤ capacidad, operador autorizado, `actualizado_en`.
7. `database/seed/001_catalogos.sql` — roles y categorías.
8. `database/seguridad/001_usuario_app.sql` — crea `biin_app` y le da permisos.

### 4.9 Búsqueda sin acentos

`f_normalizar(texto)` quita acentos y pasa a minúsculas. Hay índices trigram sobre `recursos.titulo`, `localidades.nombre`, `municipios.nombre` y `categorias.nombre`, así que estas consultas usan índice:

```sql
-- "homun" encuentra "Homún"
SELECT nombre FROM localidades WHERE f_normalizar(nombre) LIKE '%' || f_normalizar('homun') || '%';
-- tolera errores: "omun" sugiere "Homún"
SELECT nombre FROM localidades ORDER BY similarity(f_normalizar(nombre), f_normalizar('omun')) DESC LIMIT 5;
```

### 4.10 Vistas

| Vista | Para qué |
|---|---|
| `v_recursos_publicados` | Solo contenido publicado, con su ubicación, localidad y municipio. Es lo único que debe ver el público y el asistente de IA (RF08) |
| `v_paradas_ruta` | Paradas en orden de cada ruta activa y publicada, con localidad y municipio. Base de la búsqueda origen → destino (CU-02) |
| `v_cupo_vigente` | Por salida: el último reporte vigente o `no_confirmado` (RF04, RNF07) |

### 4.11 Usuarios de base de datos (RNF04)

| Usuario | Lo usa | Puede |
|---|---|---|
| `postgres` (`ConnectionStrings:BiinAdmin`) | Solo los scripts de `database/` | Todo |
| `biin_app` (`ConnectionStrings:Biin`) | La API | Leer, insertar, actualizar y borrar datos. **No** puede crear, alterar ni borrar tablas, ni crear bases |

Los usuarios de la aplicación se crean desde la API (registro, siempre como viajero y **solo después de confirmar el código que llega al correo**) o con `database/crear_usuario.ps1` para administradores, operadores y colaboradores. Las contraseñas se guardan con BCrypt en ambos casos.

### 4.12 Scripts de `database/`

| Script | Qué hace |
|---|---|
| `crear_bd.ps1 [-Recrear] [-Demo]` | Crea la base completa; con `-Demo` carga también la demo |
| `cargar_demo.ps1 [-Borrar]` | Carga o borra los datos de demostración de Homún |
| `crear_usuario.ps1 -Correo -Nombre -Rol [-Rutas]` | Crea un usuario con rol; pide la contraseña en pantalla |
| `actualizar_bd.ps1` | Aplica a una base existente los scripts nuevos (hoy `005_verificacion_correo.sql`) y renueva los permisos de `biin_app`, sin borrar datos |
| `verificar_bd.ps1` | Comprueba 31 tablas, 3 vistas, `f_normalizar`, roles y permisos de `biin_app`, y ejecuta `pruebas/*.sql` |
| `respaldar_bd.ps1` | Respaldo `.dump` en `database/backups/` (paquete 8.2.4) |
| `restaurar_bd.ps1 [-Archivo]` | Restaura un respaldo; pide confirmación |
| `pruebas/001_reglas.sql` | 15 pruebas de restricciones y triggers |
| `pruebas/002_busqueda_vistas.sql` | 9 pruebas de búsqueda y vistas |
| `pruebas/003_registros_pendientes.sql` | 6 pruebas de la confirmación de correo |

Todos leen las conexiones de `appsettings.Development.json`; ninguna contraseña va en el repositorio ni en la línea de comandos. Se guardan en UTF-8 con BOM y mandan el SQL con acentos por la entrada estándar, para que funcionen igual en PowerShell 7 y en Windows PowerShell 5.1. `psql` se busca en `BIIN_PG_BIN`, en las carpetas de PostgreSQL 18, 17 o 16 y en el `PATH`.

### 4.13 Datos de demostración

`database/seed/demo/001_homun.sql` carga datos **ficticios** para desarrollo, con Homún como ejemplo. Solo son reales los nombres de los municipios y las coordenadas aproximadas de sus centros; rutas, horarios, tarifas, unidades, negocios, lugares y eventos son inventados.

| Qué | Contenido |
|---|---|
| Municipios | Mérida, Kanasín, Acanceh, Cuzamá y Homún, con su cabecera (se conservan al borrar la demo) |
| Rutas | `DEMO-MER-HOM` (5 paradas) y `DEMO-HOM-MER`, con trazo, horarios diarios y 7 tarifas por tramo |
| Salidas | Hoy y los próximos 6 días, generadas de los horarios, con unidades `DEMO-COMBI-01/02` |
| Lugares | Un cenote con horario y costo, una iglesia y un cenote **pendiente** que no debe verse en público |
| Negocio | Una cocina económica con horario y precios |
| Eventos | Una vaquería el próximo sábado y un concierto **cancelado** |
| Recorrido | «Un día de cenotes en Homún» con 5 etapas (CU-13) |

Reglas para quien agregue datos demo: título con `[DEMO]`, códigos con `DEMO-`, autor `demo@biin.test` (cuenta inactiva sin acceso), y que `999_borrar_demo.sql` los pueda quitar. Las salidas se fijan al día de la carga: si ya pasaron, borrar y volver a cargar.

`database/seed/demo/002_rutas_tarifas_referencia.sql` complementa la demo con rutas ida/regreso y tarifas aproximadas de referencia (`DEMO-MER-IZA`, `DEMO-MER-VAL`, `DEMO-MER-TEK`, `DEMO-MER-TIC`) para poder probar y ajustar montos y vigencias desde `/api/admin/rutas/{idRuta}/tarifas` antes de la validación final con operadores.

## 5. Diagramas de clases (Unidad 2)

Tres áreas del dominio (ver FigJam → Zona 2 → Versión 2 → Diagramas de clases):

1. **Identidad, geografía y catálogo:** Usuario, Rol, `Recurso` (*abstracta*) con herencia a **Lugar, Evento y Negocio**; Categoría, Fotografía, Ubicación, Localidad, Municipio.
2. **Transporte intermunicipal:** Ruta (`buscarPorOrigenDestino()`), RutaParada (mínimo 2), PuntoRecorrido, HorarioRuta, Tarifa (`esVigente()`), Unidad, Salida (`validarCapacidad()`), ReporteCupo (`estaVigente()`), UsuarioOperador (`reportarCupo()`).
3. **Mi Viaje y ampliaciones:** Itinerario (`agregarActividad()`, `calcularTraslados()`), ActividadItinerario (`comprobarConflicto()`), Favorito, **ServicioIA** (*servicio no persistente*, `recomendarConDatos()`), y RecorridoSugerido / EtapaRecorrido (*propuesta M2*).

## 6. Pruebas

| Nivel | Herramienta | Qué se verifica |
|---|---|---|
| Unitarias backend | **xUnit** | Servicios y reglas: búsqueda por orden de paradas, vigencia del cupo, horarios de visita, traslados, advertencias de itinerario |
| Integración con BD | **xUnit + PostgreSQL real** (`[FactBd]`, variable `BIIN_PRUEBAS_BD`) | Que cada DbSet coincida con el esquema SQL, que EF Core traduzca filtros y `f_normalizar`, y los flujos CU-01, CU-09 y CU-12 de punta a punta |
| Unitarias frontend | **Vitest + React Testing Library** | Componentes y validación de formularios |
| API / integración | **Postman** | Endpoints, códigos de respuesta, JWT y permisos por rol |
| PWA, rendimiento, accesibilidad | **Lighthouse** | Instalación, offline, tiempos de carga, contraste (RNF01, 03, 06, 07) |
| Funcionales | Plan basado en trazabilidad RF → HU → CU | Que cada RF se cumpla |
| Usabilidad | Pruebas con usuarios | Al menos 4 de 5 completan las tareas principales (RNF02) |
