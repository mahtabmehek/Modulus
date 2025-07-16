# AWS Cognito Setup for Modulus LMS Migration
# This script sets up Cognito User Pool and prepares for migration

param(
    [string]$UserPoolName = "modulus-lms-users",
    [string]$Region = "eu-west-2",
    [switch]$DryRun
)

Write-Host "🚀 Setting up AWS Cognito for Modulus LMS" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
}

# Check prerequisites
Write-Host "`n✅ Checking prerequisites..." -ForegroundColor Green
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "   AWS Account: $($identity.Account)" -ForegroundColor White
    Write-Host "   User: $($identity.Arn)" -ForegroundColor White
    Write-Host "   Region: $(aws configure get region)" -ForegroundColor White
} catch {
    Write-Host "❌ AWS CLI not configured properly" -ForegroundColor Red
    exit 1
}

# User Pool configuration
$userPoolConfig = @{
    PoolName = $UserPoolName
    AutoVerifiedAttributes = @("email")
    UsernameAttributes = @("email")
    PasswordPolicy = @{
        MinimumLength = 8
        RequireUppercase = $true
        RequireLowercase = $true
        RequireNumbers = $true
        RequireSymbols = $false
    }
    Schema = @(
        @{
            Name = "email"
            AttributeDataType = "String"
            Required = $true
            Mutable = $true
        },
        @{
            Name = "name"
            AttributeDataType = "String"
            Required = $true
            Mutable = $true
        },
        @{
            Name = "custom:role"
            AttributeDataType = "String"
            Required = $false
            Mutable = $true
        },
        @{
            Name = "custom:level"
            AttributeDataType = "Number"
            Required = $false
            Mutable = $true
        },
        @{
            Name = "custom:total_points"
            AttributeDataType = "Number"
            Required = $false
            Mutable = $true
        },
        @{
            Name = "custom:course_code"
            AttributeDataType = "String"
            Required = $false
            Mutable = $true
        }
    )
}

Write-Host "`n📋 Cognito User Pool Configuration:" -ForegroundColor Cyan
Write-Host "   Pool Name: $($userPoolConfig.PoolName)" -ForegroundColor White
Write-Host "   Auto-verified: Email" -ForegroundColor White
Write-Host "   Login with: Email" -ForegroundColor White
Write-Host "   Password Policy: 8+ chars, upper, lower, numbers" -ForegroundColor White
Write-Host "   Custom Attributes: role, level, total_points, course_code" -ForegroundColor White

if ($DryRun) {
    Write-Host "`n🔍 DRY RUN: Would create User Pool with above configuration" -ForegroundColor Yellow
} else {
    Write-Host "`n🔄 Creating Cognito User Pool..." -ForegroundColor Yellow
    
    # Create the user pool
    $createPoolCmd = @"
aws cognito-idp create-user-pool \
    --pool-name "$($userPoolConfig.PoolName)" \
    --auto-verified-attributes email \
    --username-attributes email \
    --password-policy MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false \
    --schema '[
        {
            "Name": "email",
            "AttributeDataType": "String",
            "Required": true,
            "Mutable": true
        },
        {
            "Name": "name",
            "AttributeDataType": "String",
            "Required": true,
            "Mutable": true
        },
        {
            "Name": "role",
            "AttributeDataType": "String",
            "Required": false,
            "Mutable": true
        },
        {
            "Name": "level",
            "AttributeDataType": "Number",
            "Required": false,
            "Mutable": true
        },
        {
            "Name": "total_points",
            "AttributeDataType": "Number",
            "Required": false,
            "Mutable": true
        },
        {
            "Name": "course_code",
            "AttributeDataType": "String",
            "Required": false,
            "Mutable": true
        }
    ]' \
    --output json
"@

    try {
        $userPool = Invoke-Expression $createPoolCmd | ConvertFrom-Json
        $userPoolId = $userPool.UserPool.Id
        Write-Host "   ✅ User Pool created: $userPoolId" -ForegroundColor Green
        
        # Create App Client
        Write-Host "`n🔄 Creating App Client..." -ForegroundColor Yellow
        $appClient = aws cognito-idp create-user-pool-client --user-pool-id $userPoolId --client-name "modulus-lms-app" --generate-secret --explicit-auth-flows ADMIN_NO_SRP_AUTH USER_PASSWORD_AUTH --output json | ConvertFrom-Json
        $clientId = $appClient.UserPoolClient.ClientId
        $clientSecret = $appClient.UserPoolClient.ClientSecret
        Write-Host "   ✅ App Client created: $clientId" -ForegroundColor Green
        
        # Create User Groups
        Write-Host "`n🔄 Creating User Groups..." -ForegroundColor Yellow
        $groups = @("students", "instructors", "staff", "admins")
        foreach ($group in $groups) {
            try {
                aws cognito-idp create-group --group-name $group --user-pool-id $userPoolId --description "Modulus LMS $group group" --output json > $null
                Write-Host "   ✅ Group created: $group" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️  Group $group might already exist" -ForegroundColor Yellow
            }
        }
        
        # Save configuration
        $config = @{
            UserPoolId = $userPoolId
            ClientId = $clientId
            ClientSecret = $clientSecret
            Region = $Region
            Groups = $groups
        }
        
        $configJson = $config | ConvertTo-Json -Depth 3
        $configJson | Out-File -FilePath "cognito-config.json" -Encoding UTF8
        Write-Host "`n💾 Configuration saved to cognito-config.json" -ForegroundColor Green
        
        # Update environment variables
        Write-Host "`n🔄 Updating .env.local..." -ForegroundColor Yellow
        $envContent = Get-Content ".env.local" -ErrorAction SilentlyContinue
        $newEnvContent = @()
        $updatedVars = @()
        
        # Add or update Cognito variables
        $cognitoVars = @{
            "NEXT_PUBLIC_COGNITO_USER_POOL_ID" = $userPoolId
            "NEXT_PUBLIC_COGNITO_CLIENT_ID" = $clientId
            "COGNITO_CLIENT_SECRET" = $clientSecret
            "NEXT_PUBLIC_COGNITO_REGION" = $Region
        }
        
        foreach ($line in $envContent) {
            $updated = $false
            foreach ($var in $cognitoVars.Keys) {
                if ($line -like "$var=*") {
                    $newEnvContent += "$var=$($cognitoVars[$var])"
                    $updatedVars += $var
                    $updated = $true
                    break
                }
            }
            if (-not $updated) {
                $newEnvContent += $line
            }
        }
        
        # Add any missing variables
        foreach ($var in $cognitoVars.Keys) {
            if ($var -notin $updatedVars) {
                $newEnvContent += "$var=$($cognitoVars[$var])"
            }
        }
        
        $newEnvContent | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Host "   ✅ Environment variables updated" -ForegroundColor Green
        
        Write-Host "`n🎉 Cognito setup complete!" -ForegroundColor Green
        Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
        Write-Host "   1. Review cognito-config.json" -ForegroundColor White
        Write-Host "   2. Run: ./cognito-migrate-users.ps1 to migrate existing users" -ForegroundColor White
        Write-Host "   3. Update frontend to use Cognito authentication" -ForegroundColor White
        Write-Host "   4. Update backend to validate Cognito tokens" -ForegroundColor White
        
    } catch {
        Write-Host "❌ Failed to create User Pool: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Check AWS permissions and try again" -ForegroundColor Yellow
    }
}

Write-Host "`n📋 Usage Examples:" -ForegroundColor Cyan
Write-Host "   ./aws-cognito-setup.ps1 -DryRun" -ForegroundColor White
Write-Host "   ./aws-cognito-setup.ps1 -UserPoolName 'my-custom-pool'" -ForegroundColor White
Write-Host "   ./aws-cognito-setup.ps1 -Region 'us-east-1'" -ForegroundColor White
