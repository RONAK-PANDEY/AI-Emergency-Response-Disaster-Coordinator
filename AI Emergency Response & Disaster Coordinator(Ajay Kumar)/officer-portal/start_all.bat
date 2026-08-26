@echo off
title Government Officer Command Portal - Full Stack Launcher
setlocal EnableDelayedExpansion

set "CURRENT_DIR=%~dp0"

echo ============================================================
echo   LAUNCHING GOVERNMENT OFFICER COMMAND PORTAL (FULL STACK)
echo   Backend: FastAPI (Port 8000)
echo   Frontend: React Vite (Port 5175)
echo ============================================================
echo.

echo [1/2] Starting Shared Backend API...
start "Officer Portal Backend (FastAPI :8000)" cmd /k "cd /d ""%CURRENT_DIR%..\my-hackathon-project\backend"" && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [INFO] Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Government Officer Portal Frontend...
start "Officer Portal Frontend (Vite :5175)" cmd /k "cd /d ""%CURRENT_DIR%"" && node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5175"

echo [INFO] Waiting for frontend to start...
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo   GOVERNMENT OFFICER COMMAND PORTAL IS NOW RUNNING!
echo   Opening Command Center: http://localhost:5175
echo ============================================================
echo.

start http://localhost:5175

echo You can minimize this window. To stop the portal, close the
echo individual backend and frontend terminal windows.
echo.
pause
