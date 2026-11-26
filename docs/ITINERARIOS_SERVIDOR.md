# Itinerarios en el servidor

Los itinerarios guardados por sesión autenticada usan la tabla `itinerarios` existente. El JSONB `borrador` conserva la configuración completa del planificador (destino, modalidad, fecha, jornadas, horas, duración, lugares, selección y orden); `huella_plan` y un índice único parcial por usuario hacen idempotente la creación. Las operaciones obtienen al propietario de la identidad JWT y nunca aceptan un identificador de cuenta del navegador.

## Rutas

- `GET /api/itinerarios`: lista los itinerarios de la cuenta autenticada.
- `GET /api/itinerarios/anteriores`: identifica registros históricos propios sin `borrador` JSONB mediante nombre, fechas y cantidad de actividades. No los convierte ni permite editarlos.
- `POST /api/itinerarios`: crea un itinerario; una repetición exacta del mismo borrador devuelve el existente.
- `GET /api/itinerarios/{id}`: consulta un itinerario propio.
- `PUT /api/itinerarios/{id}`: actualiza el borrador propio sin cambiar su destino.
- `DELETE /api/itinerarios/{id}`: elimina únicamente el itinerario propio confirmado por el usuario.

Las lecturas o cambios de un registro de otra cuenta responden como no encontrado.

## Actualización incremental

Para una base ya existente, aplicar `database/schema/005_itinerarios_jsonb.sql` con un rol de migración autorizado. El script solo agrega columnas e índice; no recrea tablas ni elimina registros. `database/crear_bd.ps1` también lo incorpora al flujo de creación inicial. Los registros históricos que no tengan `borrador` permanecen intactos y se identifican en `GET /api/itinerarios/anteriores`; no se inventa un borrador para abrirlos.

## Datos locales

Los borradores y guardados locales anteriores permanecen en el navegador. Mi viaje ofrece importarlos a la cuenta activa; cada importación se confirma de forma independiente, el servidor evita duplicados y los originales locales no se eliminan si falla la petición. El almacenamiento local está separado por el identificador de cuenta de la sesión.

La prueba PostgreSQL de persistencia y aislamiento requiere una base de pruebas configurada y dos variables locales: `BIIN_TEST_CONNECTION_STRING` para la API como `biin_app` y `BIIN_TEST_FIXTURE_CONNECTION_STRING` para sembrar y limpiar sus propios usuarios en esa misma base aislada. Crea cuentas con correos `example.test` únicos y las elimina al terminar. No usar una cadena de producción ni la base normal para ejecutarla. `database/seguridad/002_permisos_itinerarios_app.sql` concede solo permisos de ejecución sobre la tabla de itinerarios en la base a la que se conecte; no cambia roles globales ni contraseñas.

## Estado de validación del avance

En el avance registrado el 26 de noviembre de 2026, backend compiló y pasó 7 pruebas unitarias; la prueba PostgreSQL quedó omitida porque no se configuró `BIIN_TEST_CONNECTION_STRING`. El frontend compiló y lint pasó. `npm test --prefix frontend` reportó 611 aprobadas y 11 fallidas, relacionadas con guardado/retorno del planificador, consulta en Mi viaje y descarga; por ello no se considera validado el flujo completo. La API local respondió correctamente en salud, pero esa comprobación no acredita persistencia de itinerarios, reinicio de API ni lectura desde otro navegador.

La corrección posterior conservó `generado` al guardar y restauró la apertura del editor personalizado desde Mi viaje. Las cinco suites de itinerarios aprobaron 129 pruebas y la suite completa pasó 622/622; lint y build también pasaron. El build conserva la advertencia de tamaño del bundle. La conexión local de `appsettings.Development.json` no coincide con la variable `ConnectionStrings__Biin` del proceso sano; usarla directamente produce SQLSTATE `28P01`.

### Validación PostgreSQL aislada

Se creó la base exclusiva `biin_itinerarios_test_20261126_96e9bafd`, sin modificar ni limpiar `biin`. Se ejecutaron sobre ella `001_esquema.sql`, `002_ampliaciones_mvp.sql`, `003_busqueda.sql`, `004_vistas.sql`, `005_itinerarios_jsonb.sql`, los triggers y el seed de catálogos. La prueba de integración pasó contra PostgreSQL real: crear, listar, consultar, editar, eliminar, repetir la importación sin duplicados, aislar dos cuentas y recuperar el itinerario desde una nueva instancia de API. Los usuarios de prueba se eliminan al final; la base aislada permanece disponible.

La configuración efectiva de la API no se incorporó al repositorio. Para la prueba aislada se usó la conexión administrativa local solo dentro del proceso de prueba; no se imprimió ni guardó su contraseña. El host de prueba ahora proporciona explícitamente su cadena, JWT de prueba y emisores mediante `UseSetting`.

La comprobación visual con dos sesiones independientes del navegador todavía está pendiente: no había una herramienta de navegador disponible en este entorno. La prueba de integración anterior usa clientes HTTP autenticados separados y una API reiniciada, por lo que no equivale a una prueba de la interfaz en navegadores distintos.
