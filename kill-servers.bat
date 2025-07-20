@echo off
echo.
echo 🛑 Killing Modulus LMS servers...
echo.

echo 📱 Stopping frontend server (port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 "') do (
    if not "%%a"=="0" (
        taskkill /f /pid %%a >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✅ Frontend server stopped (PID: %%a^)
        )
    )
)

echo 🔧 Stopping backend server (port 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 "') do (
    if not "%%a"=="0" (
        taskkill /f /pid %%a >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✅ Backend server stopped (PID: %%a^)
        )
    )
)

echo.
echo 💀 Killing any remaining Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo 🎯 Server shutdown complete!
echo    Frontend (port 3000): Stopped
echo    Backend (port 3001): Stopped
echo.
echo To restart servers:
echo    npm run dev      # Frontend
echo    npm start        # Backend (in backend folder)
echo.
pause
