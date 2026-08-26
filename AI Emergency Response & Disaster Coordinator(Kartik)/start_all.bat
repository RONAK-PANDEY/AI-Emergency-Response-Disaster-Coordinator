@echo off
title AI Emergency Coordinator - Launcher
echo ========================================================
echo Launching AI Emergency Response & Disaster Coordinator...
echo ========================================================

echo Starting Backend Server...
start "AI Emergency - Backend" cmd /c ""%~dp0start_backend.bat""

echo Starting Frontend Server...
start "AI Emergency - Frontend" cmd /c ""%~dp0start_frontend.bat""

echo.
echo Waiting 3 seconds for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo System launched successfully!
echo Close the respective server windows when you want to stop.
echo ========================================================
exit
