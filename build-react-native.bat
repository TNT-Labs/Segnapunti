@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================
echo  Segnapunti React Native - Build Script
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Install from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js:
node --version
echo.

REM Check Java
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Java JDK not found!
    echo Install JDK 17 from: https://adoptium.net/
    pause
    exit /b 1
)

echo [OK] Java:
java -version
echo.

REM Check ANDROID_HOME
if "%ANDROID_HOME%"=="" (
    echo [ERROR] ANDROID_HOME not configured!
    echo.
    echo Install Android Studio and configure:
    echo ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
    echo.
    pause
    exit /b 1
)

echo [OK] ANDROID_HOME: %ANDROID_HOME%
echo.

REM Check android folder
if not exist "android" (
    echo [ERROR] Android project not found!
    echo.
    echo Initialize React Native Android project:
    echo 1. npx react-native init SegnapuntiTemp
    echo 2. Copy SegnapuntiTemp\android to current folder
    echo 3. Delete SegnapuntiTemp
    echo.
    pause
    exit /b 1
)

REM Install dependencies
if not exist "node_modules" (
    echo [STEP 1/3] Installing npm dependencies...
    echo.
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed
    echo.
) else (
    echo [STEP 1/3] Dependencies already installed
    echo.
)

REM Choose build type
echo [STEP 2/3] Choose build type:
echo.
echo 1. Debug (unsigned, for testing)
echo 2. Release (signed, for distribution)
echo.
choice /c 12 /n /m "Choice (1 or 2): "
set BUILD_TYPE=!errorlevel!

echo.
echo [STEP 3/3] Building APK...
echo.

cd android

if !BUILD_TYPE!==1 (
    echo Building Debug APK...
    call gradlew.bat assembleDebug
    set GRADLE_EXIT=!errorlevel!
    cd ..

    if !GRADLE_EXIT! neq 0 (
        echo.
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )

    echo.
    echo ========================================
    echo  BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Debug APK generated at:
    echo %CD%\android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Install on device:
    echo adb install android\app\build\outputs\apk\debug\app-debug.apk
    echo.

) else (
    echo Building Release APK...
    call gradlew.bat assembleRelease
    set GRADLE_EXIT=!errorlevel!
    cd ..

    if !GRADLE_EXIT! neq 0 (
        echo.
        echo [ERROR] Build failed!
        echo.
        echo Make sure you have configured signing:
        echo 1. Create keystore in android\app\
        echo 2. Configure android\gradle.properties
        echo.
        pause
        exit /b 1
    )

    echo.
    echo ========================================
    echo  BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Release APK generated at:
    echo %CD%\android\app\build\outputs\apk\release\app-release.apk
    echo.
)

echo Open APK folder? (Y/N)
choice /c YN /n /m "Choice: "

if !errorlevel!==1 (
    if !BUILD_TYPE!==1 (
        explorer "%CD%\android\app\build\outputs\apk\debug"
    ) else (
        explorer "%CD%\android\app\build\outputs\apk\release"
    )
)

echo.
echo Press any key to exit...
pause >nul

ENDLOCAL
