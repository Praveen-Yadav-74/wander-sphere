@echo off
echo Building WanderSphere Travel App using Command Prompt...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Build the project
echo Building project...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error: Build failed.
    pause
    exit /b 1
)

echo.
echo Build completed successfully! The build output is in the dist directory.
echo.

pause