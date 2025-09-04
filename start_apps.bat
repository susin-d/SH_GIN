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
REM Wait a few seconds for servers to start
ping 127.0.0.1 -n 6 > nul
REM Open frontend in default browser
start http://localhost:3000
echo Press any key to close this window...
pause >nul
