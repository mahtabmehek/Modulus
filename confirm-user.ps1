# Manual User Confirmation Script for Cognito
# Use this if email verification is not working

param(
    [Parameter(Mandatory=$true)]
    [string]$Username
)

$UserPoolId = "eu-west-2_4vo3VDZa5"

Write-Host "Attempting to confirm user: $Username" -ForegroundColor Yellow

try {
    # Try to confirm the user
    aws cognito-idp admin-confirm-sign-up --user-pool-id $UserPoolId --username $Username --region eu-west-2
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ User $Username confirmed successfully!" -ForegroundColor Green
        Write-Host "The user can now log in without email verification." -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to confirm user. Check if AWS CLI is configured." -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error confirming user: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure AWS CLI is installed and configured with proper credentials." -ForegroundColor Yellow
}

Write-Host "`nTo use this script:" -ForegroundColor Cyan
Write-Host ".\confirm-user.ps1 -Username 'test@example.com'"
