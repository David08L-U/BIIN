-- Migración incremental RF09 / HU09. Conserva encabezados y actividades existentes.
-- El JSONB almacena sin pérdida los borradores de los cinco planificadores BIIN,
-- cuyos lugares y jornadas aún no siempre corresponden con recursos normalizados.
ALTER TABLE itinerarios
    ADD COLUMN IF NOT EXISTS borrador jsonb,
    ADD COLUMN IF NOT EXISTS huella_plan varchar(64);

-- Las filas antiguas conservan NULL y siguen intactas. La clave es por cuenta,
-- así la importación repetida del mismo borrador no genera otra fila.
CREATE UNIQUE INDEX IF NOT EXISTS ux_itinerarios_usuario_huella_plan
    ON itinerarios (id_usuario, huella_plan)
    WHERE huella_plan IS NOT NULL;
