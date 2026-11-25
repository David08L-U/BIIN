<#
.SYNOPSIS
    Crea un usuario de BIIN con un rol, por ejemplo el primer administrador.

.DESCRIPTION
    El registro de la app solo crea viajeros. Este script crea administradores,
    operadores o colaboradores. La contraseña se pide en pantalla, se guarda con
    BCrypt (compatible con el login de la API) y nunca se escribe en archivos.
    Si el correo ya existe, solo le agrega el rol.

.EXAMPLE
    ./database/crear_usuario.ps1 -Correo admin@biin.mx -Nombre "Admin BIIN" -Rol administrador
    ./database/crear_usuario.ps1 -Correo chofer@biin.mx -Nombre "Chofer" -Rol operador -Rutas MER-HOM,HOM-MER
#>
param(
    [Parameter(Mandatory)] [string]$Correo,
    [Parameter(Mandatory)] [string]$Nombre,
    [Parameter(Mandatory)] [ValidateSet('administrador', 'operador', 'colaborador', 'viajero')] [string]$Rol,
    # Códigos de ruta que puede operar (solo para el rol operador)
    [string[]]$Rutas = @(),
    # Para automatizar; si no se da, se pide en pantalla
    [securestring]$Contrasena
)

. (Join-Path $PSScriptRoot '_comun.ps1')

if (-not $Contrasena) {
    $Contrasena = Read-Host "Contraseña para $Correo (mínimo 8 caracteres)" -AsSecureString
    $confirmacion = Read-Host "Repite la contraseña" -AsSecureString
    $a = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Contrasena))
    $b = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmacion))
    if ($a -cne $b) { throw "Las contraseñas no coinciden." }
}
$plano = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Contrasena))
if ($plano.Length -lt 8) { throw "La contraseña debe tener al menos 8 caracteres." }

$admin = Get-ConexionAdmin
$base = (Get-Conexion 'Biin').Base
$correoSql = ConvertTo-LiteralSql $Correo.Trim().ToLower()
$rutasSql = if ($Rutas.Count) { "ARRAY[" + (($Rutas | ForEach-Object { ConvertTo-LiteralSql $_ }) -join ',') + "]::text[]" } else { "ARRAY[]::text[]" }

# Todo va por la entrada estándar para que la contraseña no aparezca en la línea de comandos
$sql = @"
BEGIN;

INSERT INTO usuarios (nombre, correo, hash_contrasena)
SELECT $(ConvertTo-LiteralSql $Nombre.Trim()), $correoSql, crypt($(ConvertTo-LiteralSql $plano), gen_salt('bf', 11))
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE lower(correo) = $correoSql);

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM usuarios u, roles r
WHERE lower(u.correo) = $correoSql AND r.nombre = $(ConvertTo-LiteralSql $Rol)
ON CONFLICT DO NOTHING;

-- Todos los usuarios también son viajeros
INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM usuarios u, roles r
WHERE lower(u.correo) = $correoSql AND r.nombre = 'viajero'
ON CONFLICT DO NOTHING;

DO `$`$
DECLARE
    v_faltan text[];
BEGIN
    SELECT array_agg(c) INTO v_faltan
    FROM unnest($rutasSql) AS c
    WHERE NOT EXISTS (SELECT 1 FROM rutas WHERE codigo = c);
    IF v_faltan IS NOT NULL THEN
        RAISE EXCEPTION 'No existen las rutas: %', array_to_string(v_faltan, ', ');
    END IF;
END
`$`$;

INSERT INTO operador_ruta (id_usuario, id_ruta)
SELECT u.id_usuario, rt.id_recurso
FROM usuarios u
JOIN rutas rt ON rt.codigo = ANY ($rutasSql)
WHERE lower(u.correo) = $correoSql
ON CONFLICT DO NOTHING;

COMMIT;

SELECT u.id_usuario, u.correo, string_agg(r.nombre, ', ' ORDER BY r.nombre) AS roles
FROM usuarios u
JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
JOIN roles r ON r.id_rol = ur.id_rol
WHERE lower(u.correo) = $correoSql
GROUP BY u.id_usuario, u.correo;
"@

try {
    Invoke-Psql $admin $base @() -Entrada $sql
}
finally {
    $plano = $null
    $sql = $null
}
