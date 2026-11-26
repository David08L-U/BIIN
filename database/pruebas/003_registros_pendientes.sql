-- BIIN: prueba las reglas de registros_pendientes (confirmación de correo, RF01), sin dejar datos
-- Ejecutar: psql -U postgres -d biin -f database/pruebas/003_registros_pendientes.sql

BEGIN;

INSERT INTO registros_pendientes (nombre, correo, hash_contrasena, hash_codigo, expira_en)
VALUES ('Viajera Pendiente', 'pendiente@prueba.test', 'x', 'y', now() + interval '15 minutes');

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

SELECT pg_temp.debe_fallar('Un solo pendiente por correo sin importar mayúsculas',
    $q$INSERT INTO registros_pendientes (nombre, correo, hash_contrasena, hash_codigo, expira_en)
       VALUES ('Otra', 'PENDIENTE@prueba.test', 'x', 'y', now() + interval '15 minutes')$q$);

SELECT pg_temp.debe_fallar('El código no puede caducar antes de enviarse',
    $q$INSERT INTO registros_pendientes (nombre, correo, hash_contrasena, hash_codigo, enviado_en, expira_en)
       VALUES ('Caduca', 'caduca@prueba.test', 'x', 'y', now(), now() - interval '1 minute')$q$);

SELECT pg_temp.debe_fallar('Los intentos no pueden ser negativos',
    $q$UPDATE registros_pendientes SET intentos = -1 WHERE correo = 'pendiente@prueba.test'$q$);

SELECT pg_temp.debe_fallar('El código es obligatorio',
    $q$INSERT INTO registros_pendientes (nombre, correo, hash_contrasena, expira_en)
       VALUES ('Sin codigo', 'sincodigo@prueba.test', 'x', now() + interval '15 minutes')$q$);

-- Un registro pendiente no ocupa el correo en usuarios: la cuenta se crea al confirmar
INSERT INTO usuarios (nombre, correo, hash_contrasena) VALUES ('Viajera Pendiente', 'pendiente@prueba.test', 'x');
INSERT INTO resultados VALUES ('Confirmar crea el usuario aunque exista el pendiente', 'ok: se registró');

UPDATE registros_pendientes SET intentos = intentos + 1 WHERE correo = 'pendiente@prueba.test';
INSERT INTO resultados
SELECT 'Los intentos fallidos se cuentan', CASE WHEN intentos = 1 THEN 'ok: 1 intento' ELSE 'FALLO: ' || intentos END
FROM registros_pendientes WHERE correo = 'pendiente@prueba.test';

SELECT caso, resultado FROM resultados;
SELECT count(*) FILTER (WHERE resultado LIKE 'FALLO%') AS fallos, count(*) AS total FROM resultados;

ROLLBACK;
