# Kill all Node.js servers script
Write-Host "Killing all Node.js processes..." -ForegroundColor Yellow

# Get all node.exe processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Cyan
    
    foreach ($process in $nodeProcesses) {
        Write-Host "Killing process: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Red
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "All Node.js processes have been terminated!" -ForegroundColor Green
} else {
    Write-Host "No Node.js processes found." -ForegroundColor Green
}

# Also check for any npm processes
$npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue

if ($npmProcesses) {
    Write-Host "Found $($npmProcesses.Count) npm process(es)" -ForegroundColor Cyan
    
    foreach ($process in $npmProcesses) {
        Write-Host "Killing process: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Red
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "All npm processes have been terminated!" -ForegroundColor Green
}

# Wait a moment and check ports
Start-Sleep -Seconds 2

Write-Host "`nChecking ports 3000-3002..." -ForegroundColor Yellow
$ports = @(3000, 3001, 3002)

foreach ($port in $ports) {
    $connection = netstat -ano | Select-String ":$port.*LISTENING"
    if ($connection) {
        Write-Host "Port $port is still in use:" -ForegroundColor Yellow
        Write-Host $connection -ForegroundColor Gray
    } else {
        Write-Host "Port $port is free" -ForegroundColor Green
    }
}

Write-Host "`nServer cleanup complete!" -ForegroundColor Green
