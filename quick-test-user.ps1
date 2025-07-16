# Quick Test User Creation (Alternative to Rate Limits)
# Creates a new user with email+timestamp to avoid rate limiting

Write-Host "Creating fresh test user to bypass rate limits..." -ForegroundColor Green

$userPoolId = "eu-west-2_4vo3VDZa5"
$region = "eu-west-2"
$baseEmail = "mahtabmehek"
$domain = "gmail.com"
$timestamp = (Get-Date).ToString("MMddHHmm")
$testEmail = "$baseEmail+test$timestamp@$domain"
$testUsername = "test$timestamp"
$testPassword = "TestPass123!"

Write-Host "Creating user: $testUsername" -ForegroundColor Yellow
Write-Host "Email: $testEmail" -ForegroundColor Yellow

aws cognito-idp admin-create-user `
    --user-pool-id $userPoolId `
    --username $testUsername `
    --user-attributes Name=email,Value=$testEmail Name=email_verified,Value=true `
    --temporary-password $testPassword `
    --message-action SUPPRESS `
    --region $region

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ User created successfully!" -ForegroundColor Green
    
    # Set permanent password
    aws cognito-idp admin-set-user-password `
        --user-pool-id $userPoolId `
        --username $testUsername `
        --password $testPassword `
        --permanent `
        --region $region
    
    Write-Host "✅ Password set as permanent" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Use these credentials to test password reset:" -ForegroundColor Cyan
    Write-Host "Username: $testUsername"
    Write-Host "Email: $testEmail"  
    Write-Host "Password: $testPassword"
    Write-Host ""
    Write-Host "⚡ This fresh user should not have rate limiting!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create user" -ForegroundColor Red
}
