# Estado de acceso y registro en el frontend

El acceso con correo y el registro usan los servicios existentes `POST /api/auth/login` y `POST /api/auth/registro`. Ambos esperan una respuesta compatible con `AuthResponse` (`token`, `expiraEn` y `usuario`). La ruta protegida conserva el destino completo (`pathname`, búsqueda y hash) al enviar a Login; alternar Login/Registro preserva ese destino.

El contrato TypeScript actual de registro solo acepta `nombre`, `correo` y `contrasena`. El formulario pide nombre y apellido por separado y envía el nombre compuesto en `nombre`; el backend no expone un campo de apellido independiente, así que el frontend no puede afirmar que lo almacena por separado.

## Integraciones pendientes

- **Google:** no existe una integración de proveedor en el frontend ni un contrato de autenticación de Google documentado en el repositorio. La acción informa que está pendiente y no solicita credenciales, abre OAuth ni crea una sesión. Para completarla se necesitan el flujo y callback aprobados por el backend, el origen/redirect URI por entorno y la forma de canjear el resultado por la respuesta `AuthResponse`; cualquier secreto de proveedor debe permanecer fuera del bundle del navegador.
- **Recuperación de contraseña:** no existe una operación de API para solicitar o confirmar recuperación. La acción comunica el estado pendiente y no afirma haber enviado correo. El servicio futuro debe definir endpoint, payload, expiración y validación del token, mensajes de resultado y respuestas que no revelen si una cuenta está registrada.

No se modificaron autenticación, API, backend ni base de datos para mostrar estas acciones.
