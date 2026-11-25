<#
.SYNOPSIS
    Carga o borra los datos de demostración (Homún como ejemplo).

.DESCRIPTION
    Los datos demo son ficticios y sirven para programar y probar mientras
    llegan los datos validados. Todo va marcado con [DEMO] o DEMO-.
    Las salidas se generan para hoy y los próximos 6 días: vuelve a cargar
    la demo (-Borrar y luego sin -Borrar) si ya pasaron esas fechas.

.EXAMPLE
    ./database/cargar_demo.ps1
    ./database/cargar_demo.ps1 -Borrar
#>
param([switch]$Borrar)

. (Join-Path $PSScriptRoot '_comun.ps1')

$admin = Get-ConexionAdmin
$base = (Get-Conexion 'Biin').Base
$carpeta = Join-Path $script:Raiz 'database/seed/demo'

if ($Borrar) {
    Write-Host "Borrando los datos de demostración..."
    Invoke-Psql $admin $base @('-f', (Join-Path $carpeta '999_borrar_demo.sql'))
    Write-Host "Listo."
    return
}

Get-ChildItem $carpeta -Filter '*.sql' | Where-Object Name -notlike '999_*' | Sort-Object Name | ForEach-Object {
    Write-Host "  Ejecutando database/seed/demo/$($_.Name)"
    Invoke-Psql $admin $base @('-f', $_.FullName)
}

$resumen = Invoke-Psql $admin $base @('-tAF', ' | ', '-c', @"
SELECT 'rutas', count(*) FROM rutas WHERE codigo LIKE 'DEMO-%'
UNION ALL SELECT 'salidas', count(*) FROM salidas s JOIN rutas r ON r.id_recurso = s.id_ruta WHERE r.codigo LIKE 'DEMO-%'
UNION ALL SELECT 'lugares, negocios y eventos', count(*) FROM recursos WHERE titulo LIKE '[DEMO]%' AND tipo <> 'ruta'
UNION ALL SELECT 'recorridos sugeridos', count(*) FROM recorridos_sugeridos WHERE titulo LIKE '[DEMO]%'
"@)
Write-Host "Demo cargada:"
$resumen | ForEach-Object { Write-Host "  $_" }
