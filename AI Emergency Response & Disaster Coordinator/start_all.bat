@echo off
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
pause
