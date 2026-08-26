@echo off
<<<<<<< HEAD
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
=======
title SEOC Punjab — Master System Launcher
cd /d "%~dp0"
echo ==============================================================
echo  GOVERNMENT OF PUNJAB — AI Emergency Response System
echo  Launching: Backend + Reporter Portal + Officer Console
echo ==============================================================
echo.

echo [1/3] Starting Backend API (Port 8000)...
start "SEOC Backend (Port 8000)" cmd /k "%~dp0start_backend.bat"
timeout /t 4 /nobreak >nul

echo [2/3] Starting Citizen Reporter Portal (Port 5173)...
cd /d "%~dp0my-hackathon-project\frontend_reporter"
start "Reporter Portal (Port 5173)" cmd /k "node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Officer Command Console (Port 5174)...
cd /d "%~dp0my-hackathon-project\frontend_officer"
start "Officer Console (Port 5174)" cmd /k "node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174"
timeout /t 2 /nobreak >nul

echo.
echo Opening portals in browser...
start http://127.0.0.1:5173
start http://127.0.0.1:5174

echo.
echo ==============================================================
echo  ALL SERVICES RUNNING:
echo  - Citizen Reporter Portal:  http://127.0.0.1:5173
echo  - Officer Command Console:  http://127.0.0.1:5174 (OFFICER1 / 1234)
echo  - Backend API Docs:         http://127.0.0.1:8000/docs
echo ==============================================================
>>>>>>> 8caf8df0ab075b8f9e31eef3d7d31ab8788ee1e8
pause
