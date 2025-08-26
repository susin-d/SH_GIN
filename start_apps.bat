@echo off
echo Starting School Management System...
echo.

echo Starting Django Backend Server...
start "Django Backend" cmd /k "cd school_management && python manage.py runserver"

echo Starting Next.js Frontend...
start "Next.js Frontend" cmd /k "cd my-app && npm run dev"

echo.
echo Both applications are starting...
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
