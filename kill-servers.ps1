# Kill All Servers Script for Modulus LMS
# Run this to stop all development servers

Write-Host "🛑 Stopping Modulus LMS servers..." -ForegroundColor Red

# Stop frontend development server (Next.js on port 3000)
Write-Host "📱 Stopping frontend server (port 3000)..." -ForegroundColor Yellow
$frontendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*Next.js*" -or 
    ($_.ProcessName -eq "node" -and (netstat -ano | Select-String ":3000 " | Select-String $_.Id))
}

if ($frontendProcess) {
    Stop-Process -Id $frontendProcess.Id -Force
    Write-Host "✅ Frontend server stopped" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend server not found or already stopped" -ForegroundColor Cyan
}

# Stop backend server (Node.js on port 3001) 
Write-Host "🔧 Stopping backend server (port 3001)..." -ForegroundColor Yellow
$backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    (netstat -ano | Select-String ":3001 " | Select-String $_.Id)
}

if ($backendProcess) {
    Stop-Process -Id $backendProcess.Id -Force
    Write-Host "✅ Backend server stopped" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend server not found or already stopped" -ForegroundColor Cyan
}

# Alternative method: Kill all node processes (more aggressive)
Write-Host "🔄 Checking for any remaining Node.js processes..." -ForegroundColor Yellow
$remainingNodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($remainingNodeProcesses) {
    Write-Host "⚠️  Found $($remainingNodeProcesses.Count) remaining Node.js processes" -ForegroundColor Cyan
    $choice = Read-Host "Do you want to kill ALL Node.js processes? (y/N)"
    
    if ($choice -eq "y" -or $choice -eq "Y") {
        Stop-Process -Name "node" -Force
        Write-Host "💀 All Node.js processes terminated" -ForegroundColor Red
    } else {
        Write-Host "ℹ️  Skipping remaining processes" -ForegroundColor Cyan
    }
} else {
    Write-Host "✅ No remaining Node.js processes found" -ForegroundColor Green
}

# Kill any processes using ports 3000 and 3001 specifically
Write-Host "🔍 Checking for processes using ports 3000 and 3001..." -ForegroundColor Yellow

$port3000 = netstat -ano | Select-String ":3000 " | ForEach-Object { ($_ -split '\s+')[-1] }
$port3001 = netstat -ano | Select-String ":3001 " | ForEach-Object { ($_ -split '\s+')[-1] }

foreach ($processId in ($port3000 + $port3001)) {
    if ($processId -and $processId -ne "0") {
        try {
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Stop-Process -Id $processId -Force
                Write-Host "💀 Killed process $processId using port" -ForegroundColor Red
            }
        } catch {
            Write-Host "⚠️  Could not kill process $processId" -ForegroundColor Cyan
        }
    }
}

Write-Host ""
Write-Host "🎯 Server shutdown complete!" -ForegroundColor Green
Write-Host "   Frontend (port 3000): Stopped" -ForegroundColor Gray
Write-Host "   Backend (port 3001): Stopped" -ForegroundColor Gray
Write-Host ""
Write-Host "To restart servers, use:" -ForegroundColor Cyan
Write-Host "   npm run dev      # Frontend" -ForegroundColor White
Write-Host "   npm start        # Backend (in backend folder)" -ForegroundColor White
