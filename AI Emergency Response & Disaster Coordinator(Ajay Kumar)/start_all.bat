@echo off
title National Emergency Intelligence & Response System - Master Launcher
setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0"

echo ============================================================
echo   NATIONAL DISASTER INTELLIGENCE & RESCUE PLATFORM
echo   Launching Dual Independent Portals + Shared Central Engine
echo ============================================================
echo.
echo [1/3] Starting Shared FastAPI Backend Engine (:8000)...
start "Shared Backend API (:8000)" cmd /k "cd /d ""%ROOT_DIR%my-hackathon-project\backend"" && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [INFO] Waiting for backend initialization...
timeout /t 3 /nobreak >nul

echo [2/3] Starting Citizen Reporter Portal (:5174)...
start "Citizen Reporter Portal (:5174)" cmd /k "cd /d ""%ROOT_DIR%reporter-portal"" && node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174"

echo [3/3] Starting Government Officer Command Portal (:5175)...
start "Officer Command Portal (:5175)" cmd /k "cd /d ""%ROOT_DIR%officer-portal"" && node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5175"

echo [INFO] Waiting for frontend servers to start...
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo   ALL PORTALS ARE NOW RUNNING!
echo   👤 Citizen Portal:      http://localhost:5174
echo   🏛️ Government Portal:   http://localhost:5175
echo   🔌 Shared Backend API:  http://localhost:8000/docs
echo ============================================================
echo.

start http://localhost:5174
start http://localhost:5175

echo You can minimize this window.
echo To stop any portal, close its respective terminal window.
echo.
pause
