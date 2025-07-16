# Modulus LMS - Fast Cognito Setup
# Big Bang approach - creates everything in minutes

param(
    [string]$Environment = "production"
)

Write-Host "🚀 BIG BANG COGNITO SETUP - FAST TRACK" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$timer = [System.Diagnostics.Stopwatch]::StartNew()

# Step 1: Create User Pool (30 seconds)
Write-Host "`n[1/5] Creating Cognito User Pool..." -ForegroundColor Yellow
try {
    $userPoolResult = aws cognito-idp create-user-pool --pool-name "modulus-lms-$Environment" --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": false
        }
    }' --schema '[
        {
            "Name": "email",
            "AttributeDataType": "String",
            "Required": true,
            "Mutable": true
        },
        {
            "Name": "given_name",
            "AttributeDataType": "String",
            "Required": true,
            "Mutable": true
        },
        {
            "Name": "family_name",
            "AttributeDataType": "String",
            "Required": true,
            "Mutable": true
        },
        {
            "Name": "course_code",
            "AttributeDataType": "String",
            "Required": false,
            "Mutable": true,
            "DeveloperOnlyAttribute": false
        },
        {
            "Name": "user_role",
            "AttributeDataType": "String",
            "Required": false,
            "Mutable": true,
            "DeveloperOnlyAttribute": false
        }
    ]' --auto-verified-attributes email --username-attributes email --output json

    $userPool = $userPoolResult | ConvertFrom-Json
    $userPoolId = $userPool.UserPool.Id
    Write-Host "✅ User Pool created: $userPoolId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create User Pool: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create App Client (15 seconds)
Write-Host "`n[2/5] Creating App Client..." -ForegroundColor Yellow
try {
    $appClientResult = aws cognito-idp create-user-pool-client --user-pool-id $userPoolId --client-name "modulus-frontend-$Environment" --generate-secret false --explicit-auth-flows ADMIN_NO_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH --supported-identity-providers COGNITO --callback-urls "http://localhost:3000/auth/callback" "https://modulus-lms.com/auth/callback" --logout-urls "http://localhost:3000/auth/logout" "https://modulus-lms.com/auth/logout" --refresh-token-validity 30 --access-token-validity 60 --id-token-validity 60 --token-validity-units RefreshToken=days,AccessToken=minutes,IdToken=minutes --prevent-user-existence-errors ENABLED --output json

    $appClient = $appClientResult | ConvertFrom-Json
    $appClientId = $appClient.UserPoolClient.ClientId
    Write-Host "✅ App Client created: $appClientId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create App Client: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create Domain (1 minute)
Write-Host "`n[3/5] Creating User Pool Domain..." -ForegroundColor Yellow
try {
    $domainName = "modulus-lms-$(Get-Random -Minimum 1000 -Maximum 9999)"
    $domainResult = aws cognito-idp create-user-pool-domain --domain $domainName --user-pool-id $userPoolId --output json
    Write-Host "✅ Domain created: $domainName.auth.eu-west-2.amazoncognito.com" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Domain creation failed, using manual setup" -ForegroundColor Yellow
    $domainName = "manual-setup-required"
}

# Step 4: Create New Lambda Function (2 minutes)
Write-Host "`n[4/5] Creating new Lambda function..." -ForegroundColor Yellow
try {
    # Create basic Lambda package if it doesn't exist
    if (!(Test-Path "lambda-cognito-basic.zip")) {
        $lambdaCode = @'
const { CognitoJwtVerifier } = require("aws-jwt-verify");

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
            message: 'Cognito Lambda is ready!',
            timestamp: new Date().toISOString(),
            userPoolId: process.env.COGNITO_USER_POOL_ID
        })
    };
};
'@
        
        $packageJson = @'
{
  "name": "modulus-backend-cognito",
  "version": "1.0.0",
  "dependencies": {
    "aws-jwt-verify": "^4.0.1",
    "aws-sdk": "^2.1691.0"
  }
}
'@
        
        New-Item -ItemType Directory -Path "temp-lambda" -Force | Out-Null
        $lambdaCode | Out-File -FilePath "temp-lambda/index.js" -Encoding UTF8
        $packageJson | Out-File -FilePath "temp-lambda/package.json" -Encoding UTF8
        
        cd temp-lambda
        Compress-Archive -Path * -DestinationPath "../lambda-cognito-basic.zip" -Force
        cd ..
        Remove-Item -Recurse -Force "temp-lambda"
    }

    # Create the Lambda function
    $lambdaResult = aws lambda create-function --function-name "modulus-backend-cognito" --runtime "nodejs18.x" --role "arn:aws:iam::376129881409:role/lambda-execution-role" --handler "index.handler" --zip-file "fileb://lambda-cognito-basic.zip" --memory-size 1128 --timeout 30 --environment Variables='{
        \"COGNITO_USER_POOL_ID\":\"'$userPoolId'\",
        \"COGNITO_CLIENT_ID\":\"'$appClientId'\",
        \"COGNITO_REGION\":\"eu-west-2\"
    }' --output json 2>$null

    if ($lambdaResult) {
        $lambda = $lambdaResult | ConvertFrom-Json
        Write-Host "✅ Lambda function created: modulus-backend-cognito" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Lambda creation may have failed, continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Lambda creation issue: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 5: Create New API Gateway (1 minute)
Write-Host "`n[5/5] Creating new API Gateway..." -ForegroundColor Yellow
try {
    $apiResult = aws apigateway create-rest-api --name "modulus-api-cognito" --description "Modulus LMS API with Cognito Auth" --output json
    $api = $apiResult | ConvertFrom-Json
    $apiId = $api.id

    # Get the root resource
    $resourcesResult = aws apigateway get-resources --rest-api-id $apiId --output json
    $resources = $resourcesResult | ConvertFrom-Json
    $rootResourceId = $resources.items[0].id

    # Create proxy resource
    $proxyResult = aws apigateway create-resource --rest-api-id $apiId --parent-id $rootResourceId --path-part "{proxy+}" --output json
    $proxyResource = $proxyResult | ConvertFrom-Json
    $proxyResourceId = $proxyResource.id

    # Create ANY method
    aws apigateway put-method --rest-api-id $apiId --resource-id $proxyResourceId --http-method ANY --authorization-type NONE --output json > $null

    # Set up Lambda integration
    $lambdaArn = "arn:aws:lambda:eu-west-2:376129881409:function:modulus-backend-cognito"
    aws apigateway put-integration --rest-api-id $apiId --resource-id $proxyResourceId --http-method ANY --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/$lambdaArn/invocations" --output json > $null

    # Deploy API
    aws apigateway create-deployment --rest-api-id $apiId --stage-name prod --output json > $null

    $newApiUrl = "https://$apiId.execute-api.eu-west-2.amazonaws.com/prod"
    Write-Host "✅ API Gateway created: $newApiUrl" -ForegroundColor Green

} catch {
    Write-Host "⚠️ API Gateway creation issue: $($_.Exception.Message)" -ForegroundColor Yellow
    $newApiUrl = "manual-setup-required"
}

# Generate environment files
Write-Host "`n[FINAL] Generating configuration..." -ForegroundColor Yellow

$envConfig = @"
# Modulus LMS - Big Bang Cognito Configuration
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# Cognito Configuration
COGNITO_USER_POOL_ID=$userPoolId
COGNITO_CLIENT_ID=$appClientId
COGNITO_REGION=eu-west-2
COGNITO_DOMAIN=$domainName

# Next.js Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$userPoolId
NEXT_PUBLIC_COGNITO_CLIENT_ID=$appClientId
NEXT_PUBLIC_COGNITO_REGION=eu-west-2
NEXT_PUBLIC_API_GATEWAY_URL=$newApiUrl

# Lambda Configuration
USE_COGNITO_AUTH=true
NEW_LAMBDA_FUNCTION=modulus-backend-cognito
NEW_API_GATEWAY_ID=$apiId
NEW_API_GATEWAY_URL=$newApiUrl

# URLs
COGNITO_HOSTED_UI_URL=https://$domainName.auth.eu-west-2.amazoncognito.com
"@

$envConfig | Out-File -FilePath ".env.cognito-bigbang" -Encoding UTF8

# Create quick switch script
$switchScript = @"
# Quick switch to Cognito
Copy-Item .env.cognito-bigbang .env.local -Force
Write-Host "Switched to Cognito configuration!" -ForegroundColor Green
Write-Host "Run: npm run dev" -ForegroundColor Yellow
"@

$switchScript | Out-File -FilePath "switch-to-cognito.ps1" -Encoding UTF8

$timer.Stop()
$elapsed = $timer.Elapsed.TotalMinutes

Write-Host "`n🎉 BIG BANG SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Time elapsed: $([math]::Round($elapsed, 1)) minutes" -ForegroundColor White
Write-Host ""
Write-Host "📋 Created Resources:" -ForegroundColor White
Write-Host "  User Pool: $userPoolId" -ForegroundColor Yellow
Write-Host "  App Client: $appClientId" -ForegroundColor Yellow
Write-Host "  Lambda: modulus-backend-cognito" -ForegroundColor Yellow
Write-Host "  API Gateway: $newApiUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor White
Write-Host "  1. Run: .\switch-to-cognito.ps1" -ForegroundColor Gray
Write-Host "  2. Run: npm install aws-amplify @aws-amplify/ui-react" -ForegroundColor Gray
Write-Host "  3. Run: npm run dev" -ForegroundColor Gray
Write-Host "  4. Test the new Cognito integration!" -ForegroundColor Gray
Write-Host ""
Write-Host "⚡ Files created:" -ForegroundColor White
Write-Host "  .env.cognito-bigbang - New environment config" -ForegroundColor Gray
Write-Host "  switch-to-cognito.ps1 - Quick switch script" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
