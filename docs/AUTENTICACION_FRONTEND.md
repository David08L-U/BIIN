# Estado de acceso y registro en el frontend

El acceso con correo y el registro usan los servicios existentes `POST /api/auth/login` y `POST /api/auth/registro`. Ambos esperan una respuesta compatible con `AuthResponse` (`token`, `expiraEn` y `usuario`). La ruta protegida conserva el destino completo (`pathname`, búsqueda y hash) al enviar a Login; alternar Login/Registro preserva ese destino.

El contrato TypeScript actual de registro solo acepta `nombre`, `correo` y `contrasena`. El formulario pide nombre y apellido por separado y envía el nombre compuesto en `nombre`; el backend no expone un campo de apellido independiente, así que el frontend no puede afirmar que lo almacena por separado.

## Sesión y datos

El frontend conserva el JWT en `localStorage` bajo `biin.token`; no guarda la contraseña. Al iniciar la aplicación consulta `GET /api/auth/yo` con el token para restaurar la identidad. Una respuesta 401 elimina el token vencido/rechazado. Un error de red o del servidor conserva el token y bloquea el contenido protegido hasta poder reintentar o cerrar sesión; no se interpreta una interrupción como una sesión caducada. El JWT emitido expira según `Jwt:MinutosExpiracion` (120 minutos en la configuración incluida) y el backend valida su firma y vigencia.

El backend existente crea la cuenta en PostgreSQL, almacena el nombre completo, el correo normalizado, el hash BCrypt de la contraseña y la relación de rol viajero; nunca almacena la contraseña en texto claro. `GET /api/auth/yo` devuelve la identidad y roles asociados al token. Los itinerarios de Mi viaje siguen guardándose únicamente en el almacenamiento local separado por `idUsuario`; no se sincronizan con PostgreSQL.

Para ejecutar la API local se requiere `backend/src/Biin.Api/appsettings.Development.json` ignorado por Git, con `ConnectionStrings:Biin` apuntando a una base BIIN existente y `Jwt:Clave` de al menos 32 caracteres. Mantén esos valores locales y no los compartas ni los agregues al repositorio. PostgreSQL debe estar iniciado y la base/esquema de BIIN deben estar previamente provisionados por el proceso del equipo. Esta tarea no crea ni borra bases ni ejecuta scripts destructivos. El proxy de Vite espera la API en `http://localhost:5080`.

La prueba automatizada del flujo de identidad usa respuestas HTTP simuladas; no equivale a un registro ni inicio de sesión contra PostgreSQL. En el entorno revisado no está presente el archivo de configuración de desarrollo ni hay API escuchando en el puerto 5080, por lo que el flujo real queda pendiente de configurar y ejecutar localmente.

## Integraciones pendientes

- **Google:** no existe una integración de proveedor en el frontend ni un contrato de autenticación de Google documentado en el repositorio. La acción informa que está pendiente y no solicita credenciales, abre OAuth ni crea una sesión. Para completarla se necesitan el flujo y callback aprobados por el backend, el origen/redirect URI por entorno y la forma de canjear el resultado por la respuesta `AuthResponse`; cualquier secreto de proveedor debe permanecer fuera del bundle del navegador.
- **Recuperación de contraseña:** no existe una operación de API para solicitar o confirmar recuperación. La acción comunica el estado pendiente y no afirma haber enviado correo. El servicio futuro debe definir endpoint, payload, expiración y validación del token, mensajes de resultado y respuestas que no revelen si una cuenta está registrada.

No se modificaron autenticación, API, backend ni base de datos para mostrar estas acciones.
