# Simple restart script for Modulus development servers
Write-Host "🔄 Restarting Modulus development servers..." -ForegroundColor Cyan

# Kill existing node processes
Write-Host "📦 Stopping existing Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment for processes to fully stop
Start-Sleep -Seconds 2

# Start frontend development server
Write-Host "🚀 Starting frontend development server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

# Wait a moment before starting backend
Start-Sleep -Seconds 3

# Start backend server
Write-Host "🔧 Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start" -WindowStyle Normal

Write-Host "✅ Both servers are starting up!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
