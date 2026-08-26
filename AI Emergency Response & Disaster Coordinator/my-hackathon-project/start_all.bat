@echo off
title AI Emergency Response - Main Launcher

echo =======================================================================
echo     AI Emergency Response and Disaster Coordinator - Full Stack
echo =======================================================================
echo.
echo Starting Backend API and Frontend UI in separate windows...
echo.

cd /d "%~dp0"

REM 1. Start Backend API in a separate terminal window
echo [1/2] Launching Backend API server (Port 8000)...
start "AI Emergency - Backend API (Port 8000)" cmd /k "start_backend.bat"

REM Brief pause
timeout /t 2 /nobreak >nul

REM 2. Start Frontend UI in a separate terminal window
echo [2/2] Launching Frontend UI dev server (Port 5173)...
start "AI Emergency - Frontend UI (Port 5173)" cmd /k "start_frontend.bat"

REM Wait 3 seconds then open default browser
timeout /t 3 /nobreak >nul

echo.
echo =======================================================================
echo  Services launched successfully!
echo.
echo  - Frontend Web UI:      http://localhost:5173
echo  - Backend API:          http://localhost:8000
echo  - Interactive Swagger:  http://localhost:8000/docs
echo =======================================================================
echo.
echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo You can keep this window open or close it.
echo Both servers will continue running in their own windows.
echo.
echo Press any key to exit this launcher window...
pause >nul
