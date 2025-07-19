# Modulus LMS Server Restart Script
# This script stops all running Node.js processes and restarts both frontend and backend servers

Write-Host "=== Modulus LMS Server Restart Script ===" -ForegroundColor Cyan
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Step 1: Stop all Node.js processes
Write-Host "Step 1: Stopping all Node.js processes..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "Found $($nodeProcesses.Count) Node.js process(es). Terminating..." -ForegroundColor Red
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "All Node.js processes terminated." -ForegroundColor Green
    }
    else {
        Write-Host "No Node.js processes found running." -ForegroundColor Green
    }
}
catch {
    Write-Host "Error stopping Node.js processes: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Verify ports are free
Write-Host ""
Write-Host "Step 2: Checking port availability..." -ForegroundColor Yellow
$frontendPort = 3000
$backendPort = 3001

if (Test-Port $frontendPort) {
    Write-Host "Port $frontendPort is still in use. Waiting..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

if (Test-Port $backendPort) {
    Write-Host "Port $backendPort is still in use. Waiting..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

Write-Host "Ports are now available." -ForegroundColor Green

# Step 3: Start Backend Server
Write-Host ""
Write-Host "Step 3: Starting Backend Server..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"

if (Test-Path $backendPath) {
    Set-Location $backendPath
    
    # Check if server.js exists
    if (Test-Path "server.js") {
        Write-Host "Starting backend server on port $backendPort..." -ForegroundColor Cyan
        
        # Start backend in a new PowerShell window
        $backendCmd = "cd '$backendPath'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; node server.js"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
        
        Start-Sleep -Seconds 3
        
        # Check if backend started successfully
        if (Test-Port $backendPort) {
            Write-Host "✓ Backend server started successfully on http://localhost:$backendPort" -ForegroundColor Green
        }
        else {
            Write-Host "⚠ Backend server may not have started on expected port. Check the backend window." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Error: server.js not found in backend directory!" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Error: Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Step 4: Start Frontend Server
Write-Host ""
Write-Host "Step 4: Starting Frontend Server..." -ForegroundColor Yellow
$frontendPath = $PSScriptRoot

Set-Location $frontendPath

# Check if package.json exists
if (Test-Path "package.json") {
    Write-Host "Starting frontend server on port $frontendPort..." -ForegroundColor Cyan
    
    # Start frontend in a new PowerShell window
    $frontendCmd = "cd '$frontendPath'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    
    Start-Sleep -Seconds 5
    
    # Check if frontend started successfully
    if (Test-Port $frontendPort) {
        Write-Host "✓ Frontend server started successfully on http://localhost:$frontendPort" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ Frontend server may not have started on expected port. Check the frontend window." -ForegroundColor Yellow
    }
}
else {
    Write-Host "Error: package.json not found in root directory!" -ForegroundColor Red
    exit 1
}

# Step 5: Summary
Write-Host ""
Write-Host "=== Server Restart Complete ===" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:$frontendPort" -ForegroundColor Green
Write-Host "Backend:  http://localhost:$backendPort" -ForegroundColor Green
Write-Host ""
Write-Host "Both servers are running in separate windows." -ForegroundColor Yellow
Write-Host "Close those windows to stop the servers." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
