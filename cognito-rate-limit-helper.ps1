# Clear Cognito Rate Limiting Script
# This script can help reset rate limiting by waiting or using admin commands

Write-Host "Cognito Rate Limiting Helper" -ForegroundColor Green
Write-Host "=========================="

$userPoolId = "eu-west-2_4vo3VDZa5"
$username = "mahtabmehek"
$region = "eu-west-2"

Write-Host "Checking user status..." -ForegroundColor Yellow
aws cognito-idp admin-get-user --user-pool-id $userPoolId --username $username --region $region --query 'UserStatus'

Write-Host "`nIf you're getting rate limited, you can:" -ForegroundColor Cyan
Write-Host "1. Wait 60 seconds before trying again"
Write-Host "2. Use a different email/username if testing"
Write-Host "3. Check spam folder for existing codes"
Write-Host "4. Contact AWS support to increase limits if needed for production"

Write-Host "`nTo test forgot password manually:" -ForegroundColor Magenta
Write-Host "aws cognito-idp forgot-password --client-id 4jfe4rmrv0mec1e2hrvmo32a2h --username $username --region $region"
