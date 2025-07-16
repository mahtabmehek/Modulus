# Simple Cognito Integration Test
Write-Host "Testing Cognito Integration..." -ForegroundColor Cyan

# Test User Pool
Write-Host "Testing User Pool..." -ForegroundColor Yellow
$pool = aws cognito-idp describe-user-pool --user-pool-id eu-west-2_4vo3VDZa5 --output json 2>&1
if ($pool -like "*error*") {
    Write-Host "User Pool: FAILED" -ForegroundColor Red
} else {
    Write-Host "User Pool: PASSED" -ForegroundColor Green
}

# Test App Client
Write-Host "Testing App Client..." -ForegroundColor Yellow
$client = aws cognito-idp describe-user-pool-client --user-pool-id eu-west-2_4vo3VDZa5 --client-id 4jfe4rmrv0mec1e2hrvmo32a2h --output json 2>&1
if ($client -like "*error*") {
    Write-Host "App Client: FAILED" -ForegroundColor Red
} else {
    Write-Host "App Client: PASSED" -ForegroundColor Green
}

# Test Dev Server
Write-Host "Testing Dev Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "Dev Server: PASSED" -ForegroundColor Green
    } else {
        Write-Host "Dev Server: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "Dev Server: ERROR" -ForegroundColor Red
}

# Check files
Write-Host "Checking files..." -ForegroundColor Yellow
$files = @("src/config/cognito.ts", "src/components/providers/auth-provider.tsx", "cognito-config.txt")
$allGood = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  $file - EXISTS" -ForegroundColor Green
    } else {
        Write-Host "  $file - MISSING" -ForegroundColor Red
        $allGood = $false
    }
}

if ($allGood) {
    Write-Host "`nAll tests passed! Open http://localhost:3000 to test." -ForegroundColor Green
} else {
    Write-Host "`nSome issues found. Please review." -ForegroundColor Yellow
}
