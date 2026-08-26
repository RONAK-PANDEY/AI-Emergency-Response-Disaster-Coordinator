@echo off
title AI Emergency Response - Backend API

echo =======================================================================
echo     AI Emergency Response and Disaster Coordinator - Backend API
echo =======================================================================
echo.

cd /d "%~dp0"

if exist "backend" (
    cd /d "%~dp0backend"
)

echo [INFO] Current Folder: "%CD%"
echo.

if exist "venv\Scripts\python.exe" (
    echo [INFO] Starting Backend using Virtual Environment Python...
    echo [INFO] API URL: http://localhost:8000
    echo [INFO] Docs:    http://localhost:8000/docs
    echo.
    "venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
) else (
    echo [INFO] Starting Backend using System Python...
    echo [INFO] API URL: http://localhost:8000
    echo [INFO] Docs:    http://localhost:8000/docs
    echo.
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
)

if errorlevel 1 (
    echo.
    echo [ERROR] Backend stopped or failed to start.
)

echo.
echo Press any key to close this window...
pause >nul
