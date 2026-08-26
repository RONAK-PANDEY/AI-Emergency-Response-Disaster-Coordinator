@echo off
title AI Emergency Coordinator - Frontend Server
echo ========================================================
echo Starting Vite Frontend on http://localhost:5173 ...
echo ========================================================
cd /d "%~dp0my-hackathon-project\frontend"
node ./node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173
if %errorlevel% neq 0 (
    echo.
    echo Frontend encountered an error.
    pause
)
