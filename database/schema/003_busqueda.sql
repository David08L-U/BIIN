-- BIIN: extensiones y búsqueda sin acentos ni mayúsculas
-- Permite que "merida" encuentre "Mérida" y tolera errores de escritura.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- unaccent() no es IMMUTABLE; este envoltorio sí, para poder indexarlo
CREATE OR REPLACE FUNCTION f_normalizar(texto text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $$
    SELECT lower(public.unaccent('public.unaccent'::regdictionary, texto));
$$;

CREATE INDEX ix_recursos_titulo_busqueda
    ON recursos USING gin (f_normalizar(titulo) gin_trgm_ops);

CREATE INDEX ix_localidades_nombre_busqueda
    ON localidades USING gin (f_normalizar(nombre) gin_trgm_ops);

CREATE INDEX ix_municipios_nombre_busqueda
    ON municipios USING gin (f_normalizar(nombre) gin_trgm_ops);

CREATE INDEX ix_categorias_nombre_busqueda
    ON categorias USING gin (f_normalizar(nombre) gin_trgm_ops);

-- Ejemplo de uso:
--   SELECT nombre FROM localidades
--   WHERE f_normalizar(nombre) LIKE '%' || f_normalizar('homun') || '%';
--   SELECT nombre, similarity(f_normalizar(nombre), f_normalizar('omun')) AS parecido
--   FROM localidades ORDER BY parecido DESC LIMIT 5;
