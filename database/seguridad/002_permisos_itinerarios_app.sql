-- Permisos mínimos para que el rol de aplicación ejercite el CRUD de itinerarios
-- en una base ya migrada. Ejecutar conectado a la base destino con un rol autorizado.
-- No cambia atributos ni contraseña del rol y no concede permisos de administración.
-- Uso: psql -d <base-aislada> -v app_usuario=biin_app -f este_archivo.sql

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_usuario')
\gexec

SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'app_usuario')
\gexec

SELECT format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.itinerarios TO %I', :'app_usuario')
\gexec

-- La consulta de registros históricos agrega el número de actividades por itinerario.
SELECT format('GRANT SELECT ON TABLE public.actividades_itinerario TO %I', :'app_usuario')
\gexec

SELECT format('GRANT USAGE, SELECT ON SEQUENCE public.itinerarios_id_itinerario_seq TO %I', :'app_usuario')
\gexec
