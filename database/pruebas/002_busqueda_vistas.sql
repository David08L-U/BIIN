-- BIIN: prueba la búsqueda sin acentos y las vistas, sin dejar datos
-- Ejecutar: psql -U postgres -d biin -f database/pruebas/002_busqueda_vistas.sql

BEGIN;

-- Datos de prueba ficticios (Homún como ejemplo); se deshacen al final
INSERT INTO usuarios (id_usuario, nombre, correo, hash_contrasena)
VALUES (9101, 'Operador Prueba', 'op.vistas@prueba.test', 'x');
INSERT INTO municipios (id_municipio, codigo, nombre) VALUES (9101, 'T36', 'Homún'), (9102, 'T50', 'Mérida');
INSERT INTO localidades (id_localidad, id_municipio, nombre) VALUES (9101, 9101, 'Homún'), (9102, 9102, 'Mérida');
INSERT INTO ubicaciones (id_ubicacion, id_localidad, latitud, longitud)
VALUES (9101, 9102, 20.967, -89.623), (9102, 9101, 20.739, -89.285), (9103, 9101, 20.740, -89.280);
INSERT INTO recursos (id_recurso, tipo, titulo, estado_publicacion, id_creador) VALUES
    (9101, 'ruta',  'Prueba Mérida a Homún', 'publicado', 9101),
    (9102, 'lugar', 'Cenote de prueba',      'publicado', 9101),
    (9103, 'lugar', 'Lugar sin publicar',    'pendiente', 9101);
INSERT INTO rutas (id_recurso, codigo) VALUES (9101, 'PRUEBA-MER-HOM');
INSERT INTO ruta_parada (id_ruta, orden, id_ubicacion) VALUES (9101, 1, 9101), (9101, 2, 9102);
INSERT INTO lugares (id_recurso, id_ubicacion) VALUES (9102, 9103), (9103, 9103);
INSERT INTO unidades (id_unidad, identificador, capacidad) VALUES (9101, 'COMBI-PRUEBA', 15);
INSERT INTO salidas (id_salida, id_ruta, id_unidad, salida_programada, capacidad_habilitada)
VALUES (9101, 9101, 9101, now() + interval '1 hour', 15);
INSERT INTO operador_ruta (id_usuario, id_ruta) VALUES (9101, 9101);

CREATE TEMP TABLE resultados (caso text, ok boolean, detalle text) ON COMMIT DROP;

-- Búsqueda
INSERT INTO resultados
SELECT 'Buscar "homun" encuentra Homún', count(*) = 1, string_agg(nombre, ', ')
FROM localidades WHERE f_normalizar(nombre) LIKE '%' || f_normalizar('homun') || '%';

INSERT INTO resultados
SELECT 'Buscar "MERIDA" encuentra Mérida', count(*) = 1, string_agg(nombre, ', ')
FROM localidades WHERE f_normalizar(nombre) LIKE '%' || f_normalizar('MERIDA') || '%';

INSERT INTO resultados
SELECT 'Buscar con error "omun" sugiere Homún primero', nombre = 'Homún', nombre
FROM localidades ORDER BY similarity(f_normalizar(nombre), f_normalizar('omun')) DESC LIMIT 1;

-- v_recursos_publicados
INSERT INTO resultados
SELECT 'Solo muestra lo publicado', count(*) = 2, string_agg(titulo, ', ' ORDER BY titulo)
FROM v_recursos_publicados WHERE id_recurso BETWEEN 9101 AND 9103;

INSERT INTO resultados
SELECT 'La ruta toma el municipio de su primera parada', municipio = 'Mérida', municipio
FROM v_recursos_publicados WHERE id_recurso = 9101;

-- v_paradas_ruta
INSERT INTO resultados
SELECT 'Paradas en orden con su localidad', string_agg(localidad, ' > ' ORDER BY orden) = 'Mérida > Homún',
       string_agg(localidad, ' > ' ORDER BY orden)
FROM v_paradas_ruta WHERE id_ruta = 9101;

-- v_cupo_vigente
INSERT INTO resultados
SELECT 'Sin reporte el cupo es no_confirmado', estado_cupo = 'no_confirmado', estado_cupo
FROM v_cupo_vigente WHERE id_salida = 9101;

INSERT INTO reportes_cupo (id_salida, id_autor, asientos_disponibles, registrado_en, valido_hasta)
VALUES (9101, 9101, 4, now() - interval '2 hours', now() - interval '1 hour');
INSERT INTO resultados
SELECT 'Un reporte vencido sigue siendo no_confirmado', estado_cupo = 'no_confirmado', estado_cupo
FROM v_cupo_vigente WHERE id_salida = 9101;

INSERT INTO reportes_cupo (id_salida, id_autor, asientos_disponibles, valido_hasta)
VALUES (9101, 9101, 7, now() + interval '30 minutes');
INSERT INTO resultados
SELECT 'Con reporte vigente muestra sus asientos', estado_cupo = 'vigente' AND asientos_disponibles = 7,
       estado_cupo || ', ' || asientos_disponibles || ' asientos'
FROM v_cupo_vigente WHERE id_salida = 9101;

SELECT caso, CASE WHEN ok THEN 'ok' ELSE 'FALLO' END AS resultado, detalle FROM resultados;
SELECT count(*) FILTER (WHERE NOT ok) AS fallos, count(*) AS total FROM resultados;

ROLLBACK;
