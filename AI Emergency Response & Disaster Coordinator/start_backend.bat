@echo off
title SEOC Punjab — Backend API Server [Port 8000]
cd /d "%~dp0"
echo ==============================================================
echo  GOVERNMENT OF PUNJAB — SEOC Backend API Server
echo  FastAPI + SQLite + Multilingual NLP Triage Engine
echo  Starting on http://127.0.0.1:8000
echo ==============================================================
echo.

if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment (.venv) not found.
    pause & exit /b 1
)

call .venv\Scripts\activate.bat
cd my-hackathon-project\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
