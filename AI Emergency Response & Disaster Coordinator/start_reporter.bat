@echo off
title SEOC Punjab — Citizen Reporter Portal [Port 5173]
cd /d "%~dp0"
echo ==============================================================
echo  GOVERNMENT OF PUNJAB — Citizen Emergency Reporter Portal
echo ==============================================================
echo.

:: 1. Check if backend on port 8000 is listening, if not start it
netstat -ano | findstr :8000 >nul
if %errorlevel% neq 0 (
    echo [1/2] Launching Backend Server on port 8000...
    start "SEOC Backend (Port 8000)" cmd /k "%~dp0start_backend.bat"
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] Backend server is already active on port 8000.
)

:: 2. Launch Reporter Frontend
echo [2/2] Launching Citizen Reporter Portal on port 5173...
cd /d "%~dp0my-hackathon-project\frontend_reporter"
start http://127.0.0.1:5173
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
pause
