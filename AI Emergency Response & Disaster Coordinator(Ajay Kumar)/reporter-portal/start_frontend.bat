@echo off
title Citizen Reporter Portal - Frontend Server (React Vite)
setlocal EnableDelayedExpansion

set "CURRENT_DIR=%~dp0"
cd /d "%CURRENT_DIR%"

echo ============================================================
echo   CITIZEN REPORTER PORTAL - FRONTEND UI
echo   React + Vite Dev Server (Port 5174)
echo ============================================================
echo.
echo [INFO] Application URL: http://localhost:5174
echo.

node "./node_modules/vite/bin/vite.js" --host 127.0.0.1 --port 5174

echo.
echo Frontend stopped. Press any key to exit.
pause >nul
