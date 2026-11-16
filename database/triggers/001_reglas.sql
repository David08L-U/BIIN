-- BIIN: reglas que comparan varias tablas (también se validan en el backend)

-- Mantiene recursos.actualizado_en al día
CREATE OR REPLACE FUNCTION fn_tocar_actualizado_en() RETURNS trigger AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recursos_actualizado
    BEFORE UPDATE ON recursos
    FOR EACH ROW EXECUTE FUNCTION fn_tocar_actualizado_en();

CREATE TRIGGER trg_recorridos_actualizado
    BEFORE UPDATE ON recorridos_sugeridos
    FOR EACH ROW EXECUTE FUNCTION fn_tocar_actualizado_en();

-- El detalle de cada recurso debe coincidir con su tipo
CREATE OR REPLACE FUNCTION fn_validar_tipo_detalle() RETURNS trigger AS $$
DECLARE
    v_tipo varchar(10);
BEGIN
    SELECT tipo INTO v_tipo FROM recursos WHERE id_recurso = NEW.id_recurso;
    IF v_tipo IS DISTINCT FROM TG_ARGV[0] THEN
        RAISE EXCEPTION 'El recurso % es de tipo %, no %', NEW.id_recurso, v_tipo, TG_ARGV[0]
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rutas_tipo     BEFORE INSERT OR UPDATE ON rutas
    FOR EACH ROW EXECUTE FUNCTION fn_validar_tipo_detalle('ruta');
CREATE TRIGGER trg_negocios_tipo  BEFORE INSERT OR UPDATE ON negocios
    FOR EACH ROW EXECUTE FUNCTION fn_validar_tipo_detalle('negocio');
CREATE TRIGGER trg_eventos_tipo   BEFORE INSERT OR UPDATE ON eventos
    FOR EACH ROW EXECUTE FUNCTION fn_validar_tipo_detalle('evento');
CREATE TRIGGER trg_lugares_tipo   BEFORE INSERT OR UPDATE ON lugares
    FOR EACH ROW EXECUTE FUNCTION fn_validar_tipo_detalle('lugar');

-- Los horarios de visita solo aplican a negocios o lugares
CREATE OR REPLACE FUNCTION fn_validar_horario_visita() RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM recursos
        WHERE id_recurso = NEW.id_recurso AND tipo IN ('negocio', 'lugar')
    ) THEN
        RAISE EXCEPTION 'Los horarios de visita solo aplican a negocios o lugares'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_horarios_visita_tipo
    BEFORE INSERT OR UPDATE ON horarios_visita
    FOR EACH ROW EXECUTE FUNCTION fn_validar_horario_visita();

-- Un reporte de cupo no supera la capacidad y su autor opera la ruta
CREATE OR REPLACE FUNCTION fn_validar_reporte_cupo() RETURNS trigger AS $$
DECLARE
    v_capacidad integer;
    v_ruta      integer;
BEGIN
    SELECT capacidad_habilitada, id_ruta INTO v_capacidad, v_ruta
    FROM salidas WHERE id_salida = NEW.id_salida;

    IF NEW.asientos_disponibles > v_capacidad THEN
        RAISE EXCEPTION 'Asientos disponibles (%) superan la capacidad habilitada (%)',
            NEW.asientos_disponibles, v_capacidad
            USING ERRCODE = 'check_violation';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM operador_ruta
        WHERE id_usuario = NEW.id_autor AND id_ruta = v_ruta
    ) THEN
        RAISE EXCEPTION 'El usuario % no está autorizado para operar la ruta %', NEW.id_autor, v_ruta
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reportes_cupo_validar
    BEFORE INSERT OR UPDATE ON reportes_cupo
    FOR EACH ROW EXECUTE FUNCTION fn_validar_reporte_cupo();
