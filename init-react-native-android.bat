@echo off
echo ========================================
echo  Initialize React Native Android Project
echo ========================================
echo.

echo This script will create the Android native project.
echo.
echo WARNING: This will take several minutes and download ~500MB
echo.
pause

echo.
echo Creating temporary React Native project...
echo.

call npx react-native init SegnapuntiTemp --skip-install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to create React Native project!
    pause
    exit /b 1
)

echo.
echo Copying android folder...
echo.

xcopy /E /I /Y SegnapuntiTemp\android android

echo.
echo Cleaning up temporary files...
echo.

rmdir /s /q SegnapuntiTemp

echo.
echo ========================================
echo  ANDROID PROJECT INITIALIZED!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm install
echo 2. Run: build-react-native.bat
echo.
pause
