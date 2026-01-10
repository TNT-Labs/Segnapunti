# ===================================================
#  Script per cambiare Package Name
#  Da: com.segnapuntitemp
#  A:  com.tntlabs.segnapunti
# ===================================================

$ErrorActionPreference = "Stop"

$OLD_PACKAGE = "com.segnapuntitemp"
$NEW_PACKAGE = "com.tntlabs.segnapunti"

$OLD_PATH = "com/segnapuntitemp"
$NEW_PATH = "com/tntlabs/segnapunti"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Cambio Package Name" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Da: $OLD_PACKAGE" -ForegroundColor Yellow
Write-Host "A:  $NEW_PACKAGE" -ForegroundColor Green
Write-Host ""

# Verifica che siamo nella root del progetto
if (-not (Test-Path "android")) {
    Write-Host "[ERROR] Cartella android/ non trovata!" -ForegroundColor Red
    Write-Host "Assicurati di essere nella root del progetto Segnapunti" -ForegroundColor Red
    exit 1
}

Write-Host "[STEP 1/6] Backup file originali..." -ForegroundColor Cyan

# Crea backup
$backupDir = "backup_package_change_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Copy-Item "android/app/build.gradle" "$backupDir/build.gradle.bak" -Force
Copy-Item "android/app/src/main/AndroidManifest.xml" "$backupDir/AndroidManifest.main.bak" -Force

if (Test-Path "android/app/src/debug/AndroidManifest.xml") {
    Copy-Item "android/app/src/debug/AndroidManifest.xml" "$backupDir/AndroidManifest.debug.bak" -Force
}

Write-Host "[OK] Backup creato in: $backupDir" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 2/6] Modifica build.gradle..." -ForegroundColor Cyan

$buildGradle = Get-Content "android/app/build.gradle" -Raw
$buildGradle = $buildGradle -replace $OLD_PACKAGE, $NEW_PACKAGE
Set-Content "android/app/build.gradle" -Value $buildGradle

Write-Host "[OK] build.gradle aggiornato" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 3/6] Modifica AndroidManifest.xml..." -ForegroundColor Cyan

# Main manifest
$manifest = Get-Content "android/app/src/main/AndroidManifest.xml" -Raw
$manifest = $manifest -replace $OLD_PACKAGE, $NEW_PACKAGE
Set-Content "android/app/src/main/AndroidManifest.xml" -Value $manifest

Write-Host "[OK] AndroidManifest.xml (main) aggiornato" -ForegroundColor Green

# Debug manifest
if (Test-Path "android/app/src/debug/AndroidManifest.xml") {
    $debugManifest = Get-Content "android/app/src/debug/AndroidManifest.xml" -Raw
    $debugManifest = $debugManifest -replace $OLD_PACKAGE, $NEW_PACKAGE
    Set-Content "android/app/src/debug/AndroidManifest.xml" -Value $debugManifest
    Write-Host "[OK] AndroidManifest.xml (debug) aggiornato" -ForegroundColor Green
}

Write-Host ""

Write-Host "[STEP 4/6] Rinomina cartelle Java/Kotlin..." -ForegroundColor Cyan

# Percorsi sorgenti
$sourceTypes = @("main", "debug", "release")

foreach ($type in $sourceTypes) {
    $oldDir = "android/app/src/$type/java/$OLD_PATH"
    $newDir = "android/app/src/$type/java/$NEW_PATH"

    if (Test-Path $oldDir) {
        Write-Host "  Processing $type..." -ForegroundColor Yellow

        # Crea nuova struttura directory
        $newDirParent = Split-Path $newDir -Parent
        New-Item -ItemType Directory -Path $newDirParent -Force | Out-Null

        # Sposta contenuto
        if (-not (Test-Path $newDir)) {
            Move-Item $oldDir $newDir -Force
            Write-Host "  [OK] Cartella spostata: $type" -ForegroundColor Green
        } else {
            Write-Host "  [SKIP] Cartella già esistente: $type" -ForegroundColor Yellow
        }

        # Aggiorna package declaration nei file
        $javaFiles = Get-ChildItem -Path $newDir -Filter "*.java" -File
        $ktFiles = Get-ChildItem -Path $newDir -Filter "*.kt" -File
        $allFiles = $javaFiles + $ktFiles

        foreach ($file in $allFiles) {
            $content = Get-Content $file.FullName -Raw
            $content = $content -replace "package $OLD_PACKAGE", "package $NEW_PACKAGE"
            Set-Content $file.FullName -Value $content
            Write-Host "    Updated: $($file.Name)" -ForegroundColor Gray
        }
    }
}

Write-Host "[OK] Cartelle e file sorgenti aggiornati" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 5/6] Pulizia cartelle vuote..." -ForegroundColor Cyan

# Rimuovi vecchie cartelle vuote
$oldDirs = @(
    "android/app/src/main/java/com/segnapuntitemp",
    "android/app/src/debug/java/com/segnapuntitemp",
    "android/app/src/release/java/com/segnapuntitemp"
)

foreach ($dir in $oldDirs) {
    if (Test-Path $dir) {
        if ((Get-ChildItem $dir | Measure-Object).Count -eq 0) {
            Remove-Item $dir -Force -Recurse
            Write-Host "  Rimossa: $dir" -ForegroundColor Gray
        }
    }
}

Write-Host "[OK] Pulizia completata" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 6/6] Verifica finale..." -ForegroundColor Cyan

# Cerca eventuali riferimenti rimanenti
$remainingRefs = Get-ChildItem "android" -Recurse -File -Include *.gradle,*.xml,*.java,*.kt |
    Select-String $OLD_PACKAGE |
    Select-Object -ExpandProperty Path -Unique

if ($remainingRefs) {
    Write-Host ""
    Write-Host "[WARNING] Trovati riferimenti rimanenti a $OLD_PACKAGE nei seguenti file:" -ForegroundColor Yellow
    $remainingRefs | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "Verifica manualmente questi file!" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Nessun riferimento rimanente trovato!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " COMPLETATO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package name cambiato da:" -ForegroundColor White
Write-Host "  $OLD_PACKAGE" -ForegroundColor Red
Write-Host "a:" -ForegroundColor White
Write-Host "  $NEW_PACKAGE" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Verifica i file modificati" -ForegroundColor White
Write-Host "2. Esegui: cd android && gradlew clean" -ForegroundColor White
Write-Host "3. Esegui: build-aab.bat" -ForegroundColor White
Write-Host ""
Write-Host "Backup salvato in: $backupDir" -ForegroundColor Yellow
Write-Host ""
