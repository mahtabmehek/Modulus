# Cognito Rate Limit Workaround Script
# Creates a temporary test user for password reset testing

Write-Host "Creating temporary test user to bypass rate limits..." -ForegroundColor Green

$userPoolId = "eu-west-2_4vo3VDZa5"
$region = "eu-west-2"
$tempUsername = "testuser$(Get-Random -Minimum 1000 -Maximum 9999)"
$tempEmail = "mahtabmehek+test$(Get-Random -Minimum 100 -Maximum 999)@gmail.com"
$tempPassword = "TempPass123!"

Write-Host "Creating user: $tempUsername with email: $tempEmail" -ForegroundColor Yellow

try {
    # Create the user
    $result = aws cognito-idp admin-create-user --user-pool-id $userPoolId --username $tempUsername --user-attributes Name=email,Value=$tempEmail Name=email_verified,Value=true --temporary-password $tempPassword --message-action SUPPRESS --region $region | ConvertFrom-Json
    
    if ($result) {
        Write-Host "✅ User created successfully!" -ForegroundColor Green
        
        # Set permanent password
        aws cognito-idp admin-set-user-password --user-pool-id $userPoolId --username $tempUsername --password $tempPassword --permanent --region $region
        
        Write-Host "✅ Password set as permanent" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Test Credentials:" -ForegroundColor Cyan
        Write-Host "Username: $tempUsername"
        Write-Host "Email: $tempEmail"  
        Write-Host "Password: $tempPassword"
        Write-Host ""
        Write-Host "You can now test password reset with this user!" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "To clean up later, run:" -ForegroundColor Gray
        Write-Host "aws cognito-idp admin-delete-user --user-pool-id $userPoolId --username $tempUsername --region $region"
    }
}
catch {
    Write-Host "❌ Error creating user: $($_.Exception.Message)" -ForegroundColor Red
}
