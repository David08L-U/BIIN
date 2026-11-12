# BIIN — Plataforma Inteligente para Viajes y Rutas Intermunicipales de Yucatán

> Proyecto Integrador · Universidad Tecnológica Metropolitana (UTM) · División TIC
> Asignatura: Estructura de Datos · 4.º cuatrimestre · Grupo D · Docente: Miriam Canche Caamal
> Periodo: **17 sep 2026 → 16 abr 2027** (8 meses, 32 semanas)

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
| **Etapa** | Cascada — Diseño (actividades 4–6) |
| **Hitos cerrados** | H1 Planeación · H2 Investigación de usuario · H3 Diagramas UML |
| **En curso** | H4 Prototipo de alta fidelidad (Melanie) |
| **Próximos** | H5 Validación con stakeholders · H6 Modelo de BD aprobado (9 dic 2026) · **H7 Arquitectura y repositorio (16 dic 2026) = inicio del Sprint 1** |
| **Última actualización** | 11 nov 2026 |

## Documentación

| Archivo | Para qué sirve |
|---|---|
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Stack, capas, estructura de carpetas y **modelo de base de datos (27 tablas)** con sus reglas |
| [docs/REQUERIMIENTOS.md](docs/REQUERIMIENTOS.md) | RF01–RF12, RNF01–RNF08, HU01–HU12, CU-01–CU-14, trazabilidad, alcance del MVP, restricciones y supuestos |
| [docs/PLAN_Y_SPRINTS.md](docs/PLAN_Y_SPRINTS.md) | Metodología Cascada + Scrum, EDT, 15 hitos, 9 sprints y Definición de Terminado |
| [docs/CONVENCIONES.md](docs/CONVENCIONES.md) | Git, código, pruebas, checklist de tarea y **reglas para asistentes de IA** |

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
