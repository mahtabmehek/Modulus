# Firefox Login Test Runner for Modulus LMS

Write-Host "🦊 Starting Cypress Firefox Login Tests..." -ForegroundColor Green

# Ensure dependencies are installed
Write-Host "📦 Checking Cypress installation..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules\.bin\cypress.cmd")) {
    Write-Host "Installing Cypress..." -ForegroundColor Yellow
    npm install cypress --save-dev
}

# Check if Firefox is available
Write-Host "🔍 Checking Firefox installation..." -ForegroundColor Yellow
try {
    $firefoxPath = Get-Command firefox -ErrorAction Stop
    Write-Host "✅ Firefox found at: $($firefoxPath.Source)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Firefox not found. Please install Firefox to run these tests." -ForegroundColor Red
    Write-Host "Download from: https://www.mozilla.org/firefox/" -ForegroundColor Yellow
    exit 1
}

# Start backend server if not running
Write-Host "🔧 Checking backend server..." -ForegroundColor Yellow
$backendRunning = try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 2 -ErrorAction Stop
    $true
}
catch {
    $false
}

if (-not $backendRunning) {
    Write-Host "🚀 Starting backend server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-Command", "cd backend; npm start" -WindowStyle Minimized
    Start-Sleep -Seconds 5
}

# Start frontend server if not running
Write-Host "🔧 Checking frontend server..." -ForegroundColor Yellow
$frontendRunning = try {
    Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
    $true
}
catch {
    $false
}

if (-not $frontendRunning) {
    Write-Host "🚀 Starting frontend server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 10
}

# Wait for servers to be ready
Write-Host "⏳ Waiting for servers to be ready..." -ForegroundColor Yellow
$maxRetries = 30
$retryCount = 0

do {
    try {
        $backendHealth = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 2
        $frontendHealth = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2
        
        if ($backendHealth -and $frontendHealth.StatusCode -eq 200) {
            Write-Host "✅ Both servers are ready!" -ForegroundColor Green
            break
        }
    }
    catch {
        Start-Sleep -Seconds 2
        $retryCount++
        Write-Host "⏳ Retry $retryCount/$maxRetries..." -ForegroundColor Yellow
    }
} while ($retryCount -lt $maxRetries)

if ($retryCount -eq $maxRetries) {
    Write-Host "❌ Servers failed to start. Please check manually." -ForegroundColor Red
    exit 1
}

# Run Firefox login tests
Write-Host "🦊 Running Firefox Login Tests..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Run the specific Firefox login test
npx cypress run --browser firefox --spec "cypress/e2e/firefox-login-unit-test.cy.js" --headed

$testResult = $LASTEXITCODE

if ($testResult -eq 0) {
    Write-Host "✅ All Firefox login tests passed!" -ForegroundColor Green
}
else {
    Write-Host "❌ Some tests failed. Check the results above." -ForegroundColor Red
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🦊 Firefox Login Test Run Complete!" -ForegroundColor Green

# Optional: Open Cypress Test Runner for interactive testing
$openRunner = Read-Host "Would you like to open Cypress Test Runner for interactive testing? (y/n)"
if ($openRunner -eq 'y' -or $openRunner -eq 'Y') {
    Write-Host "🚀 Opening Cypress Test Runner..." -ForegroundColor Green
    npx cypress open --browser firefox
}

Write-Host "Test run finished. Exit code: $testResult" -ForegroundColor $(if ($testResult -eq 0) { "Green" } else { "Red" })
