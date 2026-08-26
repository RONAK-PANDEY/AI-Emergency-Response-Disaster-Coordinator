@echo off
title AI Emergency Response - Frontend UI

echo =======================================================================
echo     AI Emergency Response and Disaster Coordinator - Frontend UI
echo =======================================================================
echo.

cd /d "%~dp0"

if exist "my-hackathon-project\frontend" (
    cd /d "%~dp0my-hackathon-project\frontend"
) else if exist "frontend" (
    cd /d "%~dp0frontend"
)

echo [INFO] Current Folder: "%CD%"
echo.

if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
)

echo [INFO] Starting Frontend (React + Vite)...
echo [INFO] Frontend URL: http://localhost:5173
echo.

if exist "node_modules\vite\bin\vite.js" (
    node "node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173
) else (
    call npm run dev -- --host 127.0.0.1 --port 5173
)

if errorlevel 1 (
    echo.
    echo [ERROR] Frontend server stopped or failed to start.
)

echo.
echo Press any key to close this window...
pause >nul
