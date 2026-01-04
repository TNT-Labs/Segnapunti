@echo off
echo ========================================
echo  Run Segnapunti on Android
echo ========================================
echo.

echo Starting Metro Bundler...
start "Metro Bundler" cmd /k "npm start"

timeout /t 3 /nobreak >nul

echo.
echo Running app on Android device/emulator...
echo.

call npx react-native run-android

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to run app!
    echo.
    echo Make sure:
    echo 1. Android device is connected OR emulator is running
    echo 2. USB debugging is enabled
    echo 3. adb devices shows your device
    echo.
    pause
    exit /b 1
)

echo.
echo App running successfully!
echo.
pause
