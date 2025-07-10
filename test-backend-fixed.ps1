# Simple deployment script for testing the backend functionality
# This script will test the API endpoints and seed the database

Write-Host "🚀 Starting Modulus Backend Test & Seed" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Configuration
$API_URL = "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"
$BACKEND_DIR = ".\backend"

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$endpoint,
        [string]$description
    )
    
    Write-Host "`nTesting $description..." -ForegroundColor Yellow
    Write-Host "URL: $API_URL$endpoint"
    
    try {
        $response = Invoke-RestMethod -Uri "$API_URL$endpoint" -Method GET
        Write-Host "✅ Success" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10
    }
    catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)"
        }
    }
}

# Test backend structure first
Write-Host "`n🔍 Checking backend structure..." -ForegroundColor Yellow
if (Test-Path $BACKEND_DIR) {
    Write-Host "✅ Backend directory exists" -ForegroundColor Green
    
    # Check required files
    $requiredFiles = @("server.js", "lambda.js", "routes\admin.js", "routes\auth.js", "routes\health.js")
    foreach ($file in $requiredFiles) {
        $fullPath = Join-Path $BACKEND_DIR $file
        if (Test-Path $fullPath) {
            Write-Host "✅ $file exists" -ForegroundColor Green
        } else {
            Write-Host "❌ $file missing" -ForegroundColor Red
        }
    }
    
    # Check for seed route
    $adminFile = Join-Path $BACKEND_DIR "routes\admin.js"
    if (Test-Path $adminFile) {
        $content = Get-Content $adminFile -Raw
        if ($content -match "router\.get\('/seed'") {
            Write-Host "✅ /seed route found in admin.js" -ForegroundColor Green
        } else {
            Write-Host "❌ /seed route NOT found in admin.js" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Backend directory not found" -ForegroundColor Red
}

# Test API endpoints
Write-Host "`n🌐 Testing API endpoints..." -ForegroundColor Yellow

# Test basic health
Test-Endpoint "/health" "Basic Health Check"

# Test database health
Test-Endpoint "/health/db" "Database Health Check"

# Test status endpoint
Test-Endpoint "/status" "API Status"

# Test seed endpoint (this is the main one we're fixing)
Test-Endpoint "/admin/seed" "Seed Endpoint (Database Seeding)"

# Test seed endpoint with detailed output
Write-Host "`n🧪 Testing seed endpoint with detailed output..." -ForegroundColor Yellow
try {
    $seedResponse = Invoke-RestMethod -Uri "$API_URL/admin/seed" -Method GET
    Write-Host "✅ Seed endpoint working correctly" -ForegroundColor Green
    
    if ($seedResponse.users) {
        Write-Host "Created $($seedResponse.users.Count) users" -ForegroundColor Green
        Write-Host "Users created:" -ForegroundColor Cyan
        $seedResponse.users | ForEach-Object {
            Write-Host "  - $($_.email) ($($_.name)) - Role: $($_.role)" -ForegroundColor White
        }
    }
    
    Write-Host "`nFull seed response:" -ForegroundColor Cyan
    $seedResponse | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "❌ Seed endpoint not working as expected" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test with specific test users
Write-Host "`n🔐 Testing authentication with seeded users..." -ForegroundColor Yellow

# Try to login with a test user
Write-Host "Testing login with student@test.com..." -ForegroundColor Cyan
try {
    $loginBody = @{
        email = "student@test.com"
        password = "Mahtabmehek@1337"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.token) {
        Write-Host "✅ Login successful" -ForegroundColor Green
        Write-Host "User info:" -ForegroundColor Cyan
        $loginResponse.user | ConvertTo-Json -Depth 10
    } else {
        Write-Host "❌ Login failed - no token received" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 Deployment Summary" -ForegroundColor Yellow
Write-Host "===================="
Write-Host "API URL: $API_URL"
Write-Host "Key endpoints tested:"
Write-Host "  - Health: $API_URL/health"
Write-Host "  - Database: $API_URL/health/db"
Write-Host "  - Seed: $API_URL/admin/seed"
Write-Host "  - Auth: $API_URL/auth/login"

Write-Host "`n🎉 Testing completed!" -ForegroundColor Green
Write-Host "If the seed endpoint is working, your backend is ready for use."
Write-Host "You can now run the frontend with the API_URL pointing to: $API_URL"
