@echo off
title State Emergency Operations Centre - Backend Server (FastAPI)
setlocal EnableDelayedExpansion

set "CURRENT_DIR=%~dp0"
cd /d "%CURRENT_DIR%..\my-hackathon-project\backend"

echo ============================================================
echo   GOVERNMENT OFFICER COMMAND PORTAL - BACKEND SERVER
echo   National Emergency Operations Grid (FastAPI)
echo ============================================================
echo.

if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call "venv\Scripts\activate.bat"
) else (
    echo [WARNING] venv not found, trying system Python...
)

echo.
echo [INFO] Starting FastAPI server on port 8000...
echo [INFO] Shared Database: incidents.db (Connected with Citizen Portal)
echo [INFO] API Documentation: http://localhost:8000/docs
echo.

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

echo.
echo Server stopped. Press any key to exit.
pause >nul
