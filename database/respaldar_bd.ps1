<#
.SYNOPSIS
    Respalda la base de BIIN en database/backups/ (paquete 8.2.4).

.DESCRIPTION
    Genera un archivo .dump con fecha y hora usando pg_dump en formato
    personalizado. La carpeta backups/ está en .gitignore: los respaldos
    pueden tener datos de usuarios y no se suben al repositorio.

.EXAMPLE
    ./database/respaldar_bd.ps1
#>

. (Join-Path $PSScriptRoot '_comun.ps1')

$admin = Get-ConexionAdmin
$base = (Get-Conexion 'Biin').Base

$carpeta = Join-Path $script:Raiz 'database/backups'
New-Item -ItemType Directory -Force -Path $carpeta | Out-Null
$archivo = Join-Path $carpeta ("{0}_{1}.dump" -f $base, (Get-Date -Format 'yyyyMMdd_HHmmss'))

Write-Host "Respaldando '$base'..."
Invoke-PgComando -Conexion $admin -Herramienta 'pg_dump' -Argumentos @(
    '-d', $base, '-Fc', '--no-owner', '--no-privileges', '-f', $archivo
)

$tamano = [math]::Round((Get-Item $archivo).Length / 1KB, 1)
Write-Host "Listo: $archivo ($tamano KB)"
