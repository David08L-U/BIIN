-- BIIN: usuario con el que se conecta la API (RNF04)
-- Puede leer y escribir datos, pero no crear, alterar ni borrar tablas.
-- Ejecutar como postgres pasando la contraseña:
--   psql -U postgres -d biin -v app_usuario=biin_app -v app_contrasena=... -f este_archivo.sql

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_usuario', :'app_contrasena')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_usuario')
\gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE', :'app_usuario', :'app_contrasena')
\gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_usuario')
\gexec

SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'app_usuario')
\gexec

SELECT format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I', :'app_usuario')
\gexec

SELECT format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I', :'app_usuario')
\gexec

SELECT format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO %I', :'app_usuario')
\gexec

-- Lo que se cree después en public también queda disponible para la app
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I', :'app_usuario')
\gexec

SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I', :'app_usuario')
\gexec

-- Nadie más que el dueño puede crear objetos en public
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
