# Quick SES Setup Script for Cognito
# Simplified version for immediate setup

param(
    [Parameter(Mandatory=$false)]
    [string]$EmailAddress
)

$region = "eu-west-2"
$userPoolId = "eu-west-2_4vo3VDZa5"

Write-Host "=== Quick AWS SES Setup ===" -ForegroundColor Green

# If no email provided, ask for it
if (-not $EmailAddress) {
    $EmailAddress = Read-Host "Enter your email address for sending Cognito emails"
}

Write-Host "`nStep 1: Verifying email address: $EmailAddress" -ForegroundColor Yellow
try {
    aws ses verify-email-identity --email-address $EmailAddress --region $region
    Write-Host "✓ Verification email sent to $EmailAddress" -ForegroundColor Green
    Write-Host "Check your email and click the verification link." -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to verify email. Check AWS CLI configuration." -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Checking verification status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$maxAttempts = 12  # Wait up to 2 minutes
$attempt = 0

do {
    $attempt++
    Write-Host "Checking verification status (attempt $attempt/$maxAttempts)..." -ForegroundColor Gray
    
    try {
        $verifiedEmails = aws ses list-verified-email-addresses --region $region --output json | ConvertFrom-Json
        
        if ($verifiedEmails.VerifiedEmailAddresses -contains $EmailAddress) {
            Write-Host "✓ Email verified successfully!" -ForegroundColor Green
            break
        } else {
            Write-Host "Email not verified yet. Waiting..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        }
    } catch {
        Write-Host "Error checking verification status" -ForegroundColor Red
        Start-Sleep -Seconds 10
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "⚠ Email verification timeout. Please verify manually and re-run." -ForegroundColor Yellow
    Write-Host "Run: .\setup-ses-cognito.ps1 -EmailAddress $EmailAddress" -ForegroundColor Cyan
    exit 0
}

Write-Host "`nStep 3: Configuring Cognito to use SES..." -ForegroundColor Yellow
try {
    # Get AWS account ID
    $accountId = aws sts get-caller-identity --query Account --output text
    
    # Configure Cognito to use SES
    $emailConfigJson = @"
{
    "EmailSendingAccount": "DEVELOPER",
    "SourceArn": "arn:aws:ses:${region}:${accountId}:identity/${EmailAddress}",
    "ReplyToEmailAddress": "${EmailAddress}"
}
"@
    
    $emailConfigJson | aws cognito-idp update-user-pool --user-pool-id $userPoolId --email-configuration file:///dev/stdin --region $region
    
    Write-Host "✓ Cognito User Pool configured to use SES!" -ForegroundColor Green
    Write-Host "✓ Email verification should now work!" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Failed to configure Cognito. May need additional IAM permissions." -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "`n=== SES Setup Complete! ===" -ForegroundColor Green
Write-Host "Test by creating a new user in your application." -ForegroundColor Cyan
Write-Host "Verification emails should now be delivered successfully." -ForegroundColor Cyan
