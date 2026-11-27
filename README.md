# BIIN — Plataforma Inteligente para Viajes y Rutas Intermunicipales de Yucatán


## ¿Qué es BIIN?

Una **aplicación web progresiva (PWA)** para planear viajes entre municipios de Yucatán. Reúne en un solo lugar:

- **Transporte en combi**: rutas, paradas, puntos de abordaje, horarios, tarifas aproximadas y regreso.
- **Experiencias locales**: gastronomía, eventos culturales y lugares turísticos.
- **Asistente de IA** que recomienda en lenguaje cotidiano **usando solo los datos registrados en BIIN** (nunca inventa tarifas, horarios ni recorridos).
- **Consulta sin conexión** de rutas e itinerarios descargados, mostrando la fecha de actualización.

**Objetivo del MVP:** que un viajero pueda descubrir sitios, eventos y comida local, planear su visita y consultar cómo trasladarse en combi con información validada por el equipo.

## Equipo

| Integrante | Usuario Notion | Pareja |
|---|---|---|
| Luis David Cat Canche | @David Canche | David – Andrey |
| Jossemyr Andrey Canul Poot | @Jossemyr Andrey Canul Poot | David – Andrey |
| Melanie Grissel Baas Aguilar | @Melanie Baas águilar | Melanie – Aaron |
| Aaron Isais Caamal Martinez | @aaron caamal | Melanie – Aaron |

- **Product Owner:** Aaron
- **Scrum Master:** rotativo
- Cada actividad la lleva una pareja; las fases de planeación, validación, integración, pruebas y cierre son de todo el equipo.

## Estado actual (actualizar en cada sprint)

| | |
|---|---|
| **Etapa** | Programación del MVP completo — **entrega funcionando el 3 dic 2026** (las fechas de sprints de Notion son de Estructura de Datos) |
| **Hecho** | Esquema SQL (30 tablas, triggers, catálogos) · backend por capas con registro/login JWT · frontend con rutas, sesión y mapa |
| **Hitos cerrados** | H1 Planeación · H2 Investigación de usuario · H3 Diagramas UML · H4 Prototipo de alta fidelidad |
| **Próximos** | H5 Validación con stakeholders (20 nov 2026) · H6 Modelo de BD aprobado (9 dic 2026) · **H7 Arquitectura y repositorio (16 dic 2026), al cierre del Sprint 1** |
| **Última actualización** | 11 nov 2026 |

## Cómo ejecutar

**Requisitos:** .NET SDK 10, Node.js 22 o superior, PostgreSQL 16 o superior.

**1. Configuración local.** Copiar `backend/src/Biin.Api/appsettings.Development.example.json` como `appsettings.Development.json` y llenar ahí:

| Clave | Qué poner |
|---|---|
| `ConnectionStrings:BiinAdmin` | La contraseña de `postgres`. Solo la usan los scripts de `database/` |
| `ConnectionStrings:Biin` | Una contraseña inventada para `biin_app`, el usuario con el que se conecta la API. El script lo crea con esa contraseña |
| `Jwt:Clave` | Una clave aleatoria de 32 caracteres o más |

Ese archivo no se sube a Git. **La plantilla `.example` nunca lleva datos reales.**

**2. Base de datos.** Crea la base `biin`, las tablas, la búsqueda, las vistas, los triggers, los catálogos y el usuario `biin_app`.

```bash
pwsh ./database/crear_bd.ps1
```

Con `-Recrear` borra la base y la crea de nuevo. Después crea el primer administrador; la contraseña se pide en pantalla:

```bash
pwsh ./database/crear_usuario.ps1 -Correo tu@correo.com -Nombre "Tu Nombre" -Rol administrador
```

El mismo script crea operadores (`-Rol operador -Rutas CODIGO1,CODIGO2`) y colaboradores.

**Datos de demostración (Homún).** Para programar y probar sin esperar los datos validados:

```bash
pwsh ./database/cargar_demo.ps1
```

Carga la ruta Mérida → Kanasín → Acanceh → Cuzamá → Homún y su regreso, horarios, tarifas, salidas de 7 días, un cenote, una iglesia, una cocina económica, una vaquería, un concierto cancelado y un recorrido sugerido. **Todo es ficticio y lleva `[DEMO]`**; se quita con `-Borrar`. Para probar el reporte de cupo, crea un operador de la demo:

```bash
pwsh ./database/crear_usuario.ps1 -Correo operador@biin.test -Nombre "Operador Demo" -Rol operador -Rutas DEMO-MER-HOM,DEMO-HOM-MER
```

**Respaldos:** `pwsh ./database/respaldar_bd.ps1` guarda un `.dump` en `database/backups/` (no se sube a Git) y `pwsh ./database/restaurar_bd.ps1` carga el más reciente.

**Pruebas de la base** (no dejan datos):

```bash
psql -U postgres -d biin -f database/pruebas/001_reglas.sql -f database/pruebas/002_busqueda_vistas.sql
```

**3. Backend.**

```bash
dotnet run --project backend/src/Biin.Api --urls http://localhost:5080
```

Comprobar en http://localhost:5080/api/salud que diga `"baseDeDatos": "ok"`. La especificación OpenAPI está en `/openapi/v1.json`.

**4. Frontend.** En otra terminal:

```bash
npm install --prefix frontend
```

```bash
npm run dev --prefix frontend
```

Abrir http://localhost:5173. Las llamadas a `/api` se reenvían al backend.

**Pruebas:** `dotnet test backend/Biin.slnx` y `npm test --prefix frontend`.

## Documentación

| Archivo | Para qué sirve |
|---|---|
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Stack, capas, estructura de carpetas y **modelo de base de datos (27 tablas)** con sus reglas |
| [docs/REQUERIMIENTOS.md](docs/REQUERIMIENTOS.md) | RF01–RF12, RNF01–RNF08, HU01–HU12, CU-01–CU-14, trazabilidad, alcance del MVP, restricciones y supuestos |
| [docs/PLAN_Y_SPRINTS.md](docs/PLAN_Y_SPRINTS.md) | Metodología Cascada + Scrum, EDT, 15 hitos, 9 sprints, **responsables y MoSCoW por actividad** y Definición de Terminado |
| [docs/CONVENCIONES.md](docs/CONVENCIONES.md) | Git, código, pruebas, checklist de tarea y **reglas para asistentes de IA** |
| [docs/ENTREGA_FRONTEND_DINAMICO.md](docs/ENTREGA_FRONTEND_DINAMICO.md) | Rutas dinámicas, contratos de destinos, validación y continuidad |

**¿Por dónde empiezo?**
- ¿Vas a programar? → `ARQUITECTURA.md` + `CONVENCIONES.md`
- ¿Vas a tomar una tarea? → `PLAN_Y_SPRINTS.md` para ubicarla y `REQUERIMIENTOS.md` para saber qué RF/CU cumple.
- ¿Eres una IA? → lee **todo** `CONVENCIONES.md` antes de escribir código.

## Fuentes oficiales

Estos archivos son un resumen. Si algo no coincide, manda la fuente original:

- **Notion — Planificación y Arquitectura** (cronograma Gantt interactivo, EDT, responsables por tarea, entregables):
  https://www.notion.so/3feb291ff55e81c6a26dc0f455233a5a
- **FigJam — Tablero del proyecto** (investigación, modelo de BD, UML, casos de uso, flujos, wireframes, identidad visual y prototipo):
  https://www.figma.com/board/JlCOzpHk4Sk7duTgNv9kSA/BIIN
- **Prototipo navegable (alta fidelidad):** https://melaniebaasaguilar-web.github.io/BIIN-Yucatan/biin_iniciar_sesi_n/code.html
