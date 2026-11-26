# Revisión del frontend de BIIN

La revisión cubre la navegación y los flujos de la rama
`feature/melanie-frontend`. Los datos de operación de los destinos siguen
procediendo del prototipo. El mapa de Inicio muestra la ubicación del
dispositivo solamente tras recibir una lectura del navegador.

## Estado de los flujos

- Acceso y registro validan los campos y conservan el destino de retorno. Las
  pruebas verifican la interfaz y el contrato esperado con dobles de prueba.
- Inicio y Rutas permiten buscar y filtrar destinos. Los cinco detalles
  conservan sus datos, favoritos locales y enlaces al planificador.
- Los modos recomendado y personalizado conservan fecha, horas, minutos,
  jornadas, selección, cálculo e invalidación al editar. La URL conserva el
  borrador. Las pruebas cubren enlaces anteriores y retorno tras el acceso.
- Mi viaje y Perfil leen itinerarios guardados por cuenta en este navegador.
  La suite comprueba estados vacíos, reapertura, aislamiento entre cuentas y
  ausencia de duplicados. Valladolid, Tekit, Homún y Ticul descargan el
  recorrido completo en texto. Izamal ofrece un enlace del plan.
- La ubicación se verifica con posiciones simuladas. La lectura de un
  dispositivo real queda pendiente. Kinich Kakmó mantiene el recurso
  accesible de imagen ausente hasta contar con una fotografía autorizada.

Edge cubrió 84 combinaciones de pantalla y ancho a 360, 393, 480 y 1366 px.
Se revisaron Inicio, catálogo, los cinco detalles, recomendado y personalizado,
Login, Registro, la ruta desconocida y la vista previa de Perfil. Se verificaron
ancho de página, foco visible en el formulario de acceso, tipografías,
controles finales y la posición del marcador simulado frente a los paneles.
Las vistas autenticadas de Mi viaje y Perfil quedan pendientes de una sesión real.

## Integraciones de servicio

| Pantalla y acción | Datos necesarios | Servicio o contrato existente | Estado del frontend |
|---|---|---|---|
| Login, Registro y Perfil. Entrar, crear cuenta y recuperar identidad | Credenciales, token, identidad y roles | `POST /api/auth/login`, `POST /api/auth/registro`, `GET /api/auth/yo` | Implementado en la interfaz. La revisión local no tuvo un servicio escuchando en `localhost:5080` para verificar una sesión real. |
| Perfil. Editar cuenta, preferencias y contactar a asistencia | Nombre, contacto, avatar, preferencias y solicitudes | `auth/yo` da lectura de identidad. No hay contrato HTTP de edición, preferencias o asistencia en el repositorio | Las acciones muestran el estado pendiente. |
| Perfil. Movilidad e historial | Viajes realizados, fechas, origen, destino y ruta | No hay contrato HTTP de historial de viajes | Métricas y último trayecto se muestran sin datos. |
| Catálogo y detalles. Consultar operación y sincronizar favoritos | Rutas, paradas, terminales, tarifas, horarios, cupo y favoritos de cuenta | El esquema tiene entidades de rutas, salidas, reportes y favoritos. No hay endpoints HTTP de consulta o sincronización | Datos del prototipo y favoritos del navegador. |
| Planificador y Mi viaje. Sincronizar planes | Borradores, jornadas, actividades y cuenta propietaria | El esquema tiene itinerarios y actividades. No hay contrato HTTP de sincronización | Cálculo, guardado y reapertura locales. |
| Explorar, Recorridos sugeridos y Asistente. Consultar recomendaciones | Lugares, eventos, negocios, horarios y recorridos validados | El esquema tiene recursos y recorridos. No hay endpoints HTTP de consulta ni asistente | Pantallas en construcción. |
| Reportar cupo y Administración. Operar y validar datos | Roles, salidas, unidades, reportes y bitácora | La identidad y roles vienen de `auth/yo`. No hay endpoints HTTP de operación o moderación | Rutas protegidas con pantallas en construcción. |
