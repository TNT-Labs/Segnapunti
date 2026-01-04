@echo off
REM Script per preparare i file web per Capacitor

echo Preparazione file web per Capacitor...
echo.

REM Crea directory www se non esiste
if not exist "www" mkdir www

REM Copia file HTML
echo Copiando file HTML...
copy /Y *.html www\ >nul 2>&1

REM Copia file CSS
echo Copiando file CSS...
copy /Y *.css www\ >nul 2>&1

REM Copia file JavaScript
echo Copiando file JavaScript...
copy /Y *.js www\ >nul 2>&1

REM Copia manifest e favicon
echo Copiando manifest e icone...
copy /Y manifest.json www\ >nul 2>&1
copy /Y favicon.ico www\ >nul 2>&1

REM Copia tutte le immagini PNG
echo Copiando immagini...
copy /Y *.png www\ >nul 2>&1

REM Copia cartella locales
if exist "locales" (
    echo Copiando traduzioni...
    if not exist "www\locales" mkdir www\locales
    xcopy /E /I /Y locales www\locales >nul 2>&1
)

REM Copia cartella screenshots
if exist "screenshots" (
    echo Copiando screenshot...
    if not exist "www\screenshots" mkdir www\screenshots
    xcopy /E /I /Y screenshots www\screenshots >nul 2>&1
)

REM Copia cartella .well-known
if exist ".well-known" (
    echo Copiando .well-known...
    if not exist "www\.well-known" mkdir www\.well-known
    xcopy /E /I /Y .well-known www\.well-known >nul 2>&1
)

echo.
echo [OK] File web preparati in www\
echo.
