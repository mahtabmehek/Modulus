# Simple Aurora API Test
Write-Host "Testing Aurora Database Connection..." -ForegroundColor Green

# Create a simple test payload for admin login
$payload = '{"httpMethod":"POST","path":"/auth/login","body":"{\"username\":\"admin\",\"password\":\"admin123\"}"}'

Write-Host "`nTesting admin login with Aurora database..." -ForegroundColor Yellow
Write-Host "Payload: $payload" -ForegroundColor Cyan

try {
    aws lambda invoke --function-name modulus-backend --payload $payload response.json
    
    if (Test-Path "response.json") {
        Write-Host "`nResponse from Lambda:" -ForegroundColor Green
        Get-Content "response.json"
        
        # Clean up
        Remove-Item "response.json" -ErrorAction SilentlyContinue
    } else {
        Write-Host "No response file generated" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" -NoNewline
