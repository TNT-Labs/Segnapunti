#Requires -Version 5.1
<#
.SYNOPSIS
    Script PowerShell per build automatico di Segnapunti (React Native Android)

.DESCRIPTION
    Questo script gestisce l'intero processo di build per l'app Segnapunti:
    - Verifica prerequisiti (Node, Java, Android SDK)
    - Installa dipendenze npm
    - Genera APK Debug, APK Release o AAB per Google Play

.PARAMETER BuildType
    Tipo di build: Debug, Release, AAB

.PARAMETER Clean
    Esegue clean prima del build

.PARAMETER SkipChecks
    Salta i controlli dei prerequisiti

.EXAMPLE
    .\Build-Segnapunti.ps1 -BuildType Debug

.EXAMPLE
    .\Build-Segnapunti.ps1 -BuildType AAB -Clean

.NOTES
    Requisiti:
    - Windows 10/11
    - Node.js 18+
    - Java JDK 17
    - Android SDK con ANDROID_HOME configurato
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("Debug", "Release", "AAB")]
    [string]$BuildType = "Debug",

    [Parameter(Mandatory = $false)]
    [switch]$Clean,

    [Parameter(Mandatory = $false)]
    [switch]$SkipChecks,

    [Parameter(Mandatory = $false)]
    [switch]$OpenOutput
)

# Colori per output
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor $InfoColor
    Write-Host "  $Text" -ForegroundColor $InfoColor
    Write-Host ("=" * 60) -ForegroundColor $InfoColor
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [string]$Text)
    Write-Host "[$Step] " -ForegroundColor $InfoColor -NoNewline
    Write-Host $Text
}

function Write-Success {
    param([string]$Text)
    Write-Host "[OK] " -ForegroundColor $SuccessColor -NoNewline
    Write-Host $Text
}

function Write-Error {
    param([string]$Text)
    Write-Host "[ERRORE] " -ForegroundColor $ErrorColor -NoNewline
    Write-Host $Text -ForegroundColor $ErrorColor
}

function Write-Warning {
    param([string]$Text)
    Write-Host "[AVVISO] " -ForegroundColor $WarningColor -NoNewline
    Write-Host $Text
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Test-Prerequisites {
    Write-Header "Verifica Prerequisiti"
    $allOk = $true

    # Node.js
    Write-Step "1/4" "Controllo Node.js..."
    if (Test-Command "node") {
        $nodeVersion = node --version
        Write-Success "Node.js $nodeVersion"

        # Verifica versione minima 18
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($versionNumber -lt 18) {
            Write-Warning "Node.js 18+ raccomandato (attuale: $nodeVersion)"
        }
    } else {
        Write-Error "Node.js non trovato!"
        Write-Host "  Installa da: https://nodejs.org/" -ForegroundColor $WarningColor
        $allOk = $false
    }

    # Java
    Write-Step "2/4" "Controllo Java JDK..."
    if (Test-Command "java") {
        $javaVersion = java -version 2>&1 | Select-Object -First 1
        Write-Success "Java trovato: $javaVersion"

        # Verifica JAVA_HOME
        if (-not $env:JAVA_HOME) {
            Write-Warning "JAVA_HOME non configurato (potrebbe causare problemi)"
        }
    } else {
        Write-Error "Java JDK non trovato!"
        Write-Host "  Installa JDK 17 da: https://adoptium.net/" -ForegroundColor $WarningColor
        $allOk = $false
    }

    # Android SDK
    Write-Step "3/4" "Controllo Android SDK..."
    if ($env:ANDROID_HOME) {
        if (Test-Path $env:ANDROID_HOME) {
            Write-Success "ANDROID_HOME: $env:ANDROID_HOME"

            # Verifica platform-tools
            $adbPath = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
            if (Test-Path $adbPath) {
                Write-Success "ADB trovato"
            } else {
                Write-Warning "ADB non trovato in platform-tools"
            }
        } else {
            Write-Error "ANDROID_HOME punta a directory inesistente: $env:ANDROID_HOME"
            $allOk = $false
        }
    } else {
        Write-Error "ANDROID_HOME non configurato!"
        Write-Host "  Configura variabile d'ambiente:" -ForegroundColor $WarningColor
        Write-Host "  ANDROID_HOME=C:\Users\<TuoNome>\AppData\Local\Android\Sdk" -ForegroundColor $WarningColor
        $allOk = $false
    }

    # Cartella Android
    Write-Step "4/4" "Controllo progetto Android..."
    $androidPath = Join-Path $PSScriptRoot "android"
    if (Test-Path $androidPath) {
        Write-Success "Cartella android/ presente"

        # Verifica keystore per release
        $releaseKeystore = Join-Path $androidPath "app\segnapunti-release.keystore"
        if (Test-Path $releaseKeystore) {
            Write-Success "Keystore release presente"
        } else {
            if ($BuildType -ne "Debug") {
                Write-Warning "Keystore release non trovato - richiesto per build Release/AAB"
            }
        }
    } else {
        Write-Error "Cartella android/ non trovata!"
        $allOk = $false
    }

    return $allOk
}

function Install-Dependencies {
    Write-Header "Installazione Dipendenze"

    $nodeModulesPath = Join-Path $PSScriptRoot "node_modules"

    if (Test-Path $nodeModulesPath) {
        Write-Success "node_modules gia' presente"

        $response = Read-Host "Reinstallare dipendenze? (S/N)"
        if ($response -eq "S" -or $response -eq "s") {
            Write-Step "NPM" "Reinstallazione dipendenze..."
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "npm install fallito!"
                return $false
            }
        }
    } else {
        Write-Step "NPM" "Installazione dipendenze..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "npm install fallito!"
            return $false
        }
    }

    Write-Success "Dipendenze pronte"
    return $true
}

function Invoke-GradleBuild {
    param(
        [string]$Task,
        [bool]$DoClean
    )

    Write-Header "Build Android"

    $androidPath = Join-Path $PSScriptRoot "android"
    Push-Location $androidPath

    try {
        # Clean se richiesto
        if ($DoClean) {
            Write-Step "GRADLE" "Pulizia build precedente..."
            & .\gradlew.bat clean
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Clean fallito, continuo comunque..."
            }
        }

        # Build
        Write-Step "GRADLE" "Esecuzione task: $Task"
        Write-Host ""
        Write-Host "Questo potrebbe richiedere alcuni minuti..." -ForegroundColor $WarningColor
        Write-Host ""

        & .\gradlew.bat $Task --warning-mode all

        return $LASTEXITCODE -eq 0
    }
    finally {
        Pop-Location
    }
}

function Get-OutputPath {
    param([string]$Type)

    $basePath = Join-Path $PSScriptRoot "android\app\build\outputs"

    switch ($Type) {
        "Debug" {
            return Join-Path $basePath "apk\debug\app-debug.apk"
        }
        "Release" {
            return Join-Path $basePath "apk\release\app-release.apk"
        }
        "AAB" {
            return Join-Path $basePath "bundle\release\app-release.aab"
        }
    }
}

function Show-BuildResult {
    param(
        [bool]$Success,
        [string]$Type
    )

    Write-Host ""

    if ($Success) {
        Write-Header "BUILD COMPLETATO CON SUCCESSO!"

        $outputPath = Get-OutputPath -Type $Type

        if (Test-Path $outputPath) {
            $fileInfo = Get-Item $outputPath
            $sizeMB = [math]::Round($fileInfo.Length / 1MB, 2)

            Write-Host "File generato:" -ForegroundColor $SuccessColor
            Write-Host "  $outputPath" -ForegroundColor White
            Write-Host ""
            Write-Host "Dimensione: $sizeMB MB" -ForegroundColor $InfoColor
            Write-Host "Modificato: $($fileInfo.LastWriteTime)" -ForegroundColor $InfoColor

            if ($Type -eq "Debug") {
                Write-Host ""
                Write-Host "Per installare su dispositivo:" -ForegroundColor $InfoColor
                Write-Host "  adb install `"$outputPath`"" -ForegroundColor White
            }
            elseif ($Type -eq "AAB") {
                Write-Host ""
                Write-Host "PROSSIMI PASSI PER GOOGLE PLAY:" -ForegroundColor $InfoColor
                Write-Host "  1. Vai su: https://play.google.com/console" -ForegroundColor White
                Write-Host "  2. Seleziona l'app Segnapunti" -ForegroundColor White
                Write-Host "  3. Produzione > Crea nuova release" -ForegroundColor White
                Write-Host "  4. Carica: app-release.aab" -ForegroundColor White
                Write-Host "  5. Compila le note di rilascio" -ForegroundColor White
                Write-Host "  6. Revisiona e pubblica" -ForegroundColor White
            }

            return $outputPath
        } else {
            Write-Warning "File output non trovato nel percorso atteso"
            Write-Host "  Atteso: $outputPath" -ForegroundColor $WarningColor
        }
    } else {
        Write-Header "BUILD FALLITO"

        Write-Host "Suggerimenti per risolvere:" -ForegroundColor $WarningColor
        Write-Host "  1. Verifica che ANDROID_HOME sia configurato correttamente" -ForegroundColor White
        Write-Host "  2. Verifica che Java JDK 17 sia installato" -ForegroundColor White
        Write-Host "  3. Prova: .\Build-Segnapunti.ps1 -BuildType Debug -Clean" -ForegroundColor White
        Write-Host "  4. Controlla i log sopra per errori specifici" -ForegroundColor White

        if ($BuildType -ne "Debug") {
            Write-Host ""
            Write-Host "Per build Release/AAB verifica anche:" -ForegroundColor $WarningColor
            Write-Host "  - Keystore presente in android\app\" -ForegroundColor White
            Write-Host "  - Credenziali corrette in android\gradle.properties" -ForegroundColor White
        }
    }

    return $null
}

# ============================================
# MAIN
# ============================================

Write-Header "Segnapunti - Build Script PowerShell"
Write-Host "Build Type: $BuildType" -ForegroundColor $InfoColor
Write-Host "Clean: $Clean" -ForegroundColor $InfoColor
Write-Host ""

# Vai alla directory dello script
Set-Location $PSScriptRoot

# 1. Verifica prerequisiti
if (-not $SkipChecks) {
    $prereqOk = Test-Prerequisites
    if (-not $prereqOk) {
        Write-Host ""
        Write-Error "Prerequisiti mancanti. Correggi gli errori sopra e riprova."
        exit 1
    }
}

# 2. Installa dipendenze
$depsOk = Install-Dependencies
if (-not $depsOk) {
    exit 1
}

# 3. Determina task Gradle
$gradleTask = switch ($BuildType) {
    "Debug"   { "assembleDebug" }
    "Release" { "assembleRelease" }
    "AAB"     { "bundleRelease" }
}

# 4. Esegui build
$buildSuccess = Invoke-GradleBuild -Task $gradleTask -DoClean $Clean

# 5. Mostra risultato
$outputFile = Show-BuildResult -Success $buildSuccess -Type $BuildType

# 6. Apri cartella output se richiesto
if ($OpenOutput -and $outputFile -and (Test-Path $outputFile)) {
    $outputDir = Split-Path $outputFile -Parent
    Start-Process explorer.exe -ArgumentList $outputDir
}

Write-Host ""
if ($buildSuccess) {
    Write-Host "Premi un tasto per uscire..." -ForegroundColor $InfoColor
} else {
    Write-Host "Premi un tasto per uscire..." -ForegroundColor $ErrorColor
}
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
