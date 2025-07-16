# Reset User Password in Cognito
# Use this script if you can't remember your password

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    [Parameter(Mandatory=$true)]
    [string]$NewPassword
)

$userPoolId = "eu-west-2_4vo3VDZa5"
$region = "eu-west-2"

Write-Host "Resetting password for user: $Username" -ForegroundColor Yellow

try {
    # Set a temporary password (user will need to change it on first login)
    aws cognito-idp admin-set-user-password --user-pool-id $userPoolId --username $Username --password $NewPassword --permanent --region $region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Password reset successfully!" -ForegroundColor Green
        Write-Host "New password: $NewPassword" -ForegroundColor Cyan
        Write-Host "You can now log in with this password." -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to reset password" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error resetting password: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Go to http://localhost:3000"
Write-Host "2. Click 'Sign In' tab"
Write-Host "3. Enter username: $Username"
Write-Host "4. Enter password: $NewPassword"
Write-Host "5. Complete login process"
