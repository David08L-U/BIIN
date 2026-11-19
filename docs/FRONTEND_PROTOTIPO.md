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

## Ejecutar en Windows / VS Code

Desde la raíz del repositorio:

```powershell
npm ci --prefix frontend
npm run dev --prefix frontend
```

Abre http://localhost:5173. Las pantallas públicas y borradores funcionan con el catálogo de demostración sin base de datos. Para crear cuentas o iniciar sesión, ejecuta el backend y PostgreSQL siguiendo el README. No hay cuentas ni contraseñas de demostración.

```powershell
npm run lint --prefix frontend -- --deny-warnings
npm test --prefix frontend
npm run build --prefix frontend
npm run test:pwa --prefix frontend
npm run preview --prefix frontend -- --host 127.0.0.1
```

La PWA se genera solo con `build`; en desarrollo no se instala un service worker. La instalación y el modo offline requieren HTTPS o localhost, y una primera carga con internet. El alojamiento debe servir `index.html` para rutas del frontend y reenviar `/api` a ASP.NET Core. No se configuró GitHub Pages: sin esa adaptación no debe publicarse este BrowserRouter bajo `/BIIN/`.

## Revisión y validación

31 pruebas automatizadas: búsqueda con acentos y filtros, integridad del catálogo, traslados, margen de retorno, orden de actividades, almacenamiento dañado/lleno, edición y eliminación de borradores, selección vacía, flujo de generar itinerario y los dos casos de login existentes. Comprobación de recursos de PWA y simulación del fallback offline sin interceptar API ni mapas. Build TypeScript + Vite y lint sin avisos.

Pendiente: comparación visual real a 360 px y escritorio, auditoría Lighthouse, prueba de geolocalización y teselas en navegador, instalación/offline real, integración con API/PostgreSQL y revisión por la otra pareja. La revisión visual de esta sesión se bloqueó porque el navegador no pudo acceder al servidor local; no se considera aprobada. Los componentes usan tamaños adaptables y puntos de ruptura, pero eso no reemplaza la prueba visual.

Pendiente del MVP: endpoints de catálogo/favoritos/itinerarios y sincronización, IA, reportes de cupo, administración, recuperación de contraseña, login Google y datos validados. Los borradores locales públicos son una vista previa del frontend, no recursos privados de la cuenta. Los accesos de operador y administrador conservan la protección de roles y sus pantallas pendientes.

Implementación asistida con Codex. Los cambios no se atribuyen a los otros integrantes. No se modificó la planificación de Notion.
