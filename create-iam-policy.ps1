# Create IAM Policy for SES and Cognito Integration
# This script creates the necessary IAM permissions

Write-Host "=== Creating IAM Policy for SES-Cognito Integration ===" -ForegroundColor Green

$policyName = "SESCognitoIntegrationPolicy"
$policyFile = "ses-cognito-iam-policy.json"

# Check if policy file exists
if (-not (Test-Path $policyFile)) {
    Write-Host "✗ Policy file $policyFile not found" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 1: Creating IAM policy..." -ForegroundColor Yellow
try {
    # Create the IAM policy
    $policyResult = aws iam create-policy --policy-name $policyName --policy-document file://$policyFile --description "Policy for SES and Cognito integration" --output json | ConvertFrom-Json
    
    Write-Host "✓ IAM policy created successfully" -ForegroundColor Green
    Write-Host "Policy ARN: $($policyResult.Policy.Arn)" -ForegroundColor Cyan
    
    $policyArn = $policyResult.Policy.Arn
} catch {
    # Policy might already exist, try to get it
    try {
        $accountId = aws sts get-caller-identity --query Account --output text
        $policyArn = "arn:aws:iam::${accountId}:policy/${policyName}"
        
        aws iam get-policy --policy-arn $policyArn --output json | Out-Null
        Write-Host "✓ IAM policy already exists: $policyArn" -ForegroundColor Yellow
    } catch {
        Write-Host "✗ Failed to create or find IAM policy" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nStep 2: Getting current user..." -ForegroundColor Yellow
try {
    $currentUser = aws sts get-caller-identity --query Arn --output text
    $userName = ($currentUser -split '/')[-1]
    
    Write-Host "Current user: $userName" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to get current user" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Attaching policy to user..." -ForegroundColor Yellow
try {
    aws iam attach-user-policy --user-name $userName --policy-arn $policyArn
    Write-Host "✓ Policy attached to user $userName" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to attach policy to user" -ForegroundColor Red
    Write-Host "You may need to attach the policy manually in AWS Console" -ForegroundColor Yellow
    Write-Host "Policy ARN: $policyArn" -ForegroundColor Cyan
}

Write-Host "`n=== IAM Setup Complete! ===" -ForegroundColor Green
Write-Host "You can now run the SES setup script:" -ForegroundColor Cyan
Write-Host ".\setup-ses-quick.ps1 -EmailAddress your@email.com" -ForegroundColor Yellow

Write-Host "`nAlternative: Manual Setup in AWS Console" -ForegroundColor Magenta
Write-Host "1. Go to IAM > Users > $userName > Permissions"
Write-Host "2. Attach policy: $policyName"
Write-Host "3. Go to SES > Email Addresses > Verify New Email"
Write-Host "4. Go to Cognito > User Pools > Email > Configure with SES"
