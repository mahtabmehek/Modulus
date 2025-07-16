Write-Host "=== Cognito Integration Debug Test ===" -ForegroundColor Green

# Test 1: Check if browser console shows debug information
Write-Host "`n1. Open Developer Tools (F12) in your browser" -ForegroundColor Yellow
Write-Host "2. Go to Console tab" -ForegroundColor Yellow
Write-Host "3. Look for auth state logs starting with 'Auth state:'" -ForegroundColor Yellow
Write-Host "4. Look for 'Checking auth state...', 'Current user:', etc." -ForegroundColor Yellow

# Test 2: Check if the page shows the login form or dashboard
Write-Host "`n=== Current Status Check ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Application is running successfully" -ForegroundColor Green
        
        # Check page content
        $content = $response.Content
        
        if ($content -match "Sign In|Sign Up") {
            Write-Host "✓ Login form is displayed (user not authenticated)" -ForegroundColor Green
            Write-Host "  → This means Cognito is working but no user is logged in" -ForegroundColor Gray
        }
        
        if ($content -match "Dashboard|Welcome back") {
            Write-Host "✓ Dashboard is displayed (user is authenticated)" -ForegroundColor Green
            Write-Host "  → This means Cognito user is logged in but may be missing role/approval data" -ForegroundColor Gray
        }
        
        if ($content -match "Pending Approval") {
            Write-Host "⚠ Pending approval screen is shown" -ForegroundColor Yellow
            Write-Host "  → User is authenticated but marked as needing approval" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "✗ Failed to connect to application" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Next Steps for Testing ===" -ForegroundColor Yellow
Write-Host "1. Try signing up with a new email address"
Write-Host "2. Check the browser console for any error messages"
Write-Host "3. If signup works but no email arrives:"
Write-Host "   - The user will still be created in Cognito"
Write-Host "   - But will be in 'UNCONFIRMED' status"
Write-Host "   - We may need to manually confirm or use admin confirmation"

Write-Host "`n=== Email Verification Issue ===" -ForegroundColor Cyan
Write-Host "The verification email issue is likely because:"
Write-Host "• AWS SES (Simple Email Service) is not configured"
Write-Host "• Cognito is using default email which may go to spam"
Write-Host "• Email domain verification is required in production"
Write-Host "`nFor now, focus on checking if users can be created successfully"
