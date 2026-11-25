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
    # 1. Carpeta indicada por el desarrollador (instalación portable o no estándar)
    if ($env:BIIN_PG_BIN) {
        $ruta = Join-Path $env:BIIN_PG_BIN "$nombre.exe"
        if (Test-Path $ruta) { return $ruta }
        $ruta = Join-Path $env:BIIN_PG_BIN $nombre
        if (Test-Path $ruta) { return $ruta }
    }
    # 2. Instaladores oficiales de Windows (16 o superior, la más nueva primero)
    foreach ($version in 18, 17, 16) {
        $ruta = "C:\Program Files\PostgreSQL\$version\bin\$nombre.exe"
        if (Test-Path $ruta) { return $ruta }
    }
    # 3. Lo que esté en el PATH
    $cmd = Get-Command $nombre -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    throw "No se encontró $nombre. Instala PostgreSQL 16 o superior, agrega su carpeta bin al PATH o define BIIN_PG_BIN."
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
    # Windows PowerShell 5.1 manda la entrada canalizada en ASCII y convierte
    # "á" o "ñ" en "?" (nombres y contraseñas). Se fuerza UTF-8 sin BOM.
    $encodingAnterior = $OutputEncoding
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    try {
        $base = @('-h', $Conexion.Servidor, '-p', $Conexion.Puerto, '-U', $Conexion.Usuario)
        if ($Entrada) { $salida = $Entrada | & $exe @base @Argumentos }
        else { $salida = & $exe @base @Argumentos }
        if ($LASTEXITCODE -ne 0) { throw "$Herramienta terminó con error ($LASTEXITCODE)." }
        $salida
    }
    finally {
        $OutputEncoding = $encodingAnterior
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

function Invoke-Psql($Conexion, [string]$Base, [string[]]$Argumentos, [string]$Entrada) {
    Invoke-PgComando -Conexion $Conexion -Herramienta 'psql' -Entrada $Entrada `
        -Argumentos (@('-d', $Base, '-v', 'ON_ERROR_STOP=1', '-q') + $Argumentos)
}

# Escapa un texto para usarlo como literal de SQL entre comillas simples
function ConvertTo-LiteralSql([string]$texto) { "'" + $texto.Replace("'", "''") + "'" }
