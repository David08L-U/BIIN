-- BIIN: borra todos los datos de demostración
-- Quita lo marcado con [DEMO] / DEMO y la cuenta demo@biin.test.
-- Conserva municipios y localidades porque son catálogo real.

BEGIN;

CREATE TEMP TABLE demo_recursos ON COMMIT DROP AS
SELECT id_recurso FROM recursos
WHERE titulo LIKE '[DEMO]%'
   OR id_creador = (SELECT id_usuario FROM usuarios WHERE correo = 'demo@biin.test');

DELETE FROM etapas_recorrido WHERE id_recurso IN (SELECT id_recurso FROM demo_recursos)
   OR id_recorrido IN (SELECT id_recorrido FROM recorridos_sugeridos WHERE titulo LIKE '[DEMO]%');
DELETE FROM recorridos_sugeridos WHERE titulo LIKE '[DEMO]%';

DELETE FROM actividades_itinerario WHERE id_recurso IN (SELECT id_recurso FROM demo_recursos);
DELETE FROM favoritos WHERE id_recurso IN (SELECT id_recurso FROM demo_recursos);

DELETE FROM reportes_cupo WHERE id_salida IN (
    SELECT s.id_salida FROM salidas s JOIN rutas r ON r.id_recurso = s.id_ruta WHERE r.codigo LIKE 'DEMO-%');
DELETE FROM salidas WHERE id_ruta IN (SELECT id_recurso FROM rutas WHERE codigo LIKE 'DEMO-%');
DELETE FROM operador_ruta WHERE id_ruta IN (SELECT id_recurso FROM rutas WHERE codigo LIKE 'DEMO-%');
DELETE FROM tarifas WHERE id_ruta IN (SELECT id_recurso FROM rutas WHERE codigo LIKE 'DEMO-%');
DELETE FROM horarios_ruta WHERE id_ruta IN (SELECT id_recurso FROM rutas WHERE codigo LIKE 'DEMO-%');
DELETE FROM puntos_recorrido WHERE id_ruta IN (SELECT id_recurso FROM rutas WHERE codigo LIKE 'DEMO-%');
DELETE FROM ruta_parada WHERE id_ruta IN (SELECT id_recurso FROM rutas WHERE codigo LIKE 'DEMO-%');
DELETE FROM rutas WHERE codigo LIKE 'DEMO-%';
DELETE FROM unidades WHERE identificador LIKE 'DEMO-%';

DELETE FROM negocios WHERE id_recurso IN (SELECT id_recurso FROM demo_recursos);
DELETE FROM eventos  WHERE id_recurso IN (SELECT id_recurso FROM demo_recursos);
DELETE FROM lugares  WHERE id_recurso IN (SELECT id_recurso FROM demo_recursos);
DELETE FROM recursos WHERE id_recurso IN (SELECT id_recurso FROM demo_recursos);

DELETE FROM ubicaciones WHERE direccion_referencia LIKE '[DEMO]%';
DELETE FROM usuarios WHERE correo = 'demo@biin.test';

COMMIT;
