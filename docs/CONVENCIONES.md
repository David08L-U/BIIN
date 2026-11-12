# Convenciones de trabajo

> Lo marcado como **(propuesta)** no viene de Notion ni de FigJam: es un punto de partida para acordar en equipo al cerrar H7 «Arquitectura y repositorio». Cuando se acuerde, quitar la marca.

## 1. Git y GitHub

Definido en el plan: **ramas por módulo** y **revisión con pull requests** por la otra pareja.

**Ramas (propuesta)**

| Rama | Uso |
|---|---|
| `main` | Versión estable y entregable. Solo se integra desde `develop` al cerrar un sprint |
| `develop` | Integración del sprint |
| `feature/<modulo>-<descripcion>` | Trabajo de una tarea, p. ej. `feature/rutas-busqueda-origen-destino` |
| `fix/<descripcion>` | Corrección de errores |

Módulos: `auth`, `rutas`, `cupo`, `exploracion`, `itinerarios`, `favoritos`, `asistente-ia`, `pwa`, `admin`, `bd`.

**Commits (propuesta):** en español, en presente, con prefijo:
`feat:` nueva función · `fix:` corrección · `docs:` documentación · `test:` pruebas · `refactor:` reestructura sin cambiar comportamiento · `chore:` configuración.
Ejemplo: `feat(rutas): buscar rutas por orden de paradas (RF02)`

**Pull requests**

- Siempre hacia `develop`, **revisado por un integrante de la otra pareja**.
- En la descripción, indicar el **RF, HU y CU** que cubre y el paquete de trabajo de Notion (p. ej. 10.1.3).
- No se fusiona si las pruebas fallan.

## 2. Código

**Nombres (propuesta)**

| Elemento | Convención | Ejemplo |
|---|---|---|
| Tablas y columnas PostgreSQL | `snake_case`, español, tablas en plural | `ruta_parada.permite_abordar` |
| Clases C# / entidades | `PascalCase`, español, singular | `RutaParada`, `ReporteCupo` |
| Métodos y propiedades C# | `PascalCase` | `BuscarPorOrigenDestino()` |
| Variables y funciones TS | `camelCase` | `buscarRutas()` |
| Componentes React | `PascalCase`, un componente por archivo | `DetalleRuta.tsx` |
| Endpoints REST | `kebab-case`, plural, bajo `/api` | `GET /api/rutas?origen=..&destino=..` |

**Backend (C# / ASP.NET Core)**

- Capas: **Controllers → Services → Repositories**. Los controladores no tocan EF Core directamente.
- La autorización por rol se aplica en el backend (`[Authorize(Roles = ...)]` o políticas), no solo en la UI.
- Contraseñas con hash seguro; nunca se guardan ni se registran en texto plano.
- Las reglas que cruzan tablas (cupo ≤ capacidad, autor autorizado en la ruta) se validan en el servicio **y** con trigger en BD.
- Para retirar contenido se cambia su estado; no se borra información referenciada.

**Frontend (React + TypeScript)**

- Organizado por módulos funcionales (ver `ARQUITECTURA.md` §3).
- Diseñar primero para **360 px** y luego escritorio.
- Accesibilidad: todo usable con teclado, etiquetas en controles, contraste ≥ 4.5:1.
- Todo dato que pueda venir de la copia offline o de un reporte vencido debe mostrar su **fecha** y su estado (actualizado / guardado / no confirmado).

## 3. Pruebas

| Nivel | Herramienta | Mínimo esperado |
|---|---|---|
| Backend | xUnit | Cada servicio con reglas de negocio tiene pruebas |
| Frontend | Vitest + React Testing Library | Componentes con formularios o lógica |
| API | Postman | Colección con casos por rol y JWT (éxito y acceso denegado) |
| PWA | Lighthouse | Antes de H12 y en la auditoría 16.2.4 |
| Usabilidad | Pruebas con usuarios | 4 de 5 completan las tareas principales |

## 4. Checklist antes de cerrar una tarea

- [ ] Cumple el RF y el CU indicados (revisar `REQUERIMIENTOS.md`).
- [ ] Pruebas escritas y pasando.
- [ ] Probado a 360 px y en escritorio.
- [ ] Permisos validados en backend si la función es protegida.
- [ ] Sin datos inventados ni valores fijos que deberían venir de la BD.
- [ ] PR revisado y aprobado por la otra pareja.
- [ ] Tarea actualizada en Notion.
- [ ] Documentación actualizada si cambió la arquitectura, el modelo de BD o una convención.

## 5. Para asistentes de IA

Si eres una IA ayudando en este proyecto, sigue estas reglas:

1. **Lee primero** `README.md`, `docs/ARQUITECTURA.md` y `docs/REQUERIMIENTOS.md`. Ubica la tarea en `docs/PLAN_Y_SPRINTS.md`.
2. **Respeta el stack**: C# + ASP.NET Core Web API, PostgreSQL con EF Core + Npgsql, React + TypeScript, Leaflet + OpenStreetMap. No propongas otros frameworks, bases de datos o librerías de mapas sin que el equipo lo pida.
3. **Respeta el modelo de datos** (27 tablas en 3FN). Si una tarea parece requerir una tabla o columna nueva, propónla y explica por qué; no la agregues en silencio.
4. **No inventes datos de transporte**: rutas, paradas, horarios, tarifas o recorridos. Para pruebas usa datos claramente marcados como ficticios en `database/seed/`.
5. El asistente de IA de BIIN debe responder **solo con contenidos publicados en la BD** y decir «no tengo esa información» cuando no los haya (RF08).
6. Cada cambio debe poder ligarse a un **RF / HU / CU**. Menciónalo en el commit o PR.
7. Cumple la **Definición de Terminado**: pruebas, 360 px, permisos en backend.
8. Si algo en estos documentos contradice Notion o FigJam, **avisa**; no decidas por tu cuenta cuál es correcto.
9. Si cambias arquitectura, modelo de BD o convenciones, **actualiza el documento correspondiente** en el mismo cambio.
