@echo off
echo ========================================
echo  Apertura progetto in Android Studio
echo ========================================
echo.

if not exist "android" (
    echo [ERRORE] Cartella android non trovata!
    echo.
    echo Esegui prima build-android.bat per inizializzare il progetto.
    echo.
    pause
    exit /b 1
)

echo Apertura Android Studio...
echo.

call npx cap open android

if %errorlevel% neq 0 (
    echo.
    echo [ERRORE] Impossibile aprire Android Studio
    echo.
    echo Verifica che Android Studio sia installato
    echo.
    pause
    exit /b 1
)

echo.
echo Android Studio dovrebbe aprirsi a breve...
echo.
pause
