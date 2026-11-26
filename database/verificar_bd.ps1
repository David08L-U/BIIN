<#
.SYNOPSIS
    Comprueba que la base de BIIN esté completa y ejecuta las pruebas SQL.

.DESCRIPTION
    Revisa que existan las 31 tablas, las 3 vistas, la función f_normalizar,
    los roles del catálogo y que el usuario de la API pueda conectarse.
    Después ejecuta database/pruebas/*.sql (no dejan datos) y termina con
    error si alguna prueba falla. Pensado para correrlo después de crear o
    restaurar la base, y antes de abrir un pull request (RNF08).

.EXAMPLE
    ./database/verificar_bd.ps1
#>

. (Join-Path $PSScriptRoot '_comun.ps1')

$admin = Get-ConexionAdmin
$app = Get-Conexion 'Biin'
$base = $app.Base
$fallos = 0

function Write-Resultado([string]$caso, [bool]$ok, [string]$detalle) {
    $marca = if ($ok) { 'ok   ' } else { 'FALLO' }
    Write-Host ("  [{0}] {1} {2}" -f $marca, $caso, $detalle)
    if (-not $ok) { $script:fallos++ }
}

Write-Host "Estructura de '$base':"
$tablas = [int](Invoke-Psql $admin $base @('-tAc', "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"))
Write-Resultado 'Tablas del modelo' ($tablas -eq 31) "($tablas de 31)"

$vistas = [int](Invoke-Psql $admin $base @('-tAc', "SELECT count(*) FROM information_schema.views WHERE table_schema = 'public' AND table_name IN ('v_recursos_publicados', 'v_paradas_ruta', 'v_cupo_vigente')"))
Write-Resultado 'Vistas de consulta' ($vistas -eq 3) "($vistas de 3)"

# Va por la entrada estándar: Windows pasa los argumentos en ANSI y psql espera UTF-8
$funcion = Invoke-Psql $admin $base @('-tA') -Entrada "SELECT f_normalizar('Homún MÉRIDA');"
Write-Resultado 'Búsqueda sin acentos' ($funcion -eq 'homun merida') "(f_normalizar devuelve '$funcion')"

$roles = [int](Invoke-Psql $admin $base @('-tAc', "SELECT count(*) FROM roles WHERE nombre IN ('viajero', 'colaborador', 'operador', 'administrador')"))
Write-Resultado 'Catálogo de roles' ($roles -eq 4) "($roles de 4)"

if ($app.Usuario -ne $admin.Usuario) {
    try {
        $puede = Invoke-Psql $app $base @('-tAc', "SELECT has_table_privilege('usuarios', 'INSERT') AND NOT has_database_privilege(current_database(), 'CREATE')")
        Write-Resultado "Usuario de la API '$($app.Usuario)'" ($puede -eq 't') '(lee y escribe datos, no crea objetos)'
    }
    catch {
        Write-Resultado "Usuario de la API '$($app.Usuario)'" $false "(no se pudo conectar: $($_.Exception.Message))"
    }
}

Write-Host "Pruebas SQL:"
Get-ChildItem (Join-Path $script:Raiz 'database/pruebas') -Filter '*.sql' | Sort-Object Name | ForEach-Object {
    $salida = Invoke-Psql $admin $base @('-tA', '-F', '|', '-f', $_.FullName)
    # La última línea de cada archivo es "fallos|total"
    $resumen = ($salida | Where-Object { $_ -match '^\d+\|\d+$' } | Select-Object -Last 1)
    if (-not $resumen) {
        Write-Resultado $_.Name $false '(no se encontró el resumen de la prueba)'
        return
    }
    $partes = $resumen -split '\|'
    Write-Resultado $_.Name ([int]$partes[0] -eq 0) "($($partes[0]) fallos de $($partes[1]) casos)"
}

if ($fallos -gt 0) { throw "Hay $fallos comprobaciones con fallo." }
Write-Host "Listo: la base '$base' está completa y las pruebas pasan."
