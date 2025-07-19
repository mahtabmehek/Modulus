# Simplified Modulus LMS Server Restart Script
Write-Host "=== Modulus LMS Server Restart Script ===" -ForegroundColor Cyan

# Stop all Node.js processes
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Green
$backendPath = Join-Path $PSScriptRoot "backend"
if (Test-Path $backendPath) {
    $backendCmd = "cd '$backendPath'; node server.js"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    Write-Host "Backend started in new window" -ForegroundColor Green
} else {
    Write-Host "Backend directory not found!" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# Start Frontend Server  
Write-Host "Starting Frontend Server..." -ForegroundColor Green
$frontendPath = $PSScriptRoot
$frontendCmd = "cd '$frontendPath'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
Write-Host "Frontend started in new window" -ForegroundColor Green

Write-Host ""
Write-Host "Servers are starting in separate windows:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
