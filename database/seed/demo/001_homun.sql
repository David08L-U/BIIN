-- BIIN: datos de DEMOSTRACIÓN con Homún como ejemplo
-- Solo para desarrollo y pruebas. NO son datos validados:
--   reales: nombres de municipios y coordenadas aproximadas de sus centros
--   ficticios: rutas, horarios, tarifas, unidades, negocios, lugares y eventos
-- Todo lo ficticio lleva "[DEMO]" en el título o "DEMO" en el código.
-- Se borra con database/seed/demo/999_borrar_demo.sql

DO $$
DECLARE
    v_creador   integer;
    v_mun_mer integer; v_mun_kan integer; v_mun_aca integer; v_mun_cuz integer; v_mun_hom integer;
    v_loc_mer integer; v_loc_kan integer; v_loc_aca integer; v_loc_cuz integer; v_loc_hom integer;
    v_ub_mer integer; v_ub_kan integer; v_ub_aca integer; v_ub_cuz integer; v_ub_hom integer;
    v_ub_cenote integer; v_ub_cocina integer; v_ub_iglesia integer; v_ub_plaza integer;
    v_ida integer; v_regreso integer;
    v_cenote integer; v_cocina integer; v_iglesia integer; v_pendiente integer;
    v_vaqueria integer; v_cancelado integer;
    v_recorrido integer;
    v_unidad1 integer; v_unidad2 integer;
BEGIN
    IF EXISTS (SELECT 1 FROM rutas WHERE codigo = 'DEMO-MER-HOM') THEN
        RAISE NOTICE 'La demo de Homún ya está cargada; no se hace nada.';
        RETURN;
    END IF;

    -- Autor de los datos demo: cuenta inactiva con contraseña aleatoria (no se puede usar para entrar)
    INSERT INTO usuarios (nombre, correo, hash_contrasena, activo)
    VALUES ('Datos de demostración', 'demo@biin.test', crypt(gen_random_uuid()::text, gen_salt('bf', 11)), false)
    RETURNING id_usuario INTO v_creador;

    -- Municipios (clave INEGI de Yucatán; verificar al cargar el catálogo oficial)
    INSERT INTO municipios (codigo, nombre) VALUES ('050', 'Mérida')  ON CONFLICT (codigo) DO NOTHING;
    INSERT INTO municipios (codigo, nombre) VALUES ('041', 'Kanasín') ON CONFLICT (codigo) DO NOTHING;
    INSERT INTO municipios (codigo, nombre) VALUES ('002', 'Acanceh') ON CONFLICT (codigo) DO NOTHING;
    INSERT INTO municipios (codigo, nombre) VALUES ('015', 'Cuzamá')  ON CONFLICT (codigo) DO NOTHING;
    INSERT INTO municipios (codigo, nombre) VALUES ('036', 'Homún')   ON CONFLICT (codigo) DO NOTHING;
    SELECT id_municipio INTO v_mun_mer FROM municipios WHERE codigo = '050';
    SELECT id_municipio INTO v_mun_kan FROM municipios WHERE codigo = '041';
    SELECT id_municipio INTO v_mun_aca FROM municipios WHERE codigo = '002';
    SELECT id_municipio INTO v_mun_cuz FROM municipios WHERE codigo = '015';
    SELECT id_municipio INTO v_mun_hom FROM municipios WHERE codigo = '036';

    -- Cabeceras municipales
    INSERT INTO localidades (id_municipio, nombre) VALUES (v_mun_mer, 'Mérida')  ON CONFLICT DO NOTHING;
    INSERT INTO localidades (id_municipio, nombre) VALUES (v_mun_kan, 'Kanasín') ON CONFLICT DO NOTHING;
    INSERT INTO localidades (id_municipio, nombre) VALUES (v_mun_aca, 'Acanceh') ON CONFLICT DO NOTHING;
    INSERT INTO localidades (id_municipio, nombre) VALUES (v_mun_cuz, 'Cuzamá')  ON CONFLICT DO NOTHING;
    INSERT INTO localidades (id_municipio, nombre) VALUES (v_mun_hom, 'Homún')   ON CONFLICT DO NOTHING;
    SELECT id_localidad INTO v_loc_mer FROM localidades WHERE id_municipio = v_mun_mer AND nombre = 'Mérida';
    SELECT id_localidad INTO v_loc_kan FROM localidades WHERE id_municipio = v_mun_kan AND nombre = 'Kanasín';
    SELECT id_localidad INTO v_loc_aca FROM localidades WHERE id_municipio = v_mun_aca AND nombre = 'Acanceh';
    SELECT id_localidad INTO v_loc_cuz FROM localidades WHERE id_municipio = v_mun_cuz AND nombre = 'Cuzamá';
    SELECT id_localidad INTO v_loc_hom FROM localidades WHERE id_municipio = v_mun_hom AND nombre = 'Homún';

    -- Ubicaciones (centros aproximados; los puntos exactos de abordaje se validan con operadores)
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_mer, '[DEMO] Parada en el centro de Mérida', 20.967400, -89.623700) RETURNING id_ubicacion INTO v_ub_mer;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_kan, '[DEMO] Parada en el centro de Kanasín', 20.934500, -89.557800) RETURNING id_ubicacion INTO v_ub_kan;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_aca, '[DEMO] Parada en el centro de Acanceh', 20.813600, -89.452700) RETURNING id_ubicacion INTO v_ub_aca;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_cuz, '[DEMO] Parada en el centro de Cuzamá', 20.741700, -89.317200) RETURNING id_ubicacion INTO v_ub_cuz;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_hom, '[DEMO] Parada en la plaza de Homún', 20.739000, -89.285800) RETURNING id_ubicacion INTO v_ub_hom;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_hom, '[DEMO] Camino a los cenotes, a las afueras de Homún', 20.722000, -89.292000) RETURNING id_ubicacion INTO v_ub_cenote;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_hom, '[DEMO] A una cuadra de la plaza', 20.739600, -89.284900) RETURNING id_ubicacion INTO v_ub_cocina;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_hom, '[DEMO] Frente a la plaza principal', 20.738700, -89.286300) RETURNING id_ubicacion INTO v_ub_iglesia;
    INSERT INTO ubicaciones (id_localidad, direccion_referencia, latitud, longitud)
    VALUES (v_loc_hom, '[DEMO] Plaza principal de Homún', 20.739200, -89.285500) RETURNING id_ubicacion INTO v_ub_plaza;

    -- Rutas: ida y regreso son rutas distintas
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('ruta', '[DEMO] Mérida a Homún',
            'Combi de demostración que pasa por Kanasín, Acanceh y Cuzamá. Horarios y tarifas ficticios.',
            'publicado', v_creador, v_creador, now())
    RETURNING id_recurso INTO v_ida;
    INSERT INTO rutas (id_recurso, codigo) VALUES (v_ida, 'DEMO-MER-HOM');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('ruta', '[DEMO] Homún a Mérida',
            'Regreso de demostración por Cuzamá, Acanceh y Kanasín. Horarios y tarifas ficticios.',
            'publicado', v_creador, v_creador, now())
    RETURNING id_recurso INTO v_regreso;
    INSERT INTO rutas (id_recurso, codigo) VALUES (v_regreso, 'DEMO-HOM-MER');

    INSERT INTO ruta_parada (id_ruta, orden, id_ubicacion, permite_abordar, permite_descender) VALUES
        (v_ida, 1, v_ub_mer, true,  false),
        (v_ida, 2, v_ub_kan, true,  true),
        (v_ida, 3, v_ub_aca, true,  true),
        (v_ida, 4, v_ub_cuz, true,  true),
        (v_ida, 5, v_ub_hom, false, true),
        (v_regreso, 1, v_ub_hom, true,  false),
        (v_regreso, 2, v_ub_cuz, true,  true),
        (v_regreso, 3, v_ub_aca, true,  true),
        (v_regreso, 4, v_ub_kan, true,  true),
        (v_regreso, 5, v_ub_mer, false, true);

    -- Trazo simplificado: las paradas en orden (el trazo real sigue la carretera)
    INSERT INTO puntos_recorrido (id_ruta, orden, latitud, longitud)
    SELECT p.id_ruta, p.orden, u.latitud, u.longitud
    FROM ruta_parada p JOIN ubicaciones u ON u.id_ubicacion = p.id_ubicacion
    WHERE p.id_ruta IN (v_ida, v_regreso);

    -- Horarios ficticios, todos los días (0 = domingo … 6 = sábado)
    INSERT INTO horarios_ruta (id_ruta, dia_semana, hora_salida, vigente_desde)
    SELECT v_ida, d, h::time, DATE '2026-01-01'
    FROM generate_series(0, 6) d, unnest(ARRAY['06:00', '08:00', '10:00', '12:00', '14:00', '16:00']) h;
    INSERT INTO horarios_ruta (id_ruta, dia_semana, hora_salida, vigente_desde)
    SELECT v_regreso, d, h::time, DATE '2026-01-01'
    FROM generate_series(0, 6) d, unnest(ARRAY['07:30', '09:30', '11:30', '13:30', '15:30', '17:30', '19:00']) h;

    -- Tarifas ficticias por tramo (origen, destino, monto)
    INSERT INTO tarifas (id_ruta, orden_origen, orden_destino, monto, vigente_desde)
    SELECT r, o, d, m, DATE '2026-01-01'
    FROM unnest(ARRAY[v_ida, v_regreso]) r,
         (VALUES (1, 5, 45.00), (1, 2, 15.00), (1, 3, 25.00), (1, 4, 38.00),
                 (2, 5, 40.00), (3, 5, 25.00), (4, 5, 12.00)) AS t(o, d, m);

    INSERT INTO unidades (identificador, capacidad) VALUES ('DEMO-COMBI-01', 15) RETURNING id_unidad INTO v_unidad1;
    INSERT INTO unidades (identificador, capacidad) VALUES ('DEMO-COMBI-02', 18) RETURNING id_unidad INTO v_unidad2;

    -- Salidas concretas para hoy y los próximos 6 días, a partir de los horarios
    INSERT INTO salidas (id_ruta, id_unidad, salida_programada, capacidad_habilitada)
    SELECT h.id_ruta,
           CASE WHEN h.id_ruta = v_ida THEN v_unidad1 ELSE v_unidad2 END,
           ((current_date + n) + h.hora_salida) AT TIME ZONE 'America/Merida',
           CASE WHEN h.id_ruta = v_ida THEN 15 ELSE 18 END
    FROM generate_series(0, 6) n
    JOIN horarios_ruta h ON h.dia_semana = extract(dow FROM current_date + n)::int
    WHERE h.id_ruta IN (v_ida, v_regreso);

    -- Lugares en Homún
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('lugar', '[DEMO] Cenote de prueba en Homún',
            'Cenote ficticio para probar la sección de lugares. Agua cristalina y escaleras de madera.',
            'publicado', v_creador, v_creador, now())
    RETURNING id_recurso INTO v_cenote;
    INSERT INTO lugares (id_recurso, id_ubicacion, costo_acceso, condiciones_acceso)
    VALUES (v_cenote, v_ub_cenote, 50.00, 'Chaleco salvavidas obligatorio. Sin bloqueador solar. (dato ficticio)');
    INSERT INTO horarios_visita (id_recurso, dia_semana, hora_apertura, hora_cierre)
    SELECT v_cenote, d, '09:00', '17:00' FROM generate_series(0, 6) d;

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('lugar', '[DEMO] Iglesia del centro de Homún',
            'Iglesia frente a la plaza principal, ideal para fotografías. Descripción ficticia.',
            'publicado', v_creador, v_creador, now())
    RETURNING id_recurso INTO v_iglesia;
    INSERT INTO lugares (id_recurso, id_ubicacion, costo_acceso, condiciones_acceso)
    VALUES (v_iglesia, v_ub_iglesia, 0, 'Respetar los horarios de misa. (dato ficticio)');

    -- Contenido sin publicar: no debe aparecer al público
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador)
    VALUES ('lugar', '[DEMO] Cenote pendiente de revisión',
            'Enviado por un colaborador, aún sin revisar.', 'pendiente', v_creador)
    RETURNING id_recurso INTO v_pendiente;
    INSERT INTO lugares (id_recurso, id_ubicacion, costo_acceso) VALUES (v_pendiente, v_ub_cenote, 80.00);

    -- Negocio gastronómico
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('negocio', '[DEMO] Cocina económica de Homún',
            'Comida regional casera: cochinita, relleno negro y panuchos. Negocio ficticio.',
            'publicado', v_creador, v_creador, now())
    RETURNING id_recurso INTO v_cocina;
    INSERT INTO negocios (id_recurso, id_ubicacion, telefono, precio_minimo_aprox, precio_maximo_aprox)
    VALUES (v_cocina, v_ub_cocina, '0000000000', 60.00, 150.00);
    INSERT INTO horarios_visita (id_recurso, dia_semana, hora_apertura, hora_cierre)
    SELECT v_cocina, d, '08:00', '17:00' FROM generate_series(1, 6) d;

    -- Eventos: uno programado y uno cancelado (RF06)
    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('evento', '[DEMO] Vaquería en la plaza de Homún',
            'Baile de jarana con orquesta. Evento ficticio para pruebas.',
            'publicado', v_creador, v_creador, now())
    RETURNING id_recurso INTO v_vaqueria;
    INSERT INTO eventos (id_recurso, id_ubicacion, inicio, fin, costo_entrada, estado_evento, contacto_organizador)
    VALUES (v_vaqueria, v_ub_plaza,
            ((current_date + (6 - extract(dow FROM current_date)::int)) + time '19:00') AT TIME ZONE 'America/Merida',
            ((current_date + (6 - extract(dow FROM current_date)::int)) + time '23:00') AT TIME ZONE 'America/Merida',
            0, 'programado', 'Organización ficticia');

    INSERT INTO recursos (tipo, titulo, descripcion, estado_publicacion, id_creador, id_revisor, fecha_revision)
    VALUES ('evento', '[DEMO] Concierto cancelado en Homún',
            'Ejemplo de evento cancelado: debe mostrarse como cancelado.',
            'publicado', v_creador, v_creador, now())
    RETURNING id_recurso INTO v_cancelado;
    INSERT INTO eventos (id_recurso, id_ubicacion, inicio, fin, costo_entrada, estado_evento)
    VALUES (v_cancelado, v_ub_plaza,
            ((current_date + 3) + time '20:00') AT TIME ZONE 'America/Merida',
            ((current_date + 3) + time '22:00') AT TIME ZONE 'America/Merida',
            100.00, 'cancelado');

    -- Categorías
    INSERT INTO recurso_categoria (id_recurso, id_categoria)
    SELECT x.r, c.id_categoria
    FROM (VALUES (v_cenote, 'Cenote'), (v_cenote, 'Paisaje'),
                 (v_pendiente, 'Cenote'),
                 (v_iglesia, 'Iglesia y convento'),
                 (v_cocina, 'Comida regional'), (v_cocina, 'Cocina económica'),
                 (v_vaqueria, 'Feria y vaquería'), (v_vaqueria, 'Baile'),
                 (v_cancelado, 'Música')) AS x(r, nombre)
    JOIN categorias c ON c.nombre = x.nombre;

    -- Recorrido sugerido (CU-13)
    INSERT INTO recorridos_sugeridos (titulo, descripcion, id_localidad_base, estado_publicacion)
    VALUES ('[DEMO] Un día de cenotes en Homún',
            'Sal temprano de Mérida, nada en el cenote, come en el pueblo y regresa por la tarde.',
            v_loc_hom, 'publicado')
    RETURNING id_recorrido INTO v_recorrido;
    INSERT INTO etapas_recorrido (id_recorrido, orden, id_recurso, duracion_sugerida_min) VALUES
        (v_recorrido, 1, v_ida, 90),
        (v_recorrido, 2, v_cenote, 150),
        (v_recorrido, 3, v_cocina, 60),
        (v_recorrido, 4, v_iglesia, 30),
        (v_recorrido, 5, v_regreso, 90);

    RAISE NOTICE 'Demo de Homún cargada.';
END
$$;
