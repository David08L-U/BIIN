# Itinerarios en el servidor

Los itinerarios guardados por sesión autenticada usan la tabla `itinerarios` existente. El JSONB `borrador` conserva la configuración completa del planificador (destino, modalidad, fecha, jornadas, horas, duración, lugares, selección y orden); `huella_plan` y un índice único parcial por usuario hacen idempotente la creación. Las operaciones obtienen al propietario de la identidad JWT y nunca aceptan un identificador de cuenta del navegador.

## Rutas

- `GET /api/itinerarios`: lista los itinerarios de la cuenta autenticada.
- `POST /api/itinerarios`: crea un itinerario; una repetición exacta del mismo borrador devuelve el existente.
- `GET /api/itinerarios/{id}`: consulta un itinerario propio.
- `PUT /api/itinerarios/{id}`: actualiza el borrador propio sin cambiar su destino.
- `DELETE /api/itinerarios/{id}`: elimina únicamente el itinerario propio confirmado por el usuario.

Las lecturas o cambios de un registro de otra cuenta responden como no encontrado.

## Actualización incremental

Para una base ya existente, aplicar `database/schema/005_itinerarios_jsonb.sql` con un rol de migración autorizado. El script solo agrega columnas e índice; no recrea tablas ni elimina registros. `database/crear_bd.ps1` también lo incorpora al flujo de creación inicial. Los registros históricos que no tengan `borrador` permanecen intactos y no aparecen en estos endpoints hasta que se migren explícitamente desde los datos históricos.

## Datos locales

Los borradores y guardados locales anteriores permanecen en el navegador. Mi viaje ofrece importarlos a la cuenta activa; cada importación se confirma de forma independiente, el servidor evita duplicados y los originales locales no se eliminan si falla la petición. El almacenamiento local está separado por el identificador de cuenta de la sesión.

La prueba PostgreSQL de persistencia y aislamiento requiere una base de pruebas configurada y `BIIN_TEST_CONNECTION_STRING`; crea cuentas con correos `example.test` únicos y las elimina al terminar. No usar una cadena de producción para ejecutarla.

## Estado de validación del avance

En el avance registrado el 26 de noviembre de 2026, backend compiló y pasó 7 pruebas unitarias; la prueba PostgreSQL quedó omitida porque no se configuró `BIIN_TEST_CONNECTION_STRING`. El frontend compiló y lint pasó. `npm test --prefix frontend` reportó 611 aprobadas y 11 fallidas, relacionadas con guardado/retorno del planificador, consulta en Mi viaje y descarga; por ello no se considera validado el flujo completo. La API local respondió correctamente en salud, pero esa comprobación no acredita persistencia de itinerarios, reinicio de API ni lectura desde otro navegador.

La corrección posterior conservó `generado` al guardar y restauró la apertura del editor personalizado desde Mi viaje. Las cinco suites de itinerarios aprobaron 129 pruebas y la suite completa pasó 622/622; lint y build también pasaron. El build conserva la advertencia de tamaño del bundle. Al intentar ejecutar la prueba PostgreSQL con `ConnectionStrings:Biin` del archivo local, Npgsql respondió SQLSTATE `28P01` (autenticación rechazada para `biin_app`); el archivo local no coincide con la configuración efectiva de la API sana. No se considera realizada la prueba de persistencia, reinicio ni segunda sesión hasta disponer de una conexión de pruebas válida.
