
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

## . Pruebas

| Nivel | Herramienta | Mínimo esperado |
|---|---|---|
| Backend | xUnit | Cada servicio con reglas de negocio tiene pruebas |
| Frontend | Vitest + React Testing Library | Componentes con formularios o lógica |
| API | Postman | Colección con casos por rol y JWT (éxito y acceso denegado) |
| PWA | Lighthouse | Antes de H12 y en la auditoría 16.2.4 |
| Usabilidad | Pruebas con usuarios | 4 de 5 completan las tareas principales |

## . Checklist antes de cerrar una tarea

- [ ] Cumple el RF y el CU indicados (revisar `REQUERIMIENTOS.md`).
- [ ] Pruebas escritas y pasando.
- [ ] Probado a 360 px y en escritorio.
- [ ] Permisos validados en backend si la función es protegida.
- [ ] Sin datos inventados ni valores fijos que deberían venir de la BD.
- [ ] PR revisado y aprobado por la otra pareja.
- [ ] Tarea actualizada en Notion.
- [ ] Documentación actualizada si cambió la arquitectura, el modelo de BD o una convención.

## . Para asistentes de IA

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
