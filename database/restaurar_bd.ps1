<#
.SYNOPSIS
    Restaura un respaldo de database/backups/ sobre la base de BIIN.

.DESCRIPTION
    Borra la base actual, la crea vacía, carga el respaldo y vuelve a dar
    permisos al usuario de la API. Sin -Archivo usa el respaldo más reciente.
    Se pierden los datos actuales: pide confirmación antes de borrar.

.EXAMPLE
    ./database/restaurar_bd.ps1
    ./database/restaurar_bd.ps1 -Archivo database/backups/biin_20261116_180000.dump
#>
param([string]$Archivo)

. (Join-Path $PSScriptRoot '_comun.ps1')

if (-not $Archivo) {
    $ultimo = Get-ChildItem (Join-Path $script:Raiz 'database/backups') -Filter '*.dump' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $ultimo) { throw "No hay respaldos en database/backups. Ejecuta primero respaldar_bd.ps1." }
    $Archivo = $ultimo.FullName
}
if (-not (Test-Path $Archivo)) { throw "No existe el archivo $Archivo." }

$admin = Get-ConexionAdmin
$app = Get-Conexion 'Biin'
$base = $app.Base

$respuesta = Read-Host "Se borrará la base '$base' y se cargará $(Split-Path -Leaf $Archivo). Escribe SI para continuar"
if ($respuesta -cne 'SI') { Write-Host "Cancelado."; return }

Invoke-Psql $admin 'postgres' @('-c', "DROP DATABASE IF EXISTS $base WITH (FORCE)")
Invoke-Psql $admin 'postgres' @('-c', "CREATE DATABASE $base ENCODING 'UTF8' TEMPLATE template0")
Invoke-PgComando -Conexion $admin -Herramienta 'pg_restore' -Argumentos @('-d', $base, '--no-owner', '--exit-on-error', $Archivo)

if ($app.Usuario -ne $admin.Usuario) {
    $archivoSql = (Join-Path $script:Raiz 'database/seguridad/001_usuario_app.sql') -replace '\\', '/'
    $entrada = @(
        "\set app_usuario $(ConvertTo-LiteralSql $app.Usuario)",
        "\set app_contrasena $(ConvertTo-LiteralSql $app.Contrasena)",
        "\i '$archivoSql'"
    ) -join "`n"
    Invoke-Psql $admin $base @() -Entrada $entrada | Out-Null
}

Write-Host "Listo: '$base' restaurada desde $Archivo"
