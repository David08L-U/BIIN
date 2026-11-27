# Perfil de usuario — frontend

> Documento histórico del prototipo anterior. La implementación vigente en `feature/aaron-mejoras` se describe en [FRONTEND_DINAMICO_API.md](FRONTEND_DINAMICO_API.md); sus catálogos locales y páginas por pueblo ya no se utilizan.

## Alcance

CU-01 / CU-09 / RNF02 / RNF06. La pantalla reproduce la composición de `biin_mi_perfil_de_usuario/code.html` del prototipo de Melanie: cabecera, identidad, tres métricas, último trayecto, dos itinerarios recientes y acciones de cuenta. Conserva los colores y las familias tipográficas del frontend.

`/perfil` continúa dentro de `RutaProtegida`. La identidad procede del contexto de autenticación existente; no se han cambiado contratos de API, servicios del backend ni la base de datos.

## Datos reales y estados pendientes

- Se usan el nombre y correo de la cuenta actual. Al no existir teléfono, avatar ni acreditación de verificación en el contrato actual, se muestra una alternativa de iniciales, teléfono no disponible y la etiqueta «Cuenta BIIN».
- Las tres métricas se muestran sin datos y no se deducen de los itinerarios guardados. Preparar o guardar un plan no demuestra que el viaje se haya realizado.
- El último trayecto tiene un estado vacío hasta contar con un historial real.
- Se leen, sin escribir, los dos itinerarios locales más recientes de la cuenta actual. Se conservan el destino, la configuración y la fecha de guardado. «Gestionar» abre Mi viaje.
- Los fallos del almacenamiento se anuncian sin borrar ni sobrescribir los datos.
- Cerrar sesión utiliza la acción existente del contexto y vuelve al acceso.
- Editar perfil, historial, preferencias y asistencia presentan un aviso accesible de integración pendiente. No afirman guardar datos, cambiar ajustes ni enviar solicitudes.

## Vista previa sin backend

Con `npm run dev --prefix frontend`, abrir `http://localhost:5173/vista-previa/perfil`.

La ruta se registra exclusivamente con `import.meta.env.DEV`. Su encabezado indica que los datos son demostrativos; utiliza ejemplos del prototipo para revisar la composición completa. No crea una sesión, no genera tokens, no lee los itinerarios de una cuenta y no escribe en el almacenamiento. La navegación inferior contiene una sola barra con Perfil activo.

La vista previa no existe en el build de producción. El build no debe incluir la identidad ni el avatar de la demostración. La ruta normal `/perfil` requiere una sesión real.

## Verificación

- Pruebas de identidad, protección, carga de sesión y estados vacíos.
- Lectura de los cinco destinos, configuración de enlaces y aislamiento de cuentas.
- Orden de los guardados, datos dañados y almacenamiento bloqueado.
- Acciones por teclado, avisos pendientes, cierre de sesión y alternativa al avatar.
- Vista previa sin cambios en sesión ni almacenamiento.

Comandos: `npm test --prefix frontend`, `npm run lint --prefix frontend -- --deny-warnings`, `npm run build --prefix frontend` y `git diff --check`.

Comparar visualmente la vista previa con el prototipo a 360, 393 y 480 px antes de cerrar la revisión visual. Revisar nombres y correos largos, orden de foco y acceso al botón final por encima de la navegación inferior.
