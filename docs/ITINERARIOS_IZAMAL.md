# Itinerarios de Izamal — CU-09 / RF09

Implementación provisional en `frontend/src/features/mi-viaje`. El backend actual
contiene entidades de itinerario, pero todavía no ofrece un servicio HTTP utilizable.
No se modificaron autenticación, permisos ni tablas.

- `/rutas/izamal/itinerario`: configuración y generación recomendada o resultado personalizado.
- `/rutas/izamal/personalizar`: selección inicialmente vacía, filtros y generación.
- `/mi-viaje`: listado local bajo la protección de sesión existente.

La URL conserva el borrador: estancia, fecha, inicio, minutos, modo, lugares y estado
de generación. Se mantiene al recargar, volver al detalle y retornar desde login.
Un cambio de configuración o selección elimina la marca de generación. No se
conserva un resultado desactualizado. Los enlaces compartidos contienen la fecha,
hora y lugares del plan, pero no datos de cuenta ni tokens.

Los nueve lugares y sus descripciones proceden del selector de Melanie. Se usan
las duraciones de ese selector; la pantalla de itinerario original tenía otras
duraciones fijas, que aquí se sustituyen por el cálculo. Cada visita incluye un
desplazamiento de demostración según su tarjeta, más 5 minutos de desplazamiento
final del prototipo y 15 minutos de margen final. Estos tiempos no validan
distancias, aperturas ni una ruta geográfica. El orden recomendado es editorial;
se añade cada lugar completo solo si cabe. El orden personalizado sigue la selección.

Fecha y hora se construyen en la zona local del navegador, y los bloques suman
minutos enteros transcurridos. Se rechazan fechas inexistentes, horas inválidas
(incluidos saltos de horario local) y duraciones fuera de 15–720 minutos.
El regreso es un objetivo elegido por el usuario, sin reserva ni salida confirmada.

El guardado usa `localStorage`, clave `biin:itinerarios:v1:<idUsuario>`. Guarda
versión, identificador, fecha de guardado y borrador; el resultado se recalcula al
abrirlo. La identidad del plan evita duplicados con la misma fecha, hora, duración
y secuencia de visitas. Se valida el contenido al leerlo; los datos dañados se
informan y no se sobrescriben. Un error de lectura o escritura no impide preparar
una vista previa y nunca se presenta como un guardado exitoso.

El aislamiento local por cuenta no sustituye autorización del servidor ni cifra
datos del navegador. No hay sincronización, caché de imágenes ni garantía offline.
Si se abre un enlace en otra zona horaria, sus horas se interpretan en esa zona local.

Verificación pendiente a cargo del revisor: `npm test --prefix frontend`,
`npm run lint --prefix frontend`, `npm run build --prefix frontend` y revisión
visual a 360, 393 y 480 px. No se ejecutaron estos comandos durante la implementación.
