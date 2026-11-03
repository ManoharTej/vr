@echo off
title StyleSpeak Launcher
echo ===================================================
echo           StyleSpeak System Launcher
echo ===================================================
echo.

echo [1/2] Starting FastAPI Backend on port 8001...
start "StyleSpeak Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --port 8001 --reload"

echo [2/2] Starting Frontend Web Server on port 5500...
start "StyleSpeak Frontend" cmd /k "cd /d %~dp0 && python -m http.server 5500"

timeout /t 3 /nobreak >nul

echo.
echo Opening StyleSpeak in your default browser...
start http://localhost:5500

echo.
echo ===================================================
echo All systems running!
echo Frontend: http://localhost:5500
echo Backend:  http://localhost:8001
echo API Docs: http://localhost:8001/docs
echo ===================================================
echo Keep the backend and frontend terminal windows open.
pause

