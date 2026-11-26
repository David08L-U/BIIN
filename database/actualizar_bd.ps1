<#
.SYNOPSIS
    Aplica a una base de BIIN que ya existe los scripts agregados después de crearla.

.DESCRIPTION
    Pensado para quien creó la base antes de que existiera una tabla nueva y no
    quiere perder sus datos con crear_bd.ps1 -Recrear. Ejecuta los scripts
    idempotentes (CREATE ... IF NOT EXISTS) y vuelve a dar permisos al usuario
    de la API sobre lo nuevo. Se puede correr varias veces sin problema.

    Hoy aplica:
      database/schema/005_verificacion_correo.sql   registros_pendientes (RF01)

.EXAMPLE
    ./database/actualizar_bd.ps1
#>

. (Join-Path $PSScriptRoot '_comun.ps1')

$admin = Get-ConexionAdmin
$app = Get-Conexion 'Biin'
$base = $app.Base

$existe = Invoke-Psql $admin 'postgres' @('-tAc', "SELECT 1 FROM pg_database WHERE datname = '$base'")
if ($existe -ne '1') {
    throw "La base '$base' no existe. Créala con ./database/crear_bd.ps1."
}

$scripts = @(
    'database/schema/005_verificacion_correo.sql'
)
foreach ($s in $scripts) {
    Write-Host "  Ejecutando $s"
    Invoke-Psql $admin $base @('-f', (Join-Path $script:Raiz $s))
}

if ($app.Usuario -ne $admin.Usuario) {
    Write-Host "  Actualizando los permisos de '$($app.Usuario)'"
    $archivo = (Join-Path $script:Raiz 'database/seguridad/001_usuario_app.sql') -replace '\\', '/'
    $entrada = @(
        "\set app_usuario $(ConvertTo-LiteralSql $app.Usuario)",
        "\set app_contrasena $(ConvertTo-LiteralSql $app.Contrasena)",
        "\i '$archivo'"
    ) -join "`n"
    Invoke-Psql $admin $base @() -Entrada $entrada | Out-Null
}

$tablas = Invoke-Psql $admin $base @('-tAc', "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")
Write-Host "Listo: la base '$base' tiene $tablas tablas. Comprueba con ./database/verificar_bd.ps1."
