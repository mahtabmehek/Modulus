# Modulus LMS - Cognito Setup Script
# Phase 1: Initial Cognito Infrastructure Setup

param(
    [string]$Environment = "development",
    [string]$Region = "eu-west-2"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MODULUS LMS - COGNITO SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

# Test AWS connection
Write-Host "`n[INIT] Testing AWS CLI connection..." -ForegroundColor Yellow
try {
    $awsTest = aws sts get-caller-identity --output json 2>&1
    if ($awsTest -like "*error*") {
        Write-Host "[ERROR] AWS CLI Error: $awsTest" -ForegroundColor Red
        exit 1
    } else {
        $identity = $awsTest | ConvertFrom-Json
        Write-Host "[SUCCESS] Connected as: $($identity.Arn)" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] AWS CLI test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 1: Create User Pool
Write-Host "`n[STEP 1] Creating Cognito User Pool..." -ForegroundColor Cyan
try {
    $userPoolConfig = @{
        PoolName = "modulus-lms-$Environment"
        Policies = @{
            PasswordPolicy = @{
                MinimumLength = 8
                RequireUppercase = $true
                RequireLowercase = $true
                RequireNumbers = $true
                RequireSymbols = $false
                TemporaryPasswordValidityDays = 7
            }
        }
        UsernameConfiguration = @{
            CaseSensitive = $false
        }
        Schema = @(
            @{
                Name = "email"
                AttributeDataType = "String"
                Required = $true
                Mutable = $true
            },
            @{
                Name = "given_name"
                AttributeDataType = "String"
                Required = $true
                Mutable = $true
            },
            @{
                Name = "family_name"
                AttributeDataType = "String"
                Required = $true
                Mutable = $true
            },
            @{
                Name = "course_code"
                AttributeDataType = "String"
                Required = $false
                Mutable = $true
                DeveloperOnlyAttribute = $false
            },
            @{
                Name = "user_role"
                AttributeDataType = "String"
                Required = $false
                Mutable = $true
                DeveloperOnlyAttribute = $false
            }
        )
        AutoVerifiedAttributes = @("email")
        AliasAttributes = @("email")
        UsernameAttributes = @("email")
        VerificationMessageTemplate = @{
            DefaultEmailOption = "CONFIRM_WITH_CODE"
            EmailSubject = "Modulus LMS - Verify your email"
            EmailMessage = "Welcome to Modulus LMS! Your verification code is {####}"
        }
        EmailConfiguration = @{
            EmailSendingAccount = "COGNITO_DEFAULT"
        }
        AdminCreateUserConfig = @{
            AllowAdminCreateUserOnly = $true
            InviteMessageTemplate = @{
                EmailSubject = "Welcome to Modulus LMS"
                EmailMessage = "Welcome! Your temporary password is {password}. Please sign in and change your password."
            }
        }
    }
    
    $userPoolJson = $userPoolConfig | ConvertTo-Json -Depth 10
    $userPoolJson | Out-File -FilePath "temp-user-pool-config.json" -Encoding UTF8
    
    $userPoolResult = aws cognito-idp create-user-pool --cli-input-json file://temp-user-pool-config.json --output json
    Remove-Item "temp-user-pool-config.json" -Force
    
    if ($userPoolResult) {
        $userPool = $userPoolResult | ConvertFrom-Json
        $userPoolId = $userPool.UserPool.Id
        Write-Host "[SUCCESS] User Pool created: $userPoolId" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create User Pool" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] User Pool creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create App Client
Write-Host "`n[STEP 2] Creating App Client..." -ForegroundColor Cyan
try {
    $appClientConfig = @{
        UserPoolId = $userPoolId
        ClientName = "modulus-frontend-$Environment"
        GenerateSecret = $false
        ExplicitAuthFlows = @(
            "ADMIN_NO_SRP_AUTH",
            "ALLOW_USER_PASSWORD_AUTH",
            "ALLOW_REFRESH_TOKEN_AUTH",
            "ALLOW_USER_SRP_AUTH"
        )
        SupportedIdentityProviders = @("COGNITO")
        CallbackURLs = @(
            "http://localhost:3000/auth/callback",
            "https://modulus-lms-$Environment.com/auth/callback"
        )
        LogoutURLs = @(
            "http://localhost:3000/auth/logout",
            "https://modulus-lms-$Environment.com/auth/logout"
        )
        ReadAttributes = @(
            "email",
            "given_name",
            "family_name",
            "custom:course_code",
            "custom:user_role"
        )
        WriteAttributes = @(
            "email",
            "given_name",
            "family_name",
            "custom:course_code",
            "custom:user_role"
        )
        RefreshTokenValidity = 30
        AccessTokenValidity = 60
        IdTokenValidity = 60
        TokenValidityUnits = @{
            RefreshToken = "days"
            AccessToken = "minutes"
            IdToken = "minutes"
        }
        PreventUserExistenceErrors = "ENABLED"
    }
    
    $appClientJson = $appClientConfig | ConvertTo-Json -Depth 10
    $appClientJson | Out-File -FilePath "temp-app-client-config.json" -Encoding UTF8
    
    $appClientResult = aws cognito-idp create-user-pool-client --cli-input-json file://temp-app-client-config.json --output json
    Remove-Item "temp-app-client-config.json" -Force
    
    if ($appClientResult) {
        $appClient = $appClientResult | ConvertFrom-Json
        $appClientId = $appClient.UserPoolClient.ClientId
        Write-Host "[SUCCESS] App Client created: $appClientId" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create App Client" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] App Client creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create User Pool Domain (Optional)
Write-Host "`n[STEP 3] Creating User Pool Domain..." -ForegroundColor Cyan
try {
    $domainName = "modulus-lms-$Environment-$(Get-Random -Minimum 1000 -Maximum 9999)"
    $domainResult = aws cognito-idp create-user-pool-domain --domain $domainName --user-pool-id $userPoolId --output json
    
    if ($domainResult) {
        Write-Host "[SUCCESS] Domain created: $domainName.auth.$Region.amazoncognito.com" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Domain creation failed, continuing..." -ForegroundColor Yellow
        $domainName = "manual-setup-required"
    }
} catch {
    Write-Host "[WARNING] Domain creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
    $domainName = "manual-setup-required"
}

# Step 4: Generate Environment Configuration
Write-Host "`n[STEP 4] Generating environment configuration..." -ForegroundColor Cyan

$envConfig = @"
# Modulus LMS - Cognito Configuration
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# Cognito Configuration
COGNITO_USER_POOL_ID=$userPoolId
COGNITO_CLIENT_ID=$appClientId
COGNITO_REGION=$Region
COGNITO_DOMAIN=$domainName

# Next.js Public Variables
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$userPoolId
NEXT_PUBLIC_COGNITO_CLIENT_ID=$appClientId
NEXT_PUBLIC_COGNITO_REGION=$Region

# Lambda Environment Variables
USE_COGNITO_AUTH=true
COGNITO_USER_POOL_ID=$userPoolId
COGNITO_CLIENT_ID=$appClientId

# URLs
COGNITO_HOSTED_UI_URL=https://$domainName.auth.$Region.amazoncognito.com
COGNITO_LOGIN_URL=https://$domainName.auth.$Region.amazoncognito.com/login
COGNITO_LOGOUT_URL=https://$domainName.auth.$Region.amazoncognito.com/logout
"@

$envConfig | Out-File -FilePath ".env.cognito" -Encoding UTF8

Write-Host "[SUCCESS] Configuration saved to .env.cognito" -ForegroundColor Green

# Step 5: Create Lambda Environment Update Script
Write-Host "`n[STEP 5] Creating Lambda update script..." -ForegroundColor Cyan

$lambdaUpdateScript = @"
# Update Lambda environment variables for Cognito
aws lambda update-function-configuration --function-name modulus-backend --environment Variables='{
  \"COGNITO_USER_POOL_ID\":\"$userPoolId\",
  \"COGNITO_CLIENT_ID\":\"$appClientId\",
  \"COGNITO_REGION\":\"$Region\",
  \"USE_COGNITO_AUTH\":\"true\"
}'
"@

$lambdaUpdateScript | Out-File -FilePath "update-lambda-cognito.ps1" -Encoding UTF8

Write-Host "[SUCCESS] Lambda update script created: update-lambda-cognito.ps1" -ForegroundColor Green

# Step 6: Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "           SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cognito Resources Created:" -ForegroundColor White
Write-Host "  User Pool ID: $userPoolId" -ForegroundColor Yellow
Write-Host "  App Client ID: $appClientId" -ForegroundColor Yellow
Write-Host "  Domain: $domainName.auth.$Region.amazoncognito.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Copy .env.cognito to .env.local" -ForegroundColor Gray
Write-Host "  2. Run .\update-lambda-cognito.ps1" -ForegroundColor Gray
Write-Host "  3. Install frontend dependencies: npm install aws-amplify" -ForegroundColor Gray
Write-Host "  4. Update frontend authentication code" -ForegroundColor Gray
Write-Host "  5. Test authentication flow" -ForegroundColor Gray
Write-Host ""
Write-Host "Configuration files created:" -ForegroundColor White
Write-Host "  .env.cognito - Environment variables" -ForegroundColor Gray
Write-Host "  update-lambda-cognito.ps1 - Lambda update script" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
