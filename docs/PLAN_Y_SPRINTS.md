# Plan del proyecto y sprints

Fuente: Notion §5 (Metodología), §6 (EDT y hitos) y §7 (Entregables). El **Gantt interactivo** con paquetes de trabajo (nivel 4, p. ej. 10.1.3), predecesores y responsables por tarea vive en Notion — aquí está el resumen.

- **Inicio:** 17 sep 2026 · **Fin:** 16 abr 2027 (8 meses, 2 cuatrimestres)

## 1. Metodología: híbrido Cascada + Scrum

| Etapa | Actividades | Forma de trabajo |
|---|---|---|
| **Cascada** — análisis y diseño | 1 a 6 | Secuencial, con un entregable al cierre de cada fase |
| **Scrum** — construcción, pruebas y cierre | 7 a 20 | **9 sprints de 2 semanas** que entregan módulos funcionando |

### Fases en cascada

| Fase | Actividades | Qué se hace | Cierre |
|---|---|---|---|
| 1. Inicio y planeación | 1 | Objetivo, alcance del MVP, stack, cronograma, EDT y reparto del equipo | H1 |
| 2. Análisis | 3, 2 | Encuesta a usuarios, RF, HU, CU y RNF; recopilar y validar rutas, negocios y eventos con stakeholders | H2, H5 |
| 3. Diseño | 4, 5, 6 | Modelo de BD en 3FN, UML, protopersonas, flujos, wireframes y prototipo de alta fidelidad validado con usuarios | H3, H4, H6 |

### Scrum

- **Product Owner:** Aaron · **Scrum Master:** rotativo · **Equipo:** dos parejas (David – Andrey, Melanie – Aaron).
- Sprints de 2 semanas.

### Definición de Terminado (DoD)

Una tarea está terminada solo si:

1. El código está en **GitHub** y fue **revisado por la otra pareja** mediante pull request.
2. **Las pruebas pasan.**
3. La vista **funciona desde 360 px**.
4. **Cumple el RF y el CU** que le corresponden.

## 2. EDT (WBS)

Tres niveles: proyecto → 6 fases → 20 actividades. El nivel 4 (paquetes de trabajo) está en Notion.

```
BIIN
├── 1. Inicio y planeación
│   └── 1. Planeación inicial y alcance
├── 2. Análisis
│   ├── 3. Análisis y requerimientos
│   └── 2. Recopilación y validación con stakeholders
├── 3. Diseño
│   ├── 4. Diseño y normalización de BD
│   ├── 5. UML y diagramas de procesos
│   └── 6. Diseño de interfaces y prototipos
├── 4. Construcción (Scrum)
│   ├── 7. Arquitectura y repositorio
│   ├── 8. Implementación de BD
│   ├── 9. Usuarios, autenticación y roles
│   ├── 10. Rutas intermunicipales y mapas
│   ├── 11. Reporte de cupo disponible
│   ├── 12. Gastronomía, eventos y lugares
│   ├── 13. Itinerarios
│   ├── 14. Favoritos
│   ├── 15. Asistente de IA
│   ├── 16. PWA y consulta sin conexión
│   └── 17. Gestión administrativa y de contenidos
├── 5. Pruebas
│   ├── 18. Integración y pruebas del sistema
│   └── 19. Corrección de errores y optimización
└── 6. Cierre
    └── 20. Documentación final y demostración
```

## 3. Hitos

| ID | Hito | Fecha | Cierra actividad | Estado (11 nov 2026) |
|---|---|---|---|---|
| H1 | Planeación del proyecto entregada (Actividad 1) | 19 oct 2026 | 1 | ✅ Completado |
| H2 | Investigación de usuario entregada (Actividad 2) | 23 oct 2026 | 3, 6.1 | ✅ Completado |
| H3 | Diagramas UML entregados (Actividad 3) | 26 oct 2026 | 5.1, 5.3 | ✅ Completado |
| H4 | Prototipo de alta fidelidad entregado (Actividad 4) | 30 oct 2026 | 6.2 | 🔄 En curso |
| H5 | Información validada con stakeholders | por confirmar (ver Notion) | 2 | ⏳ Pendiente |
| H6 | Modelo de base de datos aprobado | 9 dic 2026 | 4 | ⏳ Pendiente |
| H7 | Arquitectura y repositorio listos | 16 dic 2026 | 7 | ⏳ Pendiente |
| H8 | Base de datos implementada | 30 dic 2026 | 8 | ⏳ Pendiente |
| H9 | Autenticación y roles terminados | 13 ene 2027 | 9 | ⏳ Pendiente |
| H10 | Módulos de consulta terminados (rutas, catálogos y favoritos) | 10 feb 2027 | 10, 12, 14 | ⏳ Pendiente |
| H11 | Módulos de planeación y administración terminados | 3 mar 2027 | 11, 13, 17 | ⏳ Pendiente |
| H12 | Asistente de IA y PWA integrados | 24 mar 2027 | 15, 16 | ⏳ Pendiente |
| H13 | Sistema integrado y probado | 7 abr 2027 | 18 | ⏳ Pendiente |
| H14 | Versión corregida y optimizada | 12 abr 2027 | 19 | ⏳ Pendiente |
| H15 | **Entrega final del proyecto BIIN** | **16 abr 2027** | 20 | ⏳ Pendiente |

## 4. Plan de sprints

| Sprint | Fechas | Actividades | Hito |
|---|---|---|---|
| 1 | 10 – 23 dic 2026 | 7 Arquitectura y repositorio · 8 Implementación de BD | H7 |
| 2 | 24 dic 2026 – 6 ene 2027 | 8 Implementación de BD · 9 Usuarios, autenticación y roles | H8 |
| 3 | 7 – 20 ene 2027 | 9 Autenticación · inicio de 10 Rutas y 12 Gastronomía, eventos y lugares | H9 |
| 4 | 21 ene – 3 feb 2027 | 10 Rutas y mapas · 12 Gastronomía, eventos y lugares | — |
| 5 | 4 – 17 feb 2027 | 10 Rutas (cierre) · 14 Favoritos · inicio de 11, 13 y 17 | H10 |
| 6 | 18 feb – 3 mar 2027 | 11 Reporte de cupo · 13 Itinerarios · 17 Administración | H11 |
| 7 | 4 – 17 mar 2027 | 15 Asistente de IA · 16 PWA y consulta sin conexión | — |
| 8 | 18 – 31 mar 2027 | 15 Asistente de IA (cierre) · 18 Integración y pruebas | H12 |
| 9 | 1 – 16 abr 2027 | 18 Pruebas · 19 Corrección y optimización · 20 Documentación final y demo | H13, H14, H15 |

**Responsables por actividad:** cada actividad tiene una pareja a cargo y dentro de ella las tareas se reparten de forma individual y alternada. La asignación exacta está en la columna *Responsables* del cronograma en Notion.

## 5. Entregables de la Unidad 2

| Actividad | Contenido | Fecha | Responsable | Estado | Evidencia |
|---|---|---|---|---|---|
| 1. Planeación | Gantt con hitos y predecesores, EDT, técnicas y herramientas, metodología | 19 oct 2026 | David | ✅ Entregada | Notion |
| 2. Investigación de usuario | Encuesta (28 respuestas) y gráficas, protopersonas, journey maps, user flows, 10 diagramas de procesos, wireframes | 23 oct 2026 | Aaron | ✅ Entregada | FigJam · PDF en la asignación |
| 3. Diagramas UML | 14 CU con plantilla, clases, objetos, actividad y secuencia | 26 oct 2026 | Aaron | ✅ Entregada | PDF en la asignación |
| 4. Diseño y prototipo | Prototipo de alta fidelidad con pantallas vinculadas | 30 oct 2026 | Melanie | 🔄 En curso | Prototipo en GitHub Pages |

## 6. Paquetes de trabajo a no olvidar

Tareas de nivel 4 registradas en Notion que son fáciles de pasar por alto:

- 2.3.4 Confirmar **por escrito** la validez de los datos de transporte.
- 8.2.4 Respaldo inicial de la base de datos.
- 10.1.7 Validar orden de paradas y rutas de ida y regreso (RF02, RF03).
- 11.1.6 Registrar quién y cuándo reportó el cupo (RNF04).
- 15.1.5 Respuesta «no tengo esa información» cuando no hay datos en BD (RF08).
- 16.2.4 Auditoría de PWA con Lighthouse.
- 16.3.4 Indicador visible de modo sin conexión (RNF07).
- 17.1.5 Bitácora de cambios administrativos.
- 17.2.3 Carga de fotografías.
- 18.4.1–18.4.8 Verificar cada RNF (RNF01–RNF08) antes del cierre.
