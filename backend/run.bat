@echo off
cd /d "%~dp0backend"
python manage.py runserver 0.0.0.0:8000
pause