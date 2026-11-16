<#
.SYNOPSIS
    Crea la base de datos de BIIN y ejecuta todos los scripts en orden.

.DESCRIPTION
    Lee la cadena de conexión de backend/src/Biin.Api/appsettings.Development.json,
    crea la base si no existe y ejecuta schema, triggers y seed.
    Con -Recrear borra la base y la crea de nuevo (se pierden los datos).

.EXAMPLE
    ./database/crear_bd.ps1
    ./database/crear_bd.ps1 -Recrear
#>
param(
    [switch]$Recrear,
    [string]$Psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$config = Join-Path $raiz "backend/src/Biin.Api/appsettings.Development.json"

if (-not (Test-Path $config)) {
    throw "No existe $config. Copia appsettings.Development.example.json y pon tu contraseña."
}
if (-not (Test-Path $Psql)) {
    $Psql = (Get-Command psql -ErrorAction SilentlyContinue).Source
    if (-not $Psql) { throw "No se encontró psql. Instala PostgreSQL o indica la ruta con -Psql." }
}

# Convierte "Host=...;Port=...;..." en un diccionario
$cadena = (Get-Content $config -Raw | ConvertFrom-Json).ConnectionStrings.Biin
$partes = @{}
foreach ($par in $cadena -split ';') {
    if ($par -match '^\s*([^=]+)=(.*)$') { $partes[$Matches[1].Trim().ToLower()] = $Matches[2].Trim() }
}
if ($partes['password'] -like '*CAMBIA_ESTO*') {
    throw "Pon tu contraseña de PostgreSQL en $config antes de continuar."
}

$servidor = if ($partes['host']) { $partes['host'] } else { 'localhost' }
$puerto   = if ($partes['port']) { $partes['port'] } else { '5432' }
$usuario  = if ($partes['username']) { $partes['username'] } else { 'postgres' }
$base     = if ($partes['database']) { $partes['database'] } else { 'biin' }

$env:PGPASSWORD = $partes['password']
$env:PGCLIENTENCODING = 'UTF8'

function Invoke-Psql([string]$bd, [string[]]$argumentos) {
    & $Psql -h $servidor -p $puerto -U $usuario -d $bd -v ON_ERROR_STOP=1 -q @argumentos
    if ($LASTEXITCODE -ne 0) { throw "psql terminó con error ($LASTEXITCODE)." }
}

try {
    $existe = & $Psql -h $servidor -p $puerto -U $usuario -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$base'"
    if ($LASTEXITCODE -ne 0) { throw "No se pudo conectar a PostgreSQL. Revisa la contraseña y que el servicio esté encendido." }

    if ($existe -eq '1' -and $Recrear) {
        Write-Host "Borrando la base '$base'..."
        Invoke-Psql 'postgres' @('-c', "DROP DATABASE $base WITH (FORCE)")
        $existe = $null
    }
    elseif ($existe -eq '1') {
        throw "La base '$base' ya existe. Usa -Recrear para borrarla y crearla de nuevo."
    }

    Write-Host "Creando la base '$base'..."
    Invoke-Psql 'postgres' @('-c', "CREATE DATABASE $base ENCODING 'UTF8' TEMPLATE template0")

    $scripts = @(
        'database/schema/001_esquema.sql',
        'database/schema/002_ampliaciones_mvp.sql',
        'database/triggers/001_reglas.sql',
        'database/seed/001_catalogos.sql'
    )
    foreach ($s in $scripts) {
        Write-Host "  Ejecutando $s"
        Invoke-Psql $base @('-f', (Join-Path $raiz $s))
    }

    $tablas = & $Psql -h $servidor -p $puerto -U $usuario -d $base -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"
    Write-Host "Listo: la base '$base' tiene $tablas tablas."
}
finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
