<#
.SYNOPSIS
    Prepara una instancia MongoDB aislada y autenticada para el laboratorio E03.

.DESCRIPTION
    La guia de la Semana 1 (seccion 5.6) indica: "Cada equipo de trabajo debe
    tener una instancia aislada o una base/cuenta equivalente". Este script crea
    una instancia aislada en un puerto propio, con su propio dbPath, de modo que
    la base de datos del instructor (puerto 27017) y sus colecciones de E01/E02
    NO se toquen.

    Pasos:
      1. Crea la estructura .lab/mongodb/{data,log}.
      2. Levanta mongod SIN autenticacion (solo localhost) para poder crear el
         usuario de practica mediante la excepcion de localhost.
      3. Crea el usuario de practica `aprendiz_nosql` en la base de autenticacion
         `emprendimiento_sena_lab` con permisos readWrite + dbAdmin sobre esa base.
      4. Reinicia mongod CON --auth y deja el proceso en segundo plano.
      5. Verifica la conexion autenticada (ping, base y collections).

    No se escribe ninguna contrasena en el codigo del entregable: la contrasena
    se genera y se guarda unicamente en .lab/mongodb/credenciales.txt y
    .lab/mongodb/password.txt, ambos incluidos en .gitignore.

    NOTA TECNICA: los archivos .js temporales que se entregan a mongosh se
    escriben SIN BOM (UTF-8Encoding(false)). Windows PowerShell 5.1 usa
    `Set-Content -Encoding UTF8`, que antepone el BOM EF BB BF y hace que
    mongosh rechace el archivo con un error de sintaxis silencioso; ese error
    fue la causa de que el usuario de practica quedara sin crear (ver
    docs/bitacora_errores.md, entrada BE-01).

.PARAMETER Puerto
    Puerto TCP de la instancia aislada. Por defecto 27018.

.PARAMETER Mongod
    Ruta al ejecutable mongod.exe. Si se omite se busca en las instalaciones
    habituales de MongoDB para Windows.

.PARAMETER Detener
    Detiene la instancia aislada si ya esta corriendo.

.PARAMETER Reparar
    Detiene la instancia (si existe) y vuelve a crear el usuario de practica.
    Util cuando la instancia quedo con --auth pero sin usuario valido.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\00_preparar_lab_mongodb.ps1
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\00_preparar_lab_mongodb.ps1 -Reparar
#>
[CmdletBinding()]
param(
    [int]$Puerto = 27018,
    [string]$Mongod = '',
    [switch]$Detener,
    [switch]$Reparar
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RaizProyecto = Split-Path -Parent $PSScriptRoot
$LabDir       = Join-Path $RaizProyecto '.lab\mongodb'
$DataDir      = Join-Path $LabDir 'data'
$LogDir       = Join-Path $LabDir 'log'
$LogFile      = Join-Path $LogDir 'mongod.log'
$CredFile     = Join-Path $LabDir 'credenciales.txt'
$PasswordFile = Join-Path $LabDir 'password.txt'
$BaseLab      = 'emprendimiento_sena_lab'
$UsuarioLab   = 'aprendiz_nosql'

# --------------------------------------------------------------------- helpers
function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

function Resolve-Mongod {
    param([string]$Candidate)
    if ($Candidate) {
        if (-not (Test-Path $Candidate)) { throw "No existe el ejecutable mongod indicado: $Candidate" }
        return (Resolve-Path $Candidate).Path
    }
    $cmd = Get-Command mongod.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $roots = Get-ChildItem 'C:\Program Files\MongoDB\Server' -Directory -ErrorAction SilentlyContinue |
             Sort-Object Name -Descending
    foreach ($r in $roots) {
        $exe = Join-Path $r.FullName 'bin\mongod.exe'
        if (Test-Path $exe) { return $exe }
    }
    throw 'No se encontro mongod.exe. Indique la ruta con -Mongod.'
}

function Get-Mongosh {
    $cmd = Get-Command mongosh.cmd -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $cmd = Get-Command mongosh -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source -notlike '*.ps1') { return $cmd.Source }
    $npmDir = Join-Path $env:APPDATA 'npm'
    $cand = Join-Path $npmDir 'mongosh.cmd'
    if (Test-Path $cand) { return $cand }
    throw 'No se encontro mongosh. Instalelo con: npm install -g mongosh'
}

function Get-LabProcess {
    param([int]$Port)
    $cim = Get-CimInstance Win32_Process -Filter "Name='mongod.exe'" -ErrorAction SilentlyContinue
    foreach ($p in $cim) {
        if ($p.CommandLine -match "--port\s+$Port\b") { return $p }
    }
    return $null
}

function Stop-LabMongod {
    param([int]$Port)
    $p = Get-LabProcess -Port $Port
    if ($p) {
        Write-Host "[lab] Deteniendo la instancia del puerto $Port (PID $($p.ProcessId))..."
        Stop-Process -Id $p.ProcessId -Force
        Start-Sleep -Seconds 2
        return $true
    }
    return $false
}

function Start-LabMongod {
    param([int]$Port, [string]$DataPath, [string]$LogPath, [switch]$ConAuth)
    $args = @(
        '--dbpath', $DataPath,
        '--port', "$Port",
        '--bind_ip', '127.0.0.1',
        '--logpath', $LogPath,
        '--logappend'
    )
    if ($ConAuth) { $args += '--auth' }
    return Start-Process -FilePath $script:mongodExe -ArgumentList $args -PassThru -WindowStyle Hidden
}

function Wait-LabReady {
    param([int]$Port, [string]$MongoShell, [int]$Segundos = 45)
    $deadline = (Get-Date).AddSeconds($Segundos)
    while ((Get-Date) -lt $deadline) {
        try {
            $probe = & $MongoShell "mongodb://127.0.0.1:$Port/?directConnection=true" --quiet --eval 'db.runCommand({ping:1}).ok' 2>$null
            if ($probe -match '1') { return $true }
        } catch { }
        Start-Sleep -Milliseconds 800
    }
    return $false
}

# ----------------------------------------------------------------- resolucion
$mongodExe = Resolve-Mongod -Candidate $Mongod
$mongoshExe = Get-Mongosh
Write-Host "[lab] mongod  : $mongodExe"
Write-Host "[lab] mongosh : $mongoshExe"

# ------------------------------------------------------------------- apagado
if ($Detener) {
    if (Stop-LabMongod -Port $Puerto) {
        Write-Host '[lab] Instancia detenida.'
    } else {
        Write-Host "[lab] No habia ninguna instancia escuchando en el puerto $Puerto."
    }
    return
}

$vivo = Get-LabProcess -Port $Puerto
if ($vivo -and -not $Reparar) {
    Write-Host "[lab] Ya existe una instancia en el puerto $Puerto (PID $($vivo.ProcessId))."
    Write-Host '[lab] Use -Detener para detenerla o -Reparar para recrear el usuario de practica.'
    return
}
if ($vivo -and $Reparar) {
    Write-Host '[lab] Modo -Reparar: se detiene la instancia actual.'
    Stop-LabMongod -Port $Puerto | Out-Null
}

# ----------------------------------------------------------- contrasena previa
New-Item -ItemType Directory -Force -Path $LabDir | Out-Null
if (Test-Path $PasswordFile) {
    $password = (Get-Content $PasswordFile -Raw).Trim()
    Write-Host '[lab] Se reutiliza la contrasena de practica ya generada.'
} else {
    $password = -join ((1..24) | ForEach-Object {
        $chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        $chars[(Get-Random -Maximum $chars.Length)]
    })
    Set-Content -Path $PasswordFile -Value $password -Encoding ASCII -NoNewline
    Write-Host '[lab] Contrasena de practica generada en .lab\mongodb\password.txt'
}

# ------------------------------------------------------------------- arranque
New-Item -ItemType Directory -Force -Path $DataDir, $LogDir | Out-Null

Write-Host "[lab] 1/5 Levantando mongod sin autenticacion en el puerto $Puerto..."
$proc = Start-LabMongod -Port $Puerto -DataPath $DataDir -LogPath $LogFile
if (-not (Wait-LabReady -Port $Puerto -MongoShell $mongoshExe)) {
    throw "mongod no respondio en el puerto $Puerto. Revise $LogFile"
}
Write-Host "[lab]     listo (PID $($proc.Id))"

Write-Host "[lab] 2/5 Creando el usuario de practica $UsuarioLab en $BaseLab..."
$passLiteral = $password.Replace("'", "''")
$js = @"
// El usuario de practica vive en la MISMA base que actua como base de
// autenticacion (emprendimiento_sena_lab), tal como lo describe la guia.
const lab = db.getSiblingDB('$BaseLab');
const yaExiste = lab.getUser('$UsuarioLab');
if (!yaExiste) {
  lab.createUser({
    user: '$UsuarioLab',
    pwd: '$passLiteral',
    roles: [
      { role: 'readWrite', db: '$BaseLab' },
      { role: 'dbAdmin',   db: '$BaseLab' }
    ]
  });
}
const creado = lab.getUser('$UsuarioLab');
print('USUARIO_OK=' + (creado ? '1' : '0'));
print('USUARIO_DB=' + (creado ? creado.db : 'null'));
"@
$jsFile = Join-Path $LabDir '_create_user.js'
Write-Utf8NoBom -Path $jsFile -Content $js
$createOut = & $mongoshExe "mongodb://127.0.0.1:$Puerto/admin?directConnection=true" --quiet --file $jsFile 2>&1
$createOut | ForEach-Object { Write-Host "       $_" }
Remove-Item $jsFile -Force -ErrorAction SilentlyContinue
if (($createOut | Out-String) -notmatch 'USUARIO_OK=1') {
    throw 'No se pudo crear el usuario de practica. Revise el bloque anterior y el log de mongod.'
}

Write-Host '[lab] 3/5 Deteniendo la instancia temporal...'
Stop-Process -Id $proc.Id -Force
Start-Sleep -Seconds 2

Write-Host "[lab] 4/5 Reiniciando mongod CON --auth en el puerto $Puerto..."
$proc = Start-LabMongod -Port $Puerto -DataPath $DataDir -LogPath $LogFile -ConAuth
if (-not (Wait-LabReady -Port $Puerto -MongoShell $mongoshExe)) {
    throw "mongod autenticado no respondio en el puerto $Puerto. Revise $LogFile"
}

Write-Host '[lab] 5/5 Verificando la conexion autenticada...'
$verify = @"
db = db.getSiblingDB('$BaseLab');
print('ping=' + db.runCommand({ping:1}).ok);
print('db=' + db.getName());
print('colecciones=' + db.getCollectionNames().length);
print('server=' + db.version());
"@
$verifyFile = Join-Path $LabDir '_verify.js'
Write-Utf8NoBom -Path $verifyFile -Content $verify
$verifyOut = & $mongoshExe "mongodb://127.0.0.1:${Puerto}/${BaseLab}?directConnection=true" --username $UsuarioLab --password $password --authenticationDatabase $BaseLab --quiet --file $verifyFile 2>&1
$verifyOut | ForEach-Object { Write-Host "       $_" }
Remove-Item $verifyFile -Force -ErrorAction SilentlyContinue
$verifyText = $verifyOut | Out-String
if ($verifyText -notmatch 'ping=1' -or $verifyText -match 'Authentication failed') {
    throw "La verificacion autenticada fallo. Revise el usuario, la contrasena y la base de autenticacion."
}

# ------------------------------------------------------------ credenciales
@"
Instancia MongoDB aislada del laboratorio E03
================================================
Host              : 127.0.0.1
Puerto            : $Puerto
Base de datos     : $BaseLab
Base de auth      : $BaseLab
Usuario           : $UsuarioLab
Contrasena        : $password

URI (sin contrasena):
  mongodb://127.0.0.1:$Puerto/$BaseLab

Conexion sin escribir la contrasena en la linea de comandos:
  mongosh "mongodb://127.0.0.1:$Puerto/$BaseLab" ^
    --username $UsuarioLab ^
    --authenticationDatabase $BaseLab

Archivo con la contrasena para las variables de entorno:
  .lab\mongodb\password.txt
"@ | Write-Utf8NoBom -Path $CredFile

Write-Host ''
Write-Host '[lab] INSTANCIA LISTA.'
Write-Host "[lab]   mongodb://127.0.0.1:$Puerto/$BaseLab"
Write-Host "[lab]   usuario: $UsuarioLab (base de autenticacion: $BaseLab)"
Write-Host "[lab]   credenciales: $CredFile"
Write-Host "[lab]   datos: $DataDir"
