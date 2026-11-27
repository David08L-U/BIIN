-- BIIN: datos de DEMOSTRACIÓN (referencia aproximada) para Izamal, Valladolid, Tekit y Ticul
-- Complementa database/seed/demo/001_homun.sql.
-- IMPORTANTE: Las tarifas y horarios son valores aproximados de referencia para pruebas y desarrollo;
-- deben verificarse con operadores/stakeholders o ajustarse desde /api/admin/rutas/{idRuta}/tarifas.
-- Todo lo demostrativo lleva "[DEMO]" en el título/dirección y "DEMO-" en el código de ruta.
-- Se borra limpiamente con database/seed/demo/999_borrar_demo.sql

DO $$
DECLARE
    v_creador   integer;

    v_mun_mer integer; v_mun_aca integer;
    v_mun_tix integer; v_mun_hoc integer; v_mun_iza integer;
    v_mun_kan integer; v_mun_tin integer; v_mun_val integer;
    v_mun_tec integer; v_mun_tek integer;
    v_mun_uma integer; v_mun_mun integer; v_mun_tic integer;

    v_loc_mer integer; v_loc_aca integer;
    v_loc_tix integer; v_loc_hoc integer; v_loc_iza integer;
    v_loc_kan integer; v_loc_pis integer; v_loc_val integer;
    v_loc_tec integer; v_loc_tek integer;
    v_loc_uma integer; v_loc_mun integer; v_loc_tic integer;

    v_ub_mer_nor integer; v_ub_mer_sur integer; v_ub_mer_ori integer;
    v_ub_tix integer; v_ub_hoc integer; v_ub_iza integer;
    v_ub_kan integer; v_ub_pis integer; v_ub_val integer;
    v_ub_aca integer; v_ub_tec integer; v_ub_tek integer;
    v_ub_uma integer; v_ub_mun integer; v_ub_tic integer;

    v_iza_ida integer; v_iza_reg integer;
    v_val_ida integer; v_val_reg integer;
    v_tek_ida integer; v_tek_reg integer;
    v_tic_ida integer; v_tic_reg integer;
BEGIN
    IF EXISTS (SELECT 1 FROM rutas WHERE codigo = 'DEMO-MER-IZA') THEN
        RAISE NOTICE 'Las rutas y tarifas de referencia DEMO ya están cargadas; no se hace nada.';
        RETURN;
    END IF;

    -- Reutiliza la cuenta inactiva demo@biin.test (o la crea si este script se ejecuta solo)
    SELECT id_usuario INTO v_creador FROM usuarios WHERE correo = 'demo@biin.test';
    IF v_creador IS NULL THEN
        INSERT INTO usuarios (nombre, correo, hash_contrasena, activo)
        VALUES ('Datos de demostración', 'demo@biin.test', crypt(gen_random_uuid()::text, gen_salt('bf', 11)), false)
        RETURNING id_usuario INTO v_creador;
    END IF;

    -- Municipios (claves INEGI de Yucatán)
    INSERT INTO municipios (codigo, nombre) VALUES
        ('050', 'Mérida'),
        ('002', 'Acanceh'),
        ('093', 'Tixkokob'),
        ('034', 'Hoctún'),
        ('040', 'Izamal'),
        ('042', 'Kantunil'),
        ('091', 'Tinum'),
        ('102', 'Valladolid'),
        ('076', 'Tecoh'),
        ('080', 'Tekit'),
        ('101', 'Umán'),
        ('053', 'Muna'),
        ('089', 'Ticul')
    ON CONFLICT (codigo) DO NOTHING;

    SELECT id_municipio INTO v_mun_mer FROM municipios WHERE codigo = '050';
    SELECT id_municipio INTO v_mun_aca FROM municipios WHERE codigo = '002';
    SELECT id_municipio INTO v_mun_tix FROM municipios WHERE codigo = '093';
    SELECT id_municipio INTO v_mun_hoc FROM municipios WHERE codigo = '034';
    SELECT id_municipio INTO v_mun_iza FROM municipios WHERE codigo = '040';
    SELECT id_municipio INTO v_mun_kan FROM municipios WHERE codigo = '042';
    SELECT id_municipio INTO v_mun_tin FROM municipios WHERE codigo = '091';
    SELECT id_municipio INTO v_mun_val FROM municipios WHERE codigo = '102';
    SELECT id_municipio INTO v_mun_tec FROM municipios WHERE codigo = '076';
    SELECT id_municipio INTO v_mun_tek FROM municipios WHERE codigo = '080';
    SELECT id_municipio INTO v_mun_uma FROM municipios WHERE codigo = '101';
    SELECT id_municipio INTO v_mun_mun FROM municipios WHERE codigo = '053';
    SELECT id_municipio INTO v_mun_tic FROM municipios WHERE codigo = '089';

    -- Localidades
    INSERT INTO localidades (id_municipio, nombre) VALUES
        (v_mun_mer, 'Mérida'),
        (v_mun_aca, 'Acanceh'),
        (v_mun_tix, 'Tixkokob'),
        (v_mun_hoc, 'Hoctún'),
        (v_mun_iza, 'Izamal'),
        (v_mun_kan, 'Kantunil'),
        (v_mun_tin, 'Pisté'),
        (v_mun_val, 'Valladolid'),
        (v_mun_tec, 'Tecoh'),
        (v_mun_tek, 'Tekit'),
        (v_mun_uma, 'Umán'),
        (v_mun_mun, 'Muna'),
        (v_mun_tic, 'Ticul')
    ON CONFLICT DO NOTHING;

    SELECT id_localidad INTO v_loc_mer FROM localidades WHERE id_municipio = v_mun_mer AND nombre = 'Mérida';
    SELECT id_localidad INTO v_loc_aca FROM localidades WHERE id_municipio = v_mun_aca AND nombre = 'Acanceh';
    SELECT id_localidad INTO v_loc_tix FROM localidades WHERE id_municipio = v_mun_tix AND nombre = 'Tixkokob';
    SELECT id_localidad INTO v_loc_hoc FROM localidades WHERE id_municipio = v_mun_hoc AND nombre = 'Hoctún';
    SELECT id_localidad INTO v_loc_iza FROM localidades WHERE id_municipio = v_mun_iza AND nombre = 'Izamal';
    SELECT id_localidad INTO v_loc_kan FROM localidades WHERE id_municipio = v_mun_kan AND nombre = 'Kantunil';
    SELECT id_localidad INTO v_loc_pis FROM localidades WHERE id_municipio = v_mun_tin AND nombre = 'Pisté';
    SELECT id_localidad INTO v_loc_val FROM localidades WHERE id_municipio = v_mun_val AND nombre = 'Valladolid';
    SELECT id_localidad INTO v_loc_tec FROM localidades WHERE id_municipio = v_mun_tec AND nombre = 'Tecoh';
    SELECT id_localidad INTO v_loc_tek FROM localidades WHERE id_municipio = v_mun_tek AND nombre = 'Tekit';
    SELECT id_localidad INTO v_loc_uma FROM localidades WHERE id_municipio = v_mun_uma AND nombre = 'Umán';
    SELECT id_localidad INTO v_loc_mun FROM localidades WHERE id_municipio = v_mun_mun AND nombre = 'Muna';
    SELECT id_localidad INTO v_loc_tic FROM localidades WHERE id_municipio = v_mun_tic AND nombre = 'Ticul';

    -- Ubicaciones referenciales (pendientes de validación exacta de abordaje con operadores)
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_mer, '[DEMO] Terminal Noreste de Mérida (referencia Izamal)', 20.964700, -89.619400) RETURNING id_ubicacion INTO v_ub_mer_nor;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_mer, '[DEMO] Terminal de Segunda Clase / Calle 69 Mérida (referencia Valladolid)', 20.963100, -89.627200) RETURNING id_ubicacion INTO v_ub_mer_ori;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_mer, '[DEMO] Terminal del Sur / Zona Centro Mérida (referencia Tekit y Ticul)', 20.961800, -89.622900) RETURNING id_ubicacion INTO v_ub_mer_sur;

    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_tix, '[DEMO] Paradero centro de Tixkokob', 21.001400, -89.394400) RETURNING id_ubicacion INTO v_ub_tix;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_hoc, '[DEMO] Paradero carretera Hoctún', 20.854200, -89.200800) RETURNING id_ubicacion INTO v_ub_hoc;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_iza, '[DEMO] Terminal y centro de Izamal', 20.933300, -89.017800) RETURNING id_ubicacion INTO v_ub_iza;

    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_kan, '[DEMO] Paradero principal de Kantunil', 20.793600, -89.035300) RETURNING id_ubicacion INTO v_ub_kan;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_pis, '[DEMO] Paradero centro de Pisté', 20.698900, -88.587800) RETURNING id_ubicacion INTO v_ub_pis;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_val, '[DEMO] Terminal de Valladolid', 20.689600, -88.202200) RETURNING id_ubicacion INTO v_ub_val;

    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_aca, '[DEMO] Paradero Acanceh rumbo a Tekit', 20.813600, -89.452700) RETURNING id_ubicacion INTO v_ub_aca;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_tec, '[DEMO] Paradero plaza principal de Tecoh', 20.742200, -89.474400) RETURNING id_ubicacion INTO v_ub_tec;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_tek, '[DEMO] Paradero centro textil de Tekit', 20.531900, -89.335800) RETURNING id_ubicacion INTO v_ub_tek;

    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_uma, '[DEMO] Paradero carretera Umán', 20.882800, -89.748300) RETURNING id_ubicacion INTO v_ub_uma;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_mun, '[DEMO] Paradero centro de Muna', 20.486400, -89.713600) RETURNING id_ubicacion INTO v_ub_mun;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_tic, '[DEMO] Terminal centro de Ticul', 20.397800, -89.533900) RETURNING id_ubicacion INTO v_ub_tic;

    -- ============================================================
    -- 1. IZAMAL (Tarifa completa aproximada: $50 MXN)
    -- ============================================================
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('ruta', '[DEMO] Mérida a Izamal',
            'Ruta de referencia aproximada hacia Izamal por Tixkokob y Hoctún. Editable desde administración.',
            'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_iza_ida;
    INSERT INTO rutas (id_recurso, codigo) VALUES (v_iza_ida, 'DEMO-MER-IZA');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('ruta', '[DEMO] Izamal a Mérida',
            'Regreso de referencia aproximado desde Izamal hacia Mérida. Editable desde administración.',
            'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_iza_reg;
    INSERT INTO rutas (id_recurso, codigo) VALUES (v_iza_reg, 'DEMO-IZA-MER');

    INSERT INTO ruta_parada (id_ruta, orden, id_ubicacion, permite_abordar, permite_descender) VALUES
        (v_iza_ida, 1, v_ub_mer_nor, true, false),
        (v_iza_ida, 2, v_ub_tix, true, true),
        (v_iza_ida, 3, v_ub_hoc, true, true),
        (v_iza_ida, 4, v_ub_iza, false, true),
        (v_iza_reg, 1, v_ub_iza, true, false),
        (v_iza_reg, 2, v_ub_hoc, true, true),
        (v_iza_reg, 3, v_ub_tix, true, true),
        (v_iza_reg, 4, v_ub_mer_nor, false, true);

    INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde)
    SELECT r, o, d, m, DATE '2026-01-01'
    FROM unnest(ARRAY[v_iza_ida, v_iza_reg]) r,
         (VALUES (1, 4, 50.00), (1, 2, 18.00), (1, 3, 34.00), (2, 4, 34.00), (3, 4, 20.00)) AS t(o, d, m);

    -- ============================================================
    -- 2. VALLADOLID (Tarifa económica aproximada: $180 MXN)
    -- ============================================================
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('ruta', '[DEMO] Mérida a Valladolid',
            'Servicio regional económico de referencia hacia Valladolid por Kantunil y Pisté. Editable desde administración.',
            'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_val_ida;
    INSERT INTO rutas (id_recurso, codigo) VALUES (v_val_ida, 'DEMO-MER-VAL');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('ruta', '[DEMO] Valladolid a Mérida',
            'Regreso regional económico de referencia desde Valladolid hacia Mérida. Editable desde administración.',
            'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_val_reg;
    INSERT INTO rutas (id_recurso, codigo) VALUES (v_val_reg, 'DEMO-VAL-MER');

    INSERT INTO ruta_parada (id_ruta, orden, id_ubicacion, permite_abordar, permite_descender) VALUES
        (v_val_ida, 1, v_ub_mer_ori, true, false),
        (v_val_ida, 2, v_ub_kan, true, true),
        (v_val_ida, 3, v_ub_pis, true, true),
        (v_val_ida, 4, v_ub_val, false, true),
        (v_val_reg, 1, v_ub_val, true, false),
        (v_val_reg, 2, v_ub_pis, true, true),
        (v_val_reg, 3, v_ub_kan, true, true),
        (v_val_reg, 4, v_ub_mer_ori, false, true);

    INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde)
    SELECT r, o, d, m, DATE '2026-01-01'
    FROM unnest(ARRAY[v_val_ida, v_val_reg]) r,
         (VALUES (1, 4, 180.00), (1, 2, 55.00), (1, 3, 125.00), (2, 4, 130.00), (3, 4, 60.00)) AS t(o, d, m);

    -- ============================================================
    -- 3. TEKIT (Tarifa completa aproximada: $45 MXN)
    -- ============================================================
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('ruta', '[DEMO] Mérida a Tekit',
            'Ruta de referencia aproximada hacia Tekit por Acanceh y Tecoh. Editable desde administración.',
            'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_tek_ida;
    INSERT INTO rutas (id_recurso, codigo) VALUES (v_tek_ida, 'DEMO-MER-TEK');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('ruta', '[DEMO] Tekit a Mérida',
            'Regreso de referencia aproximado desde Tekit hacia Mérida. Editable desde administración.',
            'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_tek_reg;
    INSERT INTO rutas (id_recurso, codigo) VALUES (v_tek_reg, 'DEMO-TEK-MER');

    INSERT INTO ruta_parada (id_ruta, orden, id_ubicacion, permite_abordar, permite_descender) VALUES
        (v_tek_ida, 1, v_ub_mer_sur, true, false),
        (v_tek_ida, 2, v_ub_aca, true, true),
        (v_tek_ida, 3, v_ub_tec, true, true),
        (v_tek_ida, 4, v_ub_tek, false, true),
        (v_tek_reg, 1, v_ub_tek, true, false),
        (v_tek_reg, 2, v_ub_tec, true, true),
        (v_tek_reg, 3, v_ub_aca, true, true),
        (v_tek_reg, 4, v_ub_mer_sur, false, true);

    INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde)
    SELECT r, o, d, m, DATE '2026-01-01'
    FROM unnest(ARRAY[v_tek_ida, v_tek_reg]) r,
         (VALUES (1, 4, 45.00), (1, 2, 20.00), (1, 3, 30.00), (2, 4, 28.00), (3, 4, 18.00)) AS t(o, d, m);

    -- ============================================================
    -- 4. TICUL (Tarifa completa aproximada: $60 MXN)
    -- ============================================================
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('ruta', '[DEMO] Mérida a Ticul',
            'Ruta de referencia aproximada hacia Ticul por Umán y Muna. Editable desde administración.',
            'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_tic_ida;
    INSERT INTO rutas (id_recurso, codigo) VALUES (v_tic_ida, 'DEMO-MER-TIC');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('ruta', '[DEMO] Ticul a Mérida',
            'Regreso de referencia aproximado desde Ticul hacia Mérida. Editable desde administración.',
            'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_tic_reg;
    INSERT INTO rutas (id_recurso, codigo) VALUES (v_tic_reg, 'DEMO-TIC-MER');

    INSERT INTO ruta_parada (id_ruta, orden, id_ubicacion, permite_abordar, permite_descender) VALUES
        (v_tic_ida, 1, v_ub_mer_sur, true, false),
        (v_tic_ida, 2, v_ub_uma, true, true),
        (v_tic_ida, 3, v_ub_mun, true, true),
        (v_tic_ida, 4, v_ub_tic, false, true),
        (v_tic_reg, 1, v_ub_tic, true, false),
        (v_tic_reg, 2, v_ub_mun, true, true),
        (v_tic_reg, 3, v_ub_uma, true, true),
        (v_tic_reg, 4, v_ub_mer_sur, false, true);

    INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde)
    SELECT r, o, d, m, DATE '2026-01-01'
    FROM unnest(ARRAY[v_tic_ida, v_tic_reg]) r,
         (VALUES (1, 4, 60.00), (1, 2, 15.00), (1, 3, 42.00), (2, 4, 45.00), (3, 4, 22.00)) AS t(o, d, m);

    -- Trazos simplificados (paradas en orden) y horarios referenciales diarios
    INSERT INTO puntos_recorrido (id_ruta, orden, latitud, longitud)
    SELECT p.id_ruta, p.orden, u.latitud, u.longitud
    FROM ruta_parada p JOIN ubicaciones u ON u.id_ubicacion = p.id_ubicacion
    WHERE p.id_ruta IN (v_iza_ida, v_iza_reg, v_val_ida, v_val_reg, v_tek_ida, v_tek_reg, v_tic_ida, v_tic_reg);

    INSERT INTO horarios_ruta (id_ruta, dia_semana, hora_salida, vigente_desde)
    SELECT r, d, h::time, DATE '2026-01-01'
    FROM unnest(ARRAY[v_iza_ida, v_val_ida, v_tek_ida, v_tic_ida]) r,
         generate_series(0, 6) d,
         unnest(ARRAY['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00']) h;

    INSERT INTO horarios_ruta (id_ruta, dia_semana, hora_salida, vigente_desde)
    SELECT r, d, h::time, DATE '2026-01-01'
    FROM unnest(ARRAY[v_iza_reg, v_val_reg, v_tek_reg, v_tic_reg]) r,
         generate_series(0, 6) d,
         unnest(ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00']) h;

    RAISE NOTICE 'Rutas y tarifas DEMO de referencia (Izamal, Valladolid, Tekit y Ticul) cargadas.';
END
$$;
