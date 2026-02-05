param(
    [ValidateSet("debug", "release", "aab", "menu")]
    [string]$Mode = "menu"
)

$ErrorActionPreference = "Stop"

# Root progetto = cartella dove si trova lo script
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = $ScriptDir
$AndroidDir  = Join-Path $ProjectRoot "android"
$AppDir      = Join-Path $AndroidDir "app"

function Write-Title($text) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Command($name, $friendlyName) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "[ERRORE] $friendlyName (`$name`) non trovato nel PATH."
    }
}

function Check-GoogleServices {
    Write-Host "[CHECK] google-services.json..." -NoNewline
    $gsPath = Join-Path $AppDir "google-services.json"

    if (-not (Test-Path $gsPath)) {
        Write-Warning " google-services.json NON trovato in android/app. La build può riuscire, ma i servizi Google/AdMob non funzioneranno."
        return
    }

    Write-Host " OK"

    try {
        $content = Get-Content $gsPath -Raw
        if ($content -match "segnapunti-placeholder" -or $content -match "DummyKeyForPlaceholder") {
            Write-Warning " google-services.json sembra un PLACEHOLDER. Sostituiscilo con il file reale da Firebase per la produzione."
        }
    }
    catch {
        Write-Warning " impossibile leggere google-services.json: $($_.Exception.Message)"
    }
}

function Check-Prerequisites {
    Write-Title "Verifica prerequisiti"

    # Node.js
    Write-Host "[CHECK] Node.js..." -NoNewline
    Check-Command "node" "Node.js"
    $nodeVersion = node --version
    Write-Host " OK ($nodeVersion)"

    # Java
    Write-Host "[CHECK] Java..." -NoNewline
    Check-Command "java" "Java JDK"
    $javaVersionOutput = java -version 2>&1
    Write-Host " OK"
    Write-Host $javaVersionOutput

    if ($javaVersionOutput -notmatch "version `"?1[7-9]\." -and $javaVersionOutput -notmatch "version `"?2[0-9]\.") {
        Write-Warning "Java non sembra essere JDK 17+ (output sopra). React Native 0.76 richiede JDK 17 o superiore."
    }

    # ANDROID_HOME
    Write-Host "[CHECK] ANDROID_HOME..." -NoNewline
    if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
        throw "[ERRORE] Variabile d'ambiente ANDROID_HOME non configurata o percorso non valido."
    }
    Write-Host " OK ($($env:ANDROID_HOME))"

    # Cartella android
    Write-Host "[CHECK] cartella android/..." -NoNewline
    if (-not (Test-Path $AndroidDir)) {
        Write-Host " MANCANTE"
        throw "La cartella 'android/' non esiste. Se vuoi rigenerarla, esegui 'init-react-native-android.bat' manualmente."
    }
    else {
        Write-Host " OK"
    }

    # gradlew.bat
    Write-Host "[CHECK] gradlew.bat..." -NoNewline
    $gradlew = Join-Path $AndroidDir "gradlew.bat"
    if (-not (Test-Path $gradlew)) {
        throw "[ERRORE] File gradlew.bat non trovato in 'android/'."
    }
    Write-Host " OK"

    # google-services.json
    Check-GoogleServices
}

function Ensure-Dependencies {
    Write-Title "Verifica / installazione dipendenze NPM"

    Set-Location $ProjectRoot

    if (-not (Test-Path "node_modules")) {
        Write-Host "[INFO] 'node_modules' non trovato. Eseguo 'npm install'..."
        npm install
        Write-Host "[OK] Dipendenze installate."
    }
    else {
        Write-Host "[OK] 'node_modules' già presente. Salto 'npm install'."
    }
}

function Open-OutputFolder($path) {
    $dir = Split-Path $path -Parent
    if (Test-Path $dir) {
        Write-Host ""
        Write-Host "Apro la cartella in Esplora file..." -ForegroundColor Cyan
        Start-Process explorer.exe $dir
    }
}

function Build-DebugApk {
    Write-Title "Build APK DEBUG"

    Set-Location $AndroidDir
    .\gradlew.bat assembleDebug

    $apkPath = Join-Path $AppDir "build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        Write-Host "[SUCCESSO] APK debug generato:" -ForegroundColor Green
        Write-Host "  $apkPath"
        Open-OutputFolder $apkPath
    }
    else {
        Write-Warning "Build completata ma APK debug non trovato nel percorso atteso."
    }
}

function Build-ReleaseApk {
    Write-Title "Build APK RELEASE (firmato)"

    Set-Location $AndroidDir
    .\gradlew.bat assembleRelease

    $apkPath = Join-Path $AppDir "build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        Write-Host "[SUCCESSO] APK release generato:" -ForegroundColor Green
        Write-Host "  $apkPath"
        Open-OutputFolder $apkPath
    }
    else {
        Write-Warning "Build completata ma APK release non trovato nel percorso atteso."
    }
}

function Build-ReleaseAab {
    Write-Title "Build AAB RELEASE (Google Play)"

    Set-Location $AndroidDir
    .\gradlew.bat bundleRelease

    $aabPath = Join-Path $AppDir "build\outputs\bundle\release\app-release.aab"
    if (Test-Path $aabPath) {
        Write-Host "[SUCCESSO] AAB release generato:" -ForegroundColor Green
        Write-Host "  $aabPath"
        Open-OutputFolder $aabPath
    }
    else {
        Write-Warning "Build completata ma AAB non trovato nel percorso atteso."
    }
}

function Clean-Build {
    Write-Title "Pulizia build (gradlew clean)"

    Set-Location $AndroidDir
    .\gradlew.bat clean
    Write-Host "[OK] Pulizia completata."
}

function Show-Menu {
    Write-Title "Segnapunti - Build Menu (PowerShell)"

    Write-Host "1) Build APK DEBUG"
    Write-Host "2) Build APK RELEASE (firmato)"
    Write-Host "3) Build AAB RELEASE (Google Play)"
    Write-Host "4) Clean build"
    Write-Host "5) Esci"
    Write-Host ""

    $choice = Read-Host "Seleziona un'opzione (1-5)"

    switch ($choice) {
        "1" { $global:Mode = "debug" }
        "2" { $global:Mode = "release" }
        "3" { $global:Mode = "aab" }
        "4" { Clean-Build; return }
        "5" { Write-Host "Uscita."; return }
        default {
            Write-Warning "Scelta non valida."
            return
        }
    }

    Main
}

function Main {
    try {
        Check-Prerequisites
        Ensure-Dependencies

        switch ($Mode) {
            "debug"   { Build-DebugApk }
            "release" { Build-ReleaseApk }
            "aab"     { Build-ReleaseAab }
            "menu"    { Show-Menu }
        }

        Write-Host ""
        Write-Host "Operazione completata." -ForegroundColor Green
    }
    catch {
        Write-Host ""
        Write-Host ">>> ERRORE: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Dettagli completi:"
        Write-Host $_.Exception.ToString() -ForegroundColor DarkRed
        exit 1
    }
}

if ($Mode -eq "menu") {
    Show-Menu
}
else {
    Main
}

param(
    [ValidateSet("debug", "release", "aab", "menu")]
    [string]$Mode = "menu"
)

# ============================
#  Configurazione di base
# ============================

$ErrorActionPreference = "Stop"

# Usa sempre la cartella dove si trova lo script come root del progetto
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = $ScriptDir
$AndroidDir  = Join-Path $ProjectRoot "android"
$AppDir      = Join-Path $AndroidDir "app"

function Write-Title($text) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Command($name, $friendlyName) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "[ERRORE] $friendlyName (`$name`) non trovato nel PATH."
    }
}

function Check-Prerequisites {
    Write-Title "Verifica prerequisiti"

    # Node.js
    Write-Host "[CHECK] Node.js..." -NoNewline
    Check-Command "node" "Node.js"
    $nodeVersion = node --version
    Write-Host " OK ($nodeVersion)"

    # Java
    Write-Host "[CHECK] Java..." -NoNewline
    Check-Command "java" "Java JDK"
    $javaVersionOutput = java -version 2>&1
    Write-Host " OK"
    Write-Host $javaVersionOutput

    if ($javaVersionOutput -notmatch "version `"?1[7-9]\." -and $javaVersionOutput -notmatch "version `"?2[0-9]\.") {
        Write-Warning "Java non sembra essere JDK 17+ (output sopra). React Native 0.76 richiede JDK 17 o superiore."
    }

    # ANDROID_HOME
    Write-Host "[CHECK] ANDROID_HOME..." -NoNewline
    if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
        throw "[ERRORE] Variabile d'ambiente ANDROID_HOME non configurata o percorso non valido."
    }
    Write-Host " OK ($($env:ANDROID_HOME))"

    # Cartella android
    Write-Host "[CHECK] cartella android/..." -NoNewline
    if (-not (Test-Path $AndroidDir)) {
        Write-Host " MANCANTE"
        throw "La cartella 'android/' non esiste. Se vuoi rigenerarla, esegui 'init-react-native-android.bat' manualmente."
    } else {
        Write-Host " OK"
    }

    # gradlew.bat
    Write-Host "[CHECK] gradlew.bat..." -NoNewline
    $gradlew = Join-Path $AndroidDir "gradlew.bat"
    if (-not (Test-Path $gradlew)) {
        throw "[ERRORE] File gradlew.bat non trovato in 'android/'."
    }
    Write-Host " OK"
}

function Ensure-Dependencies {
    Write-Title "Verifica / installazione dipendenze NPM"

    Set-Location $ProjectRoot

    if (-not (Test-Path "node_modules")) {
        Write-Host "[INFO] 'node_modules' non trovato. Eseguo 'npm install'..."
        npm install
        Write-Host "[OK] Dipendenze installate."
    } else {
        Write-Host "[OK] 'node_modules' già presente. Salto 'npm install'."
    }
}

function Build-DebugApk {
    Write-Title "Build APK DEBUG"

    Set-Location $AndroidDir
    .\gradlew.bat assembleDebug

    $apkPath = Join-Path $AppDir "build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        Write-Host "[SUCCESSO] APK debug generato:" -ForegroundColor Green
        Write-Host "  $apkPath"
    } else {
        Write-Warning "Build completata ma APK debug non trovato nel percorso atteso."
    }
}

function Build-ReleaseApk {
    Write-Title "Build APK RELEASE (firmato)"

    Set-Location $AndroidDir
    .\gradlew.bat assembleRelease

    $apkPath = Join-Path $AppDir "build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        Write-Host "[SUCCESSO] APK release generato:" -ForegroundColor Green
        Write-Host "  $apkPath"
    } else {
        Write-Warning "Build completata ma APK release non trovato nel percorso atteso."
    }
}

function Build-ReleaseAab {
    Write-Title "Build AAB RELEASE (Google Play)"

    Set-Location $AndroidDir
    .\gradlew.bat bundleRelease

    $aabPath = Join-Path $AppDir "build\outputs\bundle\release\app-release.aab"
    if (Test-Path $aabPath) {
        Write-Host "[SUCCESSO] AAB release generato:" -ForegroundColor Green
        Write-Host "  $aabPath"
    } else {
        Write-Warning "Build completata ma AAB non trovato nel percorso atteso."
    }
}

function Clean-Build {
    Write-Title "Pulizia build (gradlew clean)"

    Set-Location $AndroidDir
    .\gradlew.bat clean
    Write-Host "[OK] Pulizia completata."
}

function Show-Menu {
    Write-Title "Segnapunti - Build Menu (PowerShell)"

    Write-Host "1) Build APK DEBUG"
    Write-Host "2) Build APK RELEASE (firmato)"
    Write-Host "3) Build AAB RELEASE (Google Play)"
    Write-Host "4) Clean build"
    Write-Host "5) Esci"
    Write-Host ""

    $choice = Read-Host "Seleziona un'opzione (1-5)"

    switch ($choice) {
        "1" { $global:Mode = "debug" }
        "2" { $global:Mode = "release" }
        "3" { $global:Mode = "aab" }
        "4" { Clean-Build; return }
        "5" { Write-Host "Uscita."; return }
        default {
            Write-Warning "Scelta non valida."
            return
        }
    }

    Main
}

function Main {
    try {
        Check-Prerequisites
        Ensure-Dependencies

        switch ($Mode) {
            "debug"   { Build-DebugApk }
            "release" { Build-ReleaseApk }
            "aab"     { Build-ReleaseAab }
            "menu"    { Show-Menu }
        }

        Write-Host ""
        Write-Host "Operazione completata." -ForegroundColor Green
    }
    catch {
        Write-Host ""
        Write-Host ">>> ERRORE: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Dettagli completi:"
        Write-Host $_.Exception.ToString() -ForegroundColor DarkRed
        exit 1
    }
}

# Entry point
if ($Mode -eq "menu") {
    Show-Menu
} else {
    Main
}