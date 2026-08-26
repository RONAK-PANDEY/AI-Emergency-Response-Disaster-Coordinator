@echo off
title SEOC Punjab — Government Officer Command Console [Port 5174]
cd /d "%~dp0"
echo ==============================================================
echo  GOVERNMENT OF PUNJAB — SEOC Officer Command Console
echo  Login: OFFICER1 / 1234  ^|  OFFICER2 / 5678  ^|  ADMIN / 0000
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

:: 2. Launch Officer Frontend
echo [2/2] Launching Officer Command Console on port 5174...
cd /d "%~dp0my-hackathon-project\frontend_officer"
start http://127.0.0.1:5174
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174
pause
