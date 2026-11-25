<#
.SYNOPSIS
    Crea la base de datos de BIIN y ejecuta todos los scripts en orden.

.DESCRIPTION
    Usa ConnectionStrings:BiinAdmin (postgres) para crear la base, las tablas y
    el usuario de la API definido en ConnectionStrings:Biin (biin_app).
    Con -Recrear borra la base y la crea de nuevo (se pierden los datos).

    Con -Demo carga además los datos de demostración de Homún.

.EXAMPLE
    ./database/crear_bd.ps1
    ./database/crear_bd.ps1 -Recrear -Demo
#>
param([switch]$Recrear, [switch]$Demo)

. (Join-Path $PSScriptRoot '_comun.ps1')

$admin = Get-ConexionAdmin
$app = Get-Conexion 'Biin'
$base = $app.Base

$existe = Invoke-Psql $admin 'postgres' @('-tAc', "SELECT 1 FROM pg_database WHERE datname = '$base'")

if ($existe -eq '1' -and -not $Recrear) {
    throw "La base '$base' ya existe. Usa -Recrear para borrarla y crearla de nuevo (se pierden los datos)."
}
if ($existe -eq '1') {
    Write-Host "Borrando la base '$base'..."
    Invoke-Psql $admin 'postgres' @('-c', "DROP DATABASE $base WITH (FORCE)")
}

Write-Host "Creando la base '$base'..."
Invoke-Psql $admin 'postgres' @('-c', "CREATE DATABASE $base ENCODING 'UTF8' TEMPLATE template0")

$scripts = @(
    'database/schema/001_esquema.sql',
    'database/schema/002_ampliaciones_mvp.sql',
    'database/schema/003_busqueda.sql',
    'database/schema/004_vistas.sql',
    'database/triggers/001_reglas.sql',
    'database/seed/001_catalogos.sql'
)
foreach ($s in $scripts) {
    Write-Host "  Ejecutando $s"
    Invoke-Psql $admin $base @('-f', (Join-Path $script:Raiz $s))
}

if ($app.Usuario -ne $admin.Usuario) {
    Write-Host "  Creando el usuario de la API '$($app.Usuario)' con permisos limitados"
    # La contraseña va por la entrada estándar, no en la línea de comandos
    $archivo = (Join-Path $script:Raiz 'database/seguridad/001_usuario_app.sql') -replace '\\', '/'
    $entrada = @(
        "\set app_usuario $(ConvertTo-LiteralSql $app.Usuario)",
        "\set app_contrasena $(ConvertTo-LiteralSql $app.Contrasena)",
        "\i '$archivo'"
    ) -join "`n"
    Invoke-Psql $admin $base @() -Entrada $entrada | Out-Null
}
else {
    Write-Warning "La API usa el usuario '$($admin.Usuario)'. Se recomienda biin_app (ver appsettings.Development.example.json)."
}

$tablas = Invoke-Psql $admin $base @('-tAc', "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")
Write-Host "Listo: la base '$base' tiene $tablas tablas."

if ($Demo) {
    & (Join-Path $PSScriptRoot 'cargar_demo.ps1')
}
