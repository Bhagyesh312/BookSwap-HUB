@echo off
echo Starting BookSwap Hub Server...
cd /d "%~dp0backend"
python app.py
pause
