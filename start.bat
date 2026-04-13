@echo off
setlocal enabledelayedexpansion
title BookSwap Hub - Launch Center
color 0b

echo.
echo  ======================================================
echo     ____              _   ____                        
echo    ^| __ )  ___   ___ ^| ^|_^/ ___^|__      ____ _ _ __  
echo    ^|  _ \^/ _ \^/ _ \^| ^|/ \___ \ \ \ /\ / / _` ^| '_ \ 
echo    ^| ^|_) ^| (_) ^| (_) ^|   < ___) \ V  V / (_^| ^| ^|_) ^|
echo    ^|____/^ \___/^ \___/^|_^|\_\____/ \_/\_/ \__,_^| .__/ 
echo                                              ^|_^|    
echo  ======================================================
echo.

REM Change to project root
cd /d "%~dp0"

REM 1. Check virtual environment
if not exist ".venv\Scripts\activate.bat" (
    echo [!] Creating virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate
    echo [!] Installing requirements...
    pip install -r backend\requirements.txt
    echo. > .deps_installed
) else (
    call .venv\Scripts\activate
    if not exist ".deps_installed" (
        echo [!] Updating dependencies...
        pip install -r backend\requirements.txt -q
        echo. > .deps_installed
    )
)

REM 2. Check Database connectivity
echo [*] Checking database connection...
python -c "import psycopg2, os; from dotenv import load_dotenv; load_dotenv('backend/.env'); psycopg2.connect(dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER'), password=os.getenv('DB_PASSWORD'), host=os.getenv('DB_HOST', 'localhost'))" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Could not connect to the database. 
    echo Please ensure PostgreSQL is running and credentials in backend\.env are correct.
    pause
    exit /b 1
)
echo [OK] Database connected.

REM 3. Open Website in Browser
echo [*] Launching http://localhost:5000...
start http://localhost:5000/home.html

REM 4. Start Flask Server
echo [*] Starting Backend Server...
echo.
echo ------------------------------------------------------
echo  Backend is running! Keep this window open.
echo  Access your app at: http://localhost:5000/home.html
echo ------------------------------------------------------
echo.

cd backend
python app.py

pause