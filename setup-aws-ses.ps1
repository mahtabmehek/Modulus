# AWS SES Setup for Cognito Email Verification
# This script will help configure AWS SES to send Cognito verification emails

Write-Host "=== AWS SES Setup for Cognito Email Verification ===" -ForegroundColor Green

# Check if AWS CLI is installed
Write-Host "`nChecking AWS CLI installation..." -ForegroundColor Cyan
try {
    $awsVersion = aws --version
    Write-Host "✓ AWS CLI is installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check AWS credentials
Write-Host "`nChecking AWS credentials..." -ForegroundColor Cyan
try {
    $identity = aws sts get-caller-identity --output text --query 'Account' 2>$null
    if ($identity) {
        Write-Host "✓ AWS credentials are configured (Account: $identity)" -ForegroundColor Green
    } else {
        Write-Host "✗ AWS credentials not configured" -ForegroundColor Red
        Write-Host "Run: aws configure" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Failed to verify AWS credentials" -ForegroundColor Red
    exit 1
}

$region = "eu-west-2"
Write-Host "`nUsing AWS region: $region" -ForegroundColor Cyan

# Step 1: Verify email address for sending
Write-Host "`n=== Step 1: Email Address Verification ===" -ForegroundColor Yellow
$senderEmail = Read-Host "Enter the email address you want to use for sending Cognito emails"

if ($senderEmail) {
    Write-Host "Verifying email address: $senderEmail" -ForegroundColor Cyan
    
    try {
        aws ses verify-email-identity --email-address $senderEmail --region $region
        Write-Host "✓ Verification email sent to $senderEmail" -ForegroundColor Green
        Write-Host "Please check your email and click the verification link." -ForegroundColor Yellow
        Write-Host "This may take a few minutes to arrive." -ForegroundColor Gray
    } catch {
        Write-Host "✗ Failed to send verification email" -ForegroundColor Red
    }
} else {
    Write-Host "No email address provided. Skipping email verification." -ForegroundColor Yellow
}

# Step 2: Check SES sending quota and sandbox status
Write-Host "`n=== Step 2: SES Account Status ===" -ForegroundColor Yellow
try {
    $quota = aws ses get-send-quota --region $region --output json | ConvertFrom-Json
    $stats = aws ses get-send-statistics --region $region --output json | ConvertFrom-Json
    
    Write-Host "Current SES Status:" -ForegroundColor Cyan
    Write-Host "  - Max 24 Hour Send: $($quota.Max24HourSend)" -ForegroundColor White
    Write-Host "  - Max Send Rate: $($quota.MaxSendRate) emails/second" -ForegroundColor White
    Write-Host "  - Sent Last 24h: $($quota.SentLast24Hours)" -ForegroundColor White
    
    if ($quota.Max24HourSend -eq 200) {
        Write-Host "⚠ SES is in SANDBOX mode (limited to 200 emails/day)" -ForegroundColor Yellow
        Write-Host "  - Can only send to verified email addresses" -ForegroundColor Gray
        Write-Host "  - Request production access for unrestricted sending" -ForegroundColor Gray
    } else {
        Write-Host "✓ SES has production access" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Failed to get SES status" -ForegroundColor Red
}

# Step 3: Check verified email addresses
Write-Host "`n=== Step 3: Verified Email Addresses ===" -ForegroundColor Yellow
try {
    $verifiedEmails = aws ses list-verified-email-addresses --region $region --output json | ConvertFrom-Json
    
    if ($verifiedEmails.VerifiedEmailAddresses.Count -gt 0) {
        Write-Host "Verified email addresses:" -ForegroundColor Green
        foreach ($email in $verifiedEmails.VerifiedEmailAddresses) {
            Write-Host "  ✓ $email" -ForegroundColor Green
        }
    } else {
        Write-Host "No verified email addresses found." -ForegroundColor Yellow
        Write-Host "You need to verify at least one email address to send emails." -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to list verified email addresses" -ForegroundColor Red
}

# Step 4: Configure Cognito to use custom email
Write-Host "`n=== Step 4: Cognito Email Configuration ===" -ForegroundColor Yellow
$userPoolId = "eu-west-2_4vo3VDZa5"

if ($senderEmail -and $verifiedEmails.VerifiedEmailAddresses -contains $senderEmail) {
    Write-Host "Configuring Cognito User Pool to use SES..." -ForegroundColor Cyan
    
    # Create email configuration JSON
    $emailConfig = @{
        EmailSendingAccount = "DEVELOPER"
        SourceArn = "arn:aws:ses:${region}:${identity}:identity/${senderEmail}"
        ReplyToEmailAddress = $senderEmail
    } | ConvertTo-Json
    
    try {
        aws cognito-idp update-user-pool --user-pool-id $userPoolId --email-configuration $emailConfig --region $region
        Write-Host "✓ Cognito User Pool email configuration updated" -ForegroundColor Green
        Write-Host "  - Now using SES for email delivery" -ForegroundColor Gray
        Write-Host "  - Sender: $senderEmail" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Failed to update Cognito email configuration" -ForegroundColor Red
        Write-Host "This may require additional IAM permissions." -ForegroundColor Gray
    }
} else {
    Write-Host "Skipping Cognito configuration - email not verified yet." -ForegroundColor Yellow
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Check your email ($senderEmail) for AWS verification link"
Write-Host "2. Click the verification link to confirm your email"
Write-Host "3. Wait 5-10 minutes for verification to complete"
Write-Host "4. Re-run this script to configure Cognito"
Write-Host "5. Test Cognito user registration to verify emails are sent"

Write-Host "`n=== Troubleshooting ===" -ForegroundColor Yellow
Write-Host "• If emails still don't arrive, check spam/junk folders"
Write-Host "• SES sandbox mode only sends to verified addresses"
Write-Host "• Request production access for sending to any email"
Write-Host "• Consider using AWS support for SES setup assistance"

Write-Host "`n=== Production Considerations ===" -ForegroundColor Magenta
Write-Host "• Domain verification (instead of individual emails)"
Write-Host "• Custom email templates for branding"
Write-Host "• DKIM and SPF records for deliverability"
Write-Host "• Bounce and complaint handling"
