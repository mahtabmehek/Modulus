Write-Host "=== Testing Cognito Integration ===" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Development server is running on localhost:3000" -ForegroundColor Green
        Write-Host "✓ Page loaded successfully" -ForegroundColor Green
        
        Write-Host "`n=== Integration Status ===" -ForegroundColor Cyan
        Write-Host "Frontend: Running on localhost:3000"
        Write-Host "Cognito User Pool: eu-west-2_4vo3VDZa5"
        Write-Host "Cognito App Client: 4jfe4rmrv0mec1e2hrvmo32a2h"
        Write-Host "Region: eu-west-2"
        
        Write-Host "`n=== Ready for Testing ===" -ForegroundColor Yellow
        Write-Host "1. Open browser to http://localhost:3000"
        Write-Host "2. Test user registration with a valid email"
        Write-Host "3. Check email for confirmation code"
        Write-Host "4. Complete signup and test login"
    }
} catch {
    Write-Host "Error connecting to development server" -ForegroundColor Red
}
