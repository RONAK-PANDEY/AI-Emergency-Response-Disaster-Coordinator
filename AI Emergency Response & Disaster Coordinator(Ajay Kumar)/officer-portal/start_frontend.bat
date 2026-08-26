@echo off
title State Emergency Operations Centre - Frontend Server (React Vite)
setlocal EnableDelayedExpansion

set "CURRENT_DIR=%~dp0"
cd /d "%CURRENT_DIR%"

echo ============================================================
echo   GOVERNMENT OFFICER COMMAND PORTAL - FRONTEND UI
echo   React + Vite Dev Server (Port 5175)
echo ============================================================
echo.
echo [INFO] Application URL: http://localhost:5175
echo.

node "./node_modules/vite/bin/vite.js" --host 127.0.0.1 --port 5175

echo.
echo Frontend stopped. Press any key to exit.
pause >nul
