# Modulus LMS Authentication Backend Test Script (PowerShell)
# Tests all authentication endpoints after deployment

param(
    [string]$ApiBaseUrl = "http://modulus-alb-2046761654.eu-west-2.elb.amazonaws.com/api",
    [string]$AccessCode = "mahtabmehek1337"
)

Write-Host "🧪 Modulus LMS Authentication Backend Test Suite" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "API Base URL: $ApiBaseUrl" -ForegroundColor White
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiBaseUrl/health" -Method GET
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Validate Access Code
Write-Host "2. Testing Access Code Validation..." -ForegroundColor Yellow
try {
    $body = @{
        accessCode = "mahtabmehek1337"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiBaseUrl/auth/validate-access-code" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Access code validation passed" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Access code validation failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Test Invalid Access Code
Write-Host "3. Testing Invalid Access Code..." -ForegroundColor Yellow
try {
    $body = @{
        accessCode = "invalid-code"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiBaseUrl/auth/validate-access-code" -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ Invalid access code was accepted (should fail)" -ForegroundColor Red
} catch {
    Write-Host "✅ Invalid access code properly rejected" -ForegroundColor Green
}
Write-Host ""

# Test 4: Register New User
Write-Host "4. Testing User Registration..." -ForegroundColor Yellow
$testEmail = "test-$(Get-Random)@example.com"
try {
    $body = @{
        email = $testEmail
        password = "testpassword123"
        name = "Test User"
        accessCode = "mahtabmehek1337"
        role = "student"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiBaseUrl/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ User registration passed" -ForegroundColor Green
    Write-Host "User created: $($response.user.email)" -ForegroundColor Gray
    $testToken = $response.token
} catch {
    Write-Host "❌ User registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorBody = $_.Exception.Response.GetResponseStream() | ForEach-Object { [System.IO.StreamReader]::new($_).ReadToEnd() }
        Write-Host "Error details: $errorBody" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Login with Created User
Write-Host "5. Testing User Login..." -ForegroundColor Yellow
try {
    $body = @{
        email = $testEmail
        password = "testpassword123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiBaseUrl/auth/login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ User login passed" -ForegroundColor Green
    Write-Host "Logged in as: $($response.user.name) ($($response.user.role))" -ForegroundColor Gray
    $testToken = $response.token
} catch {
    Write-Host "❌ User login failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Access Protected Endpoint
if ($testToken) {
    Write-Host "6. Testing Protected Endpoint..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $testToken"
        }
        
        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/auth/me" -Method GET -Headers $headers
        Write-Host "✅ Protected endpoint access passed" -ForegroundColor Green
        Write-Host "User info: $($response.user.name) - $($response.user.email)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Protected endpoint access failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "6. Skipping protected endpoint test (no token available)" -ForegroundColor Yellow
}
Write-Host ""

# Test 7: Database Health Check
Write-Host "7. Testing Database Connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiBaseUrl/health/db" -Method GET
    Write-Host "✅ Database health check passed" -ForegroundColor Green
    Write-Host "Database status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Database health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "🎯 Authentication Backend Testing Complete!" -ForegroundColor Cyan
