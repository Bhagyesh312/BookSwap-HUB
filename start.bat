@echo off
title BookSwap Hub — Backend Server
echo.
echo  ========================================
echo   BookSwap Hub — Starting Backend Server
echo  ========================================
echo.

cd /d "%~dp0"

:: Check virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo  [ERROR] Virtual environment not found.
    echo  Run: python -m venv .venv
    echo  Then: .venv\Scripts\pip install -r backend\requirements.txt
    echo.
    pause
    exit /b 1
)

:: Activate venv
call .venv\Scripts\activate

:: Install / update dependencies silently if needed
echo  [1/3] Checking dependencies...
pip install -r backend\requirements.txt -q --disable-pip-version-check
echo  [1/3] Dependencies OK.
echo.

:: Check .env exists
if not exist "backend\.env" (
    echo  [WARN] backend\.env not found — copying from .env.example
    copy "backend\.env.example" "backend\.env" >nul
)

echo  [2/3] Environment ready.
echo.
echo  [3/3] Starting Flask server on http://localhost:5000
echo.
echo  Press Ctrl+C to stop the server.
echo.

cd backend
python app.py

pause
