@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================
echo  Segnapunti - Build AAB for Google Play
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

echo [STEP 2/3] Choose build option:
echo.
echo 1. Clean build (recommended for first build)
echo 2. Quick build (skip clean)
echo.
choice /c 12 /n /m "Choice (1 or 2): "
set CLEAN_BUILD=!errorlevel!

echo.
echo [STEP 3/3] Building AAB for Google Play...
echo.

cd android

if !CLEAN_BUILD!==1 (
    echo Cleaning previous build...
    call gradlew.bat clean
    if !errorlevel! neq 0 (
        echo [WARNING] Clean failed, continuing anyway...
    )
    echo.
)

echo Building Release AAB...
echo This may take a few minutes...
echo.

call gradlew.bat bundleRelease
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
    echo Required gradle.properties content:
    echo MYAPP_UPLOAD_STORE_FILE=segnapunti-release.keystore
    echo MYAPP_UPLOAD_KEY_ALIAS=segnapunti
    echo MYAPP_UPLOAD_STORE_PASSWORD=yourpassword
    echo MYAPP_UPLOAD_KEY_PASSWORD=yourpassword
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  BUILD SUCCESSFUL!
echo ========================================
echo.
echo Release AAB generated at:
echo %CD%\android\app\build\outputs\bundle\release\app-release.aab
echo.
echo ----------------------------------------
echo  NEXT STEPS:
echo ----------------------------------------
echo.
echo 1. Go to: https://play.google.com/console
echo 2. Select your app
echo 3. Production ^> Create new release
echo 4. Upload: app-release.aab
echo 5. Fill in release notes
echo 6. Review and rollout
echo.
echo ----------------------------------------
echo  FILE INFO:
echo ----------------------------------------

if exist "android\app\build\outputs\bundle\release\app-release.aab" (
    for %%A in ("android\app\build\outputs\bundle\release\app-release.aab") do (
        echo File size: %%~zA bytes
        echo Modified: %%~tA
    )
)

echo.
echo Open AAB folder? (Y/N)
choice /c YN /n /m "Choice: "

if !errorlevel!==1 (
    explorer "%CD%\android\app\build\outputs\bundle\release"
)

echo.
echo Press any key to exit...
pause >nul

ENDLOCAL
