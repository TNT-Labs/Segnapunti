@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================
echo  Segnapunti - Android APK Build Script
echo ========================================
echo.

REM Verifica che Node.js sia installato
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRORE] Node.js non trovato!
    echo.
    echo Installa Node.js da: https://nodejs.org/
    echo Versione consigliata: LTS (20.x o superiore^)
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js trovato:
node --version
echo.

REM Verifica che Java JDK sia installato
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRORE] Java JDK non trovato!
    echo.
    echo Installa Java JDK 17 da:
    echo https://adoptium.net/
    echo.
    echo Dopo l'installazione, assicurati di impostare JAVA_HOME
    echo.
    pause
    exit /b 1
)

echo [OK] Java trovato:
java -version
echo.

REM Verifica ANDROID_HOME
if "%ANDROID_HOME%"=="" (
    echo [AVVISO] ANDROID_HOME non configurato
    echo.
    echo Per build ottimali, installa Android Studio e configura:
    echo 1. Installa Android Studio da: https://developer.android.com/studio
    echo 2. Apri Android Studio -^> SDK Manager
    echo 3. Installa Android SDK (API 33 o superiore^)
    echo 4. Configura variabile d'ambiente ANDROID_HOME
    echo    Es: C:\Users\TuoNome\AppData\Local\Android\Sdk
    echo.
    echo Premi un tasto per continuare comunque (build potrebbe fallire^)...
    pause >nul
    echo.
) else (
    echo [OK] ANDROID_HOME configurato: %ANDROID_HOME%
    echo.
)

REM Verifica se node_modules esiste
if not exist "node_modules" (
    echo [STEP 1/5] Installazione dipendenze npm...
    echo.
    call npm install
    if !errorlevel! neq 0 (
        echo [ERRORE] Installazione npm fallita!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dipendenze installate con successo
    echo.
) else (
    echo [STEP 1/5] Dipendenze npm gia installate
    echo.
)

REM Verifica se la cartella android esiste
if not exist "android" (
    echo [STEP 2/5] Inizializzazione progetto Android con Capacitor...
    echo.
    call npx cap add android
    if !errorlevel! neq 0 (
        echo [ERRORE] Inizializzazione Android fallita!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Progetto Android creato
    echo.
) else (
    echo [STEP 2/5] Progetto Android gia esistente
    echo.
)

REM Prepara file web per Capacitor
echo [STEP 3/6] Preparazione file web...
echo.
call prepare-web.bat
if !errorlevel! neq 0 (
    echo [ERRORE] Preparazione file web fallita!
    pause
    exit /b 1
)

REM Sincronizza file web con Android
echo [STEP 4/6] Sincronizzazione file web con Android...
echo.
call npx cap sync android
if !errorlevel! neq 0 (
    echo [ERRORE] Sincronizzazione fallita!
    pause
    exit /b 1
)
echo.
echo [OK] Sincronizzazione completata
echo.

REM Chiedi se build debug o release
echo [STEP 5/6] Scegli il tipo di build:
echo.
echo 1. Debug (non firmato, per test^)
echo 2. Release (firmato, per distribuzione^)
echo.
choice /c 12 /n /m "Scelta (1 o 2): "
set BUILD_TYPE=!errorlevel!

if !BUILD_TYPE!==1 (
    echo.
    echo [STEP 6/6] Build APK Debug in corso...
    echo.
    cd android
    call gradlew.bat assembleDebug
    set GRADLE_EXIT=!errorlevel!
    cd ..

    if !GRADLE_EXIT! neq 0 (
        echo.
        echo [ERRORE] Build fallita!
        pause
        exit /b 1
    )

    echo.
    echo ========================================
    echo  BUILD COMPLETATA CON SUCCESSO!
    echo ========================================
    echo.
    echo APK Debug generato in:
    echo %CD%\android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Questo APK puo essere installato direttamente su dispositivi Android
    echo per test (richiede "Origini sconosciute" abilitato^).
    echo.

) else (
    echo.
    echo [STEP 6/6] Build APK Release in corso...
    echo.

    REM Verifica se esiste keystore
    if not exist "android\app\segnapunti-release.keystore" (
        echo [AVVISO] Keystore non trovato!
        echo.
        echo Per creare un APK firmato serve un keystore.
        echo.
        echo Vuoi crearne uno ora? (S/N^)
        choice /c SN /n /m "Scelta: "

        if !errorlevel!==1 (
            echo.
            echo Creazione keystore...
            echo.
            echo Inserisci le informazioni richieste:
            echo.

            cd android\app
            keytool -genkey -v -keystore segnapunti-release.keystore -alias segnapunti -keyalg RSA -keysize 2048 -validity 10000

            if !errorlevel! neq 0 (
                echo.
                echo [ERRORE] Creazione keystore fallita!
                cd ..\..
                pause
                exit /b 1
            )

            cd ..\..

            echo.
            echo [OK] Keystore creato: android\app\segnapunti-release.keystore
            echo.
            echo IMPORTANTE: Salva questo file e la password in un posto sicuro!
            echo Se lo perdi, non potrai piu aggiornare l'app su Google Play!
            echo.
            pause
        ) else (
            echo.
            echo [ERRORE] Build release richiede un keystore.
            echo Esegui di nuovo lo script e crea il keystore.
            echo.
            pause
            exit /b 1
        )
    )

    REM Configurazione firma APK
    echo.
    echo Configurazione firma APK...
    echo.
    set /p KEYSTORE_PASSWORD="Inserisci password keystore: "
    set /p KEY_PASSWORD="Inserisci password chiave (alias^): "

    REM Crea gradle.properties se non esiste
    (
        echo RELEASE_STORE_FILE=segnapunti-release.keystore
        echo RELEASE_STORE_PASSWORD=!KEYSTORE_PASSWORD!
        echo RELEASE_KEY_ALIAS=segnapunti
        echo RELEASE_KEY_PASSWORD=!KEY_PASSWORD!
    ) > android\gradle.properties

    echo.
    echo Build in corso (potrebbe richiedere alcuni minuti^)...
    echo.

    cd android
    call gradlew.bat assembleRelease
    set GRADLE_EXIT=!errorlevel!
    cd ..

    REM Rimuovi password dal file
    del android\gradle.properties

    if !GRADLE_EXIT! neq 0 (
        echo.
        echo [ERRORE] Build fallita!
        echo.
        echo Verifica:
        echo - Password keystore corretta
        echo - Android SDK installato correttamente
        echo - ANDROID_HOME configurato
        echo.
        pause
        exit /b 1
    )

    echo.
    echo ========================================
    echo  BUILD COMPLETATA CON SUCCESSO!
    echo ========================================
    echo.
    echo APK Release firmato generato in:
    echo %CD%\android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo Questo APK e pronto per essere distribuito su Google Play Store!
    echo.
)

echo Vuoi aprire la cartella con l'APK? (S/N^)
choice /c SN /n /m "Scelta: "

if !errorlevel!==1 (
    if !BUILD_TYPE!==1 (
        explorer "%CD%\android\app\build\outputs\apk\debug"
    ) else (
        explorer "%CD%\android\app\build\outputs\apk\release"
    )
)

echo.
echo Premi un tasto per uscire...
pause >nul

ENDLOCAL
