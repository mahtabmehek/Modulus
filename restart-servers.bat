@echo off
echo === Modulus LMS Server Restart ===
echo.

echo Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js processes terminated.
) else (
    echo No Node.js processes were running.
)

echo.
echo Waiting 3 seconds for cleanup...
timeout /t 3 /nobreak >nul

echo.
echo Starting Backend Server...
cd /d "%~dp0backend"
if exist server.js (
    start "Modulus Backend" cmd /k "echo Backend Server Starting... && node server.js"
    echo Backend server started in new window.
) else (
    echo Error: server.js not found in backend directory!
    pause
    exit /b 1
)

echo.
echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
cd /d "%~dp0"
if exist package.json (
    start "Modulus Frontend" cmd /k "echo Frontend Server Starting... && npm run dev"
    echo Frontend server started in new window.
) else (
    echo Error: package.json not found in root directory!
    pause
    exit /b 1
)

echo.
echo === Server Restart Complete ===
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo Both servers are running in separate windows.
echo Close this window when done.
echo.
pause
