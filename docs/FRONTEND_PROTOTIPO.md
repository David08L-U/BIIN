# Frontend del prototipo BIIN

Implementación React + TypeScript de las 16 vistas entregadas en el ZIP. Referencia complementaria: https://github.com/melaniebaasaguilar-web/BIIN-Yucatan (HTML original del equipo). El nodo Figma 2:3 contiene imágenes de wireframes, no componentes editables.

## Alcance y decisiones

- CU-01: conservar autenticación real contra ASP.NET Core; no simular usuarios, tokens ni inicio de sesión con Google.
- CU-02/03/13: explorar cinco destinos del prototipo con búsqueda, filtros, mapa Leaflet, ida/regreso y detalle.
- CU-05/07/14: explorar puntos de interés del prototipo, distinguiendo gastronomía, cultura, cenotes y talleres.
- CU-09/10: personalizar actividades y guardar borradores/favoritos en este dispositivo. No equivale a sincronización de cuenta.
- CU-11: descargar un itinerario en JSON y ofrecer copia offline de la interfaz. Las teselas no se descargan.
- Perfil: mostrar la cuenta auténtica o acceso como visitante; sin estadísticas ficticias.

Los datos visuales de transporte proceden del prototipo y son demostrativos. No hay endpoints de catálogo en el backend actual; `VITE_CATALOGO_DEMO=false` oculta las fichas y muestra el estado sin datos. No hay cupos, seguimiento GPS, disponibilidad ni próximas salidas en vivo. No se modifican backend, esquema SQL, permisos ni ramas del equipo.

Notion no resultó accesible desde esta sesión. Se consultaron README, arquitectura, requisitos, convenciones y sprints del repositorio. El README menciona entrega el 3 de diciembre y el plan conserva el 16 de abril de 2027; el equipo debe conciliar esas fechas. README dice 30 tablas y arquitectura/requisitos 27; esta implementación no decide ni modifica ese modelo.

El trabajo se desarrolla en `feat/biin-frontend-prototipo` para revisión de la otra pareja. Los commits describen avances reales y referencian RF/CU; no se atribuyen contribuciones a integrantes que no las hicieron. Conservar los commits al integrar (merge commit, sin squash) si se requiere evaluar su historial.
