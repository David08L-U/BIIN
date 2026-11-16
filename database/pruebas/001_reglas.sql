-- BIIN: prueba llaves, restricciones y triggers sin dejar datos
-- Ejecutar: psql -U postgres -d biin -f database/pruebas/001_reglas.sql
-- Todo corre dentro de una transacción que al final se deshace.

BEGIN;

-- Datos mínimos de prueba, claramente ficticios
INSERT INTO usuarios (id_usuario, nombre, correo, hash_contrasena)
VALUES (9001, 'Operador Prueba', 'operador@prueba.test', 'x'),
       (9002, 'Otro Usuario', 'otro@prueba.test', 'x');
INSERT INTO municipios (id_municipio, codigo, nombre) VALUES (9001, 'T01', 'Municipio Prueba');
INSERT INTO localidades (id_localidad, id_municipio, nombre) VALUES (9001, 9001, 'Localidad Prueba');
INSERT INTO ubicaciones (id_ubicacion, id_localidad, latitud, longitud)
VALUES (9001, 9001, 20.97, -89.62), (9002, 9001, 20.50, -89.50);
INSERT INTO recursos (id_recurso, tipo, titulo, id_creador)
VALUES (9001, 'ruta', 'Ruta Prueba', 9001), (9002, 'negocio', 'Negocio Prueba', 9001);
INSERT INTO rutas (id_recurso, codigo) VALUES (9001, 'PRUEBA-1');
INSERT INTO ruta_parada (id_ruta, orden, id_ubicacion) VALUES (9001, 1, 9001), (9001, 2, 9002);
INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde, vigente_hasta)
VALUES (9001, 1, 2, 35, '2026-01-01', '2026-12-31');
INSERT INTO unidades (id_unidad, identificador, capacidad) VALUES (9001, 'COMBI-PRUEBA', 15);
INSERT INTO salidas (id_salida, id_ruta, id_unidad, salida_programada, capacidad_habilitada)
VALUES (9001, 9001, 9001, '2026-12-01 08:00-06', 15);
INSERT INTO operador_ruta (id_usuario, id_ruta) VALUES (9001, 9001);

-- Cada caso debe fallar; si alguno pasa, la prueba lo reporta
CREATE TEMP TABLE resultados (caso text, resultado text) ON COMMIT DROP;

CREATE FUNCTION pg_temp.debe_fallar(caso text, sentencia text) RETURNS void AS $$
BEGIN
    BEGIN
        EXECUTE sentencia;
        INSERT INTO resultados VALUES (caso, 'FALLO: se permitió');
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO resultados VALUES (caso, 'ok: ' || SQLERRM);
    END;
END;
$$ LANGUAGE plpgsql;

SELECT pg_temp.debe_fallar('Correo repetido sin importar mayúsculas',
    $q$INSERT INTO usuarios (nombre, correo, hash_contrasena) VALUES ('X', 'OPERADOR@prueba.test', 'x')$q$);
SELECT pg_temp.debe_fallar('Latitud fuera de rango',
    $q$INSERT INTO ubicaciones (id_localidad, latitud, longitud) VALUES (9001, 95, -89)$q$);
SELECT pg_temp.debe_fallar('Estado de publicación inválido',
    $q$UPDATE recursos SET estado_publicacion = 'borrado' WHERE id_recurso = 9001$q$);
SELECT pg_temp.debe_fallar('Detalle que no coincide con el tipo',
    $q$INSERT INTO lugares (id_recurso, id_ubicacion) VALUES (9002, 9001)$q$);
SELECT pg_temp.debe_fallar('Horario de visita en una ruta',
    $q$INSERT INTO horarios_visita (id_recurso, dia_semana, hora_apertura, hora_cierre) VALUES (9001, 1, '09:00', '18:00')$q$);
SELECT pg_temp.debe_fallar('Día de la semana fuera de 0 a 6',
    $q$INSERT INTO horarios_ruta (id_ruta, dia_semana, hora_salida, vigente_desde) VALUES (9001, 7, '08:00', '2026-01-01')$q$);
SELECT pg_temp.debe_fallar('Tarifa con destino antes del origen',
    $q$INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde) VALUES (9001, 2, 1, 35, '2027-01-01')$q$);
SELECT pg_temp.debe_fallar('Tarifa con parada inexistente',
    $q$INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde) VALUES (9001, 1, 5, 35, '2027-01-01')$q$);
SELECT pg_temp.debe_fallar('Tarifas vigentes encimadas en el mismo tramo',
    $q$INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde) VALUES (9001, 1, 2, 40, '2026-06-01')$q$);
SELECT pg_temp.debe_fallar('Monto negativo',
    $q$INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde) VALUES (9001, 1, 2, -1, '2028-01-01')$q$);
SELECT pg_temp.debe_fallar('Cupo mayor a la capacidad de la salida',
    $q$INSERT INTO reportes_cupo (id_salida, id_autor, asientos_disponibles, valido_hasta) VALUES (9001, 9001, 20, now() + interval '30 minutes')$q$);
SELECT pg_temp.debe_fallar('Reporte de un usuario que no opera la ruta',
    $q$INSERT INTO reportes_cupo (id_salida, id_autor, asientos_disponibles, valido_hasta) VALUES (9001, 9002, 5, now() + interval '30 minutes')$q$);
SELECT pg_temp.debe_fallar('Borrar una ruta con paradas',
    $q$DELETE FROM recursos WHERE id_recurso = 9001$q$);

-- Casos válidos que sí deben pasar
INSERT INTO reportes_cupo (id_salida, id_autor, asientos_disponibles, valido_hasta)
VALUES (9001, 9001, 5, now() + interval '30 minutes');
INSERT INTO resultados VALUES ('Reporte de cupo válido', 'ok: se registró');
INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde)
VALUES (9001, 1, 2, 40, '2027-01-01');
INSERT INTO resultados VALUES ('Tarifa nueva después de la anterior', 'ok: se registró');

SELECT caso, resultado FROM resultados;
SELECT count(*) FILTER (WHERE resultado LIKE 'FALLO%') AS fallos, count(*) AS total FROM resultados;

ROLLBACK;
