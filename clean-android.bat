@echo off
echo ========================================
echo  Pulizia Build Android
echo ========================================
echo.

if not exist "android" (
    echo [ERRORE] Cartella android non trovata!
    echo Niente da pulire.
    echo.
    pause
    exit /b 0
)

echo Questa operazione eliminera tutti i file di build.
echo.
echo Vuoi continuare? (S/N)
choice /c SN /n /m "Scelta: "

if %errorlevel%==2 (
    echo.
    echo Operazione annullata.
    pause
    exit /b 0
)

echo.
echo Pulizia in corso...
echo.

cd android
call gradlew.bat clean
set GRADLE_EXIT=%errorlevel%
cd ..

if %GRADLE_EXIT% neq 0 (
    echo.
    echo [ERRORE] Pulizia fallita!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  PULIZIA COMPLETATA
echo ========================================
echo.
echo File di build eliminati con successo.
echo Esegui build-android.bat per ricostruire l'APK.
echo.
pause
