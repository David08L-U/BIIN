-- BIIN: recorridos sugeridos de DEMOSTRACIÓN para Izamal, Valladolid, Tekit y Ticul (CU-13)
-- Complementa 001_homun.sql y 002_rutas_tarifas_referencia.sql.
-- Todos los títulos y referencias llevan "[DEMO]" y se eliminan con 999_borrar_demo.sql.
-- Editables posteriormente desde /api/admin/recorridos.

DO $$
DECLARE
    v_creador integer;

    v_loc_iza integer; v_loc_val integer; v_loc_tek integer; v_loc_tic integer;

    v_r_iza_ida integer; v_r_iza_reg integer;
    v_r_val_ida integer; v_r_val_reg integer;
    v_r_tek_ida integer; v_r_tek_reg integer;
    v_r_tic_ida integer; v_r_tic_reg integer;

    v_ub_iza_conv integer; v_ub_iza_com integer;
    v_ub_val_zaci integer; v_ub_val_calz integer; v_ub_val_com integer;
    v_ub_tek_tall integer; v_ub_tek_com integer;
    v_ub_tic_alfa integer; v_ub_tic_calz integer; v_ub_tic_com integer;

    v_rec_iza_conv integer; v_rec_iza_com integer;
    v_rec_val_zaci integer; v_rec_val_calz integer; v_rec_val_com integer;
    v_rec_tek_tall integer; v_rec_tek_com integer;
    v_rec_tic_alfa integer; v_rec_tic_calz integer; v_rec_tic_com integer;

    v_recorrido integer;
BEGIN
    IF EXISTS (SELECT 1 FROM recorridos_sugeridos WHERE titulo = '[DEMO] Pueblo Mágico en Izamal') THEN
        RAISE NOTICE 'Los recorridos DEMO de referencia ya están cargados; no se hace nada.';
        RETURN;
    END IF;

    SELECT id_usuario INTO v_creador FROM usuarios WHERE correo = 'demo@biin.test';
    SELECT id_recurso INTO v_r_iza_ida FROM rutas WHERE codigo = 'DEMO-MER-IZA';
    SELECT id_recurso INTO v_r_iza_reg FROM rutas WHERE codigo = 'DEMO-IZA-MER';
    SELECT id_recurso INTO v_r_val_ida FROM rutas WHERE codigo = 'DEMO-MER-VAL';
    SELECT id_recurso INTO v_r_val_reg FROM rutas WHERE codigo = 'DEMO-VAL-MER';
    SELECT id_recurso INTO v_r_tek_ida FROM rutas WHERE codigo = 'DEMO-MER-TEK';
    SELECT id_recurso INTO v_r_tek_reg FROM rutas WHERE codigo = 'DEMO-TEK-MER';
    SELECT id_recurso INTO v_r_tic_ida FROM rutas WHERE codigo = 'DEMO-MER-TIC';
    SELECT id_recurso INTO v_r_tic_reg FROM rutas WHERE codigo = 'DEMO-TIC-MER';

    IF v_creador IS NULL OR v_r_iza_ida IS NULL OR v_r_val_ida IS NULL OR v_r_tek_ida IS NULL OR v_r_tic_ida IS NULL THEN
        RAISE NOTICE 'Ejecuta primero 002_rutas_tarifas_referencia.sql antes de cargar 003_recorridos_referencia.sql.';
        RETURN;
    END IF;

    SELECT l.id_localidad INTO v_loc_iza FROM localidades l JOIN municipios m ON m.id_municipio = l.id_municipio WHERE m.codigo = '040' AND l.nombre = 'Izamal';
    SELECT l.id_localidad INTO v_loc_val FROM localidades l JOIN municipios m ON m.id_municipio = l.id_municipio WHERE m.codigo = '102' AND l.nombre = 'Valladolid';
    SELECT l.id_localidad INTO v_loc_tek FROM localidades l JOIN municipios m ON m.id_municipio = l.id_municipio WHERE m.codigo = '080' AND l.nombre = 'Tekit';
    SELECT l.id_localidad INTO v_loc_tic FROM localidades l JOIN municipios m ON m.id_municipio = l.id_municipio WHERE m.codigo = '089' AND l.nombre = 'Ticul';

    -- Ubicaciones referenciales [DEMO]
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_iza, '[DEMO] Atrio del Convento de San Antonio de Padua', 20.933600, -89.017600) RETURNING id_ubicacion INTO v_ub_iza_conv;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_iza, '[DEMO] Zona gastronómica centro de Izamal', 20.934400, -89.016800) RETURNING id_ubicacion INTO v_ub_iza_com;

    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_val, '[DEMO] Acceso Cenote Zací', 20.691400, -88.198100) RETURNING id_ubicacion INTO v_ub_val_zaci;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_val, '[DEMO] Calzada de los Frailes', 20.688100, -88.208900) RETURNING id_ubicacion INTO v_ub_val_calz;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_val, '[DEMO] Mercado municipal de Valladolid', 20.690800, -88.200100) RETURNING id_ubicacion INTO v_ub_val_com;

    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_tek, '[DEMO] Corredor textil de guayaberas en Tekit', 20.532400, -89.335100) RETURNING id_ubicacion INTO v_ub_tek_tall;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_tek, '[DEMO] Mercado municipal de Tekit', 20.531500, -89.336200) RETURNING id_ubicacion INTO v_ub_tek_com;

    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_tic, '[DEMO] Talleres de alfarería artesanal en Ticul', 20.398800, -89.532900) RETURNING id_ubicacion INTO v_ub_tic_alfa;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_tic, '[DEMO] Corredor zapatero de Ticul', 20.397100, -89.534500) RETURNING id_ubicacion INTO v_ub_tic_calz;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_tic, '[DEMO] Zona gastronómica del mercado de Ticul', 20.398000, -89.534100) RETURNING id_ubicacion INTO v_ub_tic_com;

    -- 1. Izamal
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('lugar', '[DEMO] Convento de San Antonio de Padua', 'Recorrido arquitectónico amarillo en el corazón de Izamal (dato referencial).', 'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_rec_iza_conv;
    INSERT INTO lugares (id_recurso, id_ubicacion, costo_acceso, condiciones_acceso) VALUES (v_rec_iza_conv, v_ub_iza_conv, 0, 'Acceso libre al atrio; respetar celebraciones.');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('negocio', '[DEMO] Comida yucateca en Izamal', 'Antojitos y guisos tradicionales de referencia cerca de la plaza.', 'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_rec_iza_com;
    INSERT INTO negocios (id_recurso, id_ubicacion, precio_minimo_aprox, precio_maximo_aprox) VALUES (v_rec_iza_com, v_ub_iza_com, 90, 220);

    INSERT INTO recorridos_sugeridos (titulo, descripcion, id_localidad_base, estado_publicacion)
    VALUES ('[DEMO] Pueblo Mágico en Izamal', 'Visita de medio día saliendo desde Mérida para conocer el convento y la gastronomía izamaleña.', v_loc_iza, 'publicado') RETURNING id_recorrido INTO v_recorrido;
    INSERT INTO etapas_recorrido (id_recorrido, orden, id_recurso, duracion_sugerida_min) VALUES
        (v_recorrido, 1, v_r_iza_ida, 75),
        (v_recorrido, 2, v_rec_iza_conv, 90),
        (v_recorrido, 3, v_rec_iza_com, 75),
        (v_recorrido, 4, v_r_iza_reg, 75);

    -- 2. Valladolid
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('lugar', '[DEMO] Cenote Zací', 'Cenote semiabierto en el centro de Valladolid (dato referencial).', 'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_rec_val_zaci;
    INSERT INTO lugares (id_recurso, id_ubicacion, costo_acceso, condiciones_acceso) VALUES (v_rec_val_zaci, v_ub_val_zaci, 60, 'Ducha previa obligatoria y sin bloqueador.');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('lugar', '[DEMO] Calzada de los Frailes', 'Paseo colonial colorido rumbo al exconvento de San Bernardino (dato referencial).', 'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_rec_val_calz;
    INSERT INTO lugares (id_recurso, id_ubicacion, costo_acceso, condiciones_acceso) VALUES (v_rec_val_calz, v_ub_val_calz, 0, 'Recorrido peatonal abierto.');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('negocio', '[DEMO] Cocina tradicional de Valladolid', 'Longaniza de Valladolid, lomitos y aguas frescas (referencia).', 'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_rec_val_com;
    INSERT INTO negocios (id_recurso, id_ubicacion, precio_minimo_aprox, precio_maximo_aprox) VALUES (v_rec_val_com, v_ub_val_com, 80, 200);

    INSERT INTO recorridos_sugeridos (titulo, descripcion, id_localidad_base, estado_publicacion)
    VALUES ('[DEMO] Cenote y Calzada en Valladolid', 'Jornada cultural y gastronómica en Valladolid con cenote urbano y paseo colonial.', v_loc_val, 'publicado') RETURNING id_recorrido INTO v_recorrido;
    INSERT INTO etapas_recorrido (id_recorrido, orden, id_recurso, duracion_sugerida_min) VALUES
        (v_recorrido, 1, v_r_val_ida, 130),
        (v_recorrido, 2, v_rec_val_zaci, 90),
        (v_recorrido, 3, v_rec_val_calz, 60),
        (v_recorrido, 4, v_rec_val_com, 60),
        (v_recorrido, 5, v_r_val_reg, 130);

    -- 3. Tekit
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('lugar', '[DEMO] Corredor de talleres de guayaberas', 'Talleres locales de confección y bordado tradicional en Tekit (referencia).', 'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_rec_tek_tall;
    INSERT INTO lugares (id_recurso, id_ubicacion, costo_acceso, condiciones_acceso) VALUES (v_rec_tek_tall, v_ub_tek_tall, 0, 'Horario comercial diurno.');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('negocio', '[DEMO] Lonchería del mercado de Tekit', 'Salbutes, panuchos y comida casera local (referencia).', 'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_rec_tek_com;
    INSERT INTO negocios (id_recurso, id_ubicacion, precio_minimo_aprox, precio_maximo_aprox) VALUES (v_rec_tek_com, v_ub_tek_com, 50, 130);

    INSERT INTO recorridos_sugeridos (titulo, descripcion, id_localidad_base, estado_publicacion)
    VALUES ('[DEMO] Ruta Textil y Guayaberas en Tekit', 'Recorrido por talleres de guayaberas y gastronomía local en la Capital de la Guayabera.', v_loc_tek, 'publicado') RETURNING id_recorrido INTO v_recorrido;
    INSERT INTO etapas_recorrido (id_recorrido, orden, id_recurso, duracion_sugerida_min) VALUES
        (v_recorrido, 1, v_r_tek_ida, 65),
        (v_recorrido, 2, v_rec_tek_tall, 120),
        (v_recorrido, 3, v_rec_tek_com, 60),
        (v_recorrido, 4, v_r_tek_reg, 65);

    -- 4. Ticul
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('lugar', '[DEMO] Talleres de alfarería maya', 'Demostración de cerámica y barro tradicional en Ticul (referencia).', 'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_rec_tic_alfa;
    INSERT INTO lugares (id_recurso, id_ubicacion, costo_acceso, condiciones_acceso) VALUES (v_rec_tic_alfa, v_ub_tic_alfa, 0, 'Visitas guiadas sujetas a disponibilidad de taller.');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('lugar', '[DEMO] Corredor de calzado artesanal', 'Zona de zapaterías y talleres locales en Ticul (referencia).', 'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_rec_tic_calz;
    INSERT INTO lugares (id_recurso, id_ubicacion, costo_acceso, condiciones_acceso) VALUES (v_rec_tic_calz, v_ub_tic_calz, 0, 'Acceso libre en horario comercial.');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('negocio', '[DEMO] Cocina local de Ticul', 'Poc chuc y platillos del sur de Yucatán (referencia).', 'publicado', v_creador, v_creador, now()) RETURNING id_recurso INTO v_rec_tic_com;
    INSERT INTO negocios (id_recurso, id_ubicacion, precio_minimo_aprox, precio_maximo_aprox) VALUES (v_rec_tic_com, v_ub_tic_com, 70, 180);

    INSERT INTO recorridos_sugeridos (titulo, descripcion, id_localidad_base, estado_publicacion)
    VALUES ('[DEMO] Alfarería y Calzado en Ticul', 'Recorrido artesanal por talleres de barro, calzado y comida tradicional en La Perla del Sur.', v_loc_tic, 'publicado') RETURNING id_recorrido INTO v_recorrido;
    INSERT INTO etapas_recorrido (id_recorrido, orden, id_recurso, duracion_sugerida_min) VALUES
        (v_recorrido, 1, v_r_tic_ida, 90),
        (v_recorrido, 2, v_rec_tic_alfa, 90),
        (v_recorrido, 3, v_rec_tic_calz, 75),
        (v_recorrido, 4, v_rec_tic_com, 60),
        (v_recorrido, 5, v_r_tic_reg, 90);

    RAISE NOTICE 'Recorridos sugeridos DEMO de referencia (Izamal, Valladolid, Tekit y Ticul) cargados.';
END
$$;
