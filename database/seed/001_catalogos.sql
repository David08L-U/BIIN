-- BIIN: catálogos base que el sistema necesita para funcionar
-- Municipios, rutas, negocios y eventos se cargan con datos validados.

INSERT INTO roles (nombre) VALUES
    ('viajero'),
    ('colaborador'),
    ('operador'),
    ('administrador')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO categorias (nombre) VALUES
    ('Comida regional'),
    ('Mariscos'),
    ('Cocina económica'),
    ('Postres y antojitos'),
    ('Bazar'),
    ('Baile'),
    ('Música'),
    ('Feria y vaquería'),
    ('Cenote'),
    ('Zona arqueológica'),
    ('Playa'),
    ('Paisaje'),
    ('Iglesia y convento'),
    ('Museo')
ON CONFLICT (nombre) DO NOTHING;
