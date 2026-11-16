<#
    Funciones compartidas por los scripts de database/.
    Lee las conexiones de backend/src/Biin.Api/appsettings.Development.json:
      ConnectionStrings:BiinAdmin  usuario postgres, solo para estos scripts
      ConnectionStrings:Biin       usuario con el que se conecta la API
#>

$ErrorActionPreference = "Stop"
$script:Raiz = Split-Path -Parent $PSScriptRoot

function Get-Conexion([string]$nombre) {
    $config = Join-Path $script:Raiz "backend/src/Biin.Api/appsettings.Development.json"
    if (-not (Test-Path $config)) {
        throw "No existe $config. Copia appsettings.Development.example.json y pon tus contraseñas ahí (no en la plantilla)."
    }
    $cadena = (Get-Content $config -Raw | ConvertFrom-Json).ConnectionStrings.$nombre
    if (-not $cadena) { throw "Falta ConnectionStrings:$nombre en $config." }

    $p = @{}
    foreach ($par in $cadena -split ';') {
        if ($par -match '^\s*([^=]+)=(.*)$') { $p[$Matches[1].Trim().ToLower()] = $Matches[2].Trim() }
    }
    if ($p['password'] -like '*CAMBIA_ESTO*') {
        throw "Pon la contraseña de ConnectionStrings:$nombre en $config."
    }
    [pscustomobject]@{
        Servidor   = if ($p['host']) { $p['host'] } else { 'localhost' }
        Puerto     = if ($p['port']) { $p['port'] } else { '5432' }
        Usuario    = if ($p['username']) { $p['username'] } else { 'postgres' }
        Base       = if ($p['database']) { $p['database'] } else { 'biin' }
        Contrasena = $p['password']
    }
}

function Get-ConexionAdmin {
    # Compatibilidad: configuraciones viejas solo tienen "Biin" con el usuario postgres
    try { Get-Conexion 'BiinAdmin' } catch { Get-Conexion 'Biin' }
}

function Find-HerramientaPg([string]$nombre) {
    $ruta = "C:\Program Files\PostgreSQL\18\bin\$nombre.exe"
    if (Test-Path $ruta) { return $ruta }
    $cmd = Get-Command $nombre -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    throw "No se encontró $nombre. Instala PostgreSQL 18 o agrega su carpeta bin al PATH."
}

function Invoke-PgComando {
    param(
        [Parameter(Mandatory)] $Conexion,
        [Parameter(Mandatory)] [string]$Herramienta,
        [Parameter(Mandatory)] [string[]]$Argumentos,
        [string]$Entrada
    )
    $exe = Find-HerramientaPg $Herramienta
    $env:PGPASSWORD = $Conexion.Contrasena
    $env:PGCLIENTENCODING = 'UTF8'
    try {
        $base = @('-h', $Conexion.Servidor, '-p', $Conexion.Puerto, '-U', $Conexion.Usuario)
        if ($Entrada) { $salida = $Entrada | & $exe @base @Argumentos }
        else { $salida = & $exe @base @Argumentos }
        if ($LASTEXITCODE -ne 0) { throw "$Herramienta terminó con error ($LASTEXITCODE)." }
        $salida
    }
    finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

function Invoke-Psql($Conexion, [string]$Base, [string[]]$Argumentos, [string]$Entrada) {
    Invoke-PgComando -Conexion $Conexion -Herramienta 'psql' -Entrada $Entrada `
        -Argumentos (@('-d', $Base, '-v', 'ON_ERROR_STOP=1', '-q') + $Argumentos)
}

# Escapa un texto para usarlo como literal de SQL entre comillas simples
function ConvertTo-LiteralSql([string]$texto) { "'" + $texto.Replace("'", "''") + "'" }
