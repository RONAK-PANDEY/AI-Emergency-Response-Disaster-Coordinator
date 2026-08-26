@echo off
title Citizen Reporter Portal - Full Stack Launcher
setlocal EnableDelayedExpansion

set "CURRENT_DIR=%~dp0"

echo ============================================================
echo   LAUNCHING CITIZEN REPORTER PORTAL (FULL STACK)
echo   Backend: FastAPI (Port 8000)
echo   Frontend: React Vite (Port 5174)
echo ============================================================
echo.

echo [1/2] Starting Shared Backend API...
start "Citizen Portal Backend (FastAPI :8000)" cmd /k "cd /d ""%CURRENT_DIR%..\my-hackathon-project\backend"" && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [INFO] Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Citizen Portal Frontend...
start "Citizen Portal Frontend (Vite :5174)" cmd /k "cd /d ""%CURRENT_DIR%"" && node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174"

echo [INFO] Waiting for frontend to start...
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo   CITIZEN REPORTER PORTAL IS NOW RUNNING!
echo   Opening Citizen Portal: http://localhost:5174
echo ============================================================
echo.

start http://localhost:5174

echo You can minimize this window. To stop the portal, close the
echo individual backend and frontend terminal windows.
echo.
pause
