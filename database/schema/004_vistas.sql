-- BIIN: vistas para las consultas más frecuentes

-- Contenido visible al público y al asistente de IA (RF08): solo lo publicado.
-- Incluye la ubicación del detalle; las rutas toman la de su primera parada.
CREATE OR REPLACE VIEW v_recursos_publicados AS
SELECT
    r.id_recurso,
    r.tipo,
    r.titulo,
    r.descripcion,
    r.actualizado_en,
    u.id_ubicacion,
    u.latitud,
    u.longitud,
    l.id_localidad,
    l.nombre AS localidad,
    m.id_municipio,
    m.nombre AS municipio
FROM recursos r
LEFT JOIN negocios n ON n.id_recurso = r.id_recurso
LEFT JOIN eventos  e ON e.id_recurso = r.id_recurso
LEFT JOIN lugares  g ON g.id_recurso = r.id_recurso
LEFT JOIN ruta_parada p ON p.id_ruta = r.id_recurso AND p.orden = 1
LEFT JOIN ubicaciones u ON u.id_ubicacion = COALESCE(n.id_ubicacion, e.id_ubicacion, g.id_ubicacion, p.id_ubicacion)
LEFT JOIN localidades l ON l.id_localidad = u.id_localidad
LEFT JOIN municipios  m ON m.id_municipio = l.id_municipio
WHERE r.estado_publicacion = 'publicado';

-- Paradas de cada ruta activa con su localidad y municipio, en orden.
-- Base para buscar rutas por origen y destino (CU-02).
CREATE OR REPLACE VIEW v_paradas_ruta AS
SELECT
    rt.id_recurso AS id_ruta,
    rt.codigo,
    r.titulo AS ruta,
    p.orden,
    p.permite_abordar,
    p.permite_descender,
    u.id_ubicacion,
    u.direccion_referencia,
    u.latitud,
    u.longitud,
    l.id_localidad,
    l.nombre AS localidad,
    m.id_municipio,
    m.nombre AS municipio
FROM rutas rt
JOIN recursos r    ON r.id_recurso = rt.id_recurso
JOIN ruta_parada p ON p.id_ruta = rt.id_recurso
JOIN ubicaciones u ON u.id_ubicacion = p.id_ubicacion
JOIN localidades l ON l.id_localidad = u.id_localidad
JOIN municipios  m ON m.id_municipio = l.id_municipio
WHERE rt.activa AND r.estado_publicacion = 'publicado';

-- Cupo de cada salida: el último reporte vigente o "no_confirmado" (RF04, RNF07).
CREATE OR REPLACE VIEW v_cupo_vigente AS
SELECT
    s.id_salida,
    s.id_ruta,
    s.salida_programada,
    s.capacidad_habilitada,
    s.estado AS estado_salida,
    rc.asientos_disponibles,
    rc.registrado_en,
    rc.valido_hasta,
    CASE WHEN rc.id_reporte IS NULL THEN 'no_confirmado' ELSE 'vigente' END AS estado_cupo
FROM salidas s
LEFT JOIN LATERAL (
    SELECT id_reporte, asientos_disponibles, registrado_en, valido_hasta
    FROM reportes_cupo
    WHERE id_salida = s.id_salida AND valido_hasta > now()
    ORDER BY registrado_en DESC
    LIMIT 1
) rc ON true;
