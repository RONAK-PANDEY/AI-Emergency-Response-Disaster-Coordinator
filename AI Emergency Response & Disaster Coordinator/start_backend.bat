@echo off
title AI Emergency Coordinator - Backend Server
echo ========================================================
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
echo ========================================================
cd /d "%~dp0my-hackathon-project\backend"
"%~dp0.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
if %errorlevel% neq 0 (
    echo.
    echo Backend encountered an error.
    pause
)
