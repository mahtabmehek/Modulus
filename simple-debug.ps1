Write-Host "=== Cognito Integration Status Check ===" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Application is running successfully" -ForegroundColor Green
        
        $content = $response.Content
        
        if ($content -match "Sign In" -or $content -match "Sign Up") {
            Write-Host "✓ Login form is displayed - user not authenticated" -ForegroundColor Green
        }
        
        if ($content -match "Dashboard" -or $content -match "Welcome back") {
            Write-Host "✓ Dashboard is displayed - user is authenticated" -ForegroundColor Green
        }
        
        if ($content -match "Pending Approval") {
            Write-Host "⚠ Pending approval screen is shown" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "✗ Failed to connect to application" -ForegroundColor Red
}

Write-Host "`n=== Testing Instructions ===" -ForegroundColor Yellow
Write-Host "1. Open browser developer tools (F12)"
Write-Host "2. Go to Console tab"
Write-Host "3. Look for debug messages about auth state"
Write-Host "4. Try signing up with a test email"
Write-Host "5. Check console for any errors"
