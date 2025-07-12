# Test Aurora Database API Integration
Write-Host "Testing Aurora Database API Integration..." -ForegroundColor Green

# Test 1: Login with admin user
Write-Host "`n1. Testing admin login..." -ForegroundColor Yellow
$loginPayload = @{
    httpMethod = "POST"
    path = "/auth/login"
    body = '{"username": "admin", "password": "admin123"}'
    headers = @{
        "Content-Type" = "application/json"
    }
} | ConvertTo-Json -Compress

try {
    $response = aws lambda invoke --function-name modulus-backend --payload $loginPayload response.json
    if (Test-Path "response.json") {
        $result = Get-Content "response.json" | ConvertFrom-Json
        Write-Host "Response: $($result | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
        Remove-Item "response.json"
    }
} catch {
    Write-Host "Error testing admin login: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login with student user
Write-Host "`n2. Testing student login..." -ForegroundColor Yellow
$studentPayload = @{
    httpMethod = "POST"
    path = "/auth/login"
    body = '{"username": "student", "password": "student123"}'
    headers = @{
        "Content-Type" = "application/json"
    }
} | ConvertTo-Json -Compress

try {
    $response = aws lambda invoke --function-name modulus-backend --payload $studentPayload response.json
    if (Test-Path "response.json") {
        $result = Get-Content "response.json" | ConvertFrom-Json
        Write-Host "Response: $($result | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
        Remove-Item "response.json"
    }
} catch {
    Write-Host "Error testing student login: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Test invalid credentials
Write-Host "`n3. Testing invalid credentials..." -ForegroundColor Yellow
$invalidPayload = @{
    httpMethod = "POST"
    path = "/auth/login"
    body = '{"username": "invalid", "password": "invalid"}'
    headers = @{
        "Content-Type" = "application/json"
    }
} | ConvertTo-Json -Compress

try {
    $response = aws lambda invoke --function-name modulus-backend --payload $invalidPayload response.json
    if (Test-Path "response.json") {
        $result = Get-Content "response.json" | ConvertFrom-Json
        Write-Host "Response: $($result | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
        Remove-Item "response.json"
    }
} catch {
    Write-Host "Error testing invalid credentials: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Aurora API testing complete!" -ForegroundColor Green
