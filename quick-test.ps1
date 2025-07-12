# Quick backend test script
Write-Host "Testing Modulus Backend..." -ForegroundColor Green

$API_URL = "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"

# Test health
Write-Host "Testing health endpoint..."
try {
    $health = Invoke-RestMethod -Uri "$API_URL/health" -Method GET
    Write-Host "Health: OK" -ForegroundColor Green
    $health | ConvertTo-Json
} catch {
    Write-Host "Health: FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test seed endpoint
Write-Host "`nTesting seed endpoint..."
try {
    $seed = Invoke-RestMethod -Uri "$API_URL/admin/seed" -Method GET
    Write-Host "Seed: OK" -ForegroundColor Green
    Write-Host "Users created: $($seed.users.Count)"
    $seed | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Seed: FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test login
Write-Host "`nTesting login..."
try {
    $loginBody = @{
        email = "admin@test.com"
        password = "Mahtabmehek@1337"
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login: OK" -ForegroundColor Green
    Write-Host "Token received: $($login.token -ne $null)"
} catch {
    Write-Host "Login: FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`nTesting complete!" -ForegroundColor Green
