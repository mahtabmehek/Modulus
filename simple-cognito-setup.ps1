# Simple Cognito Setup Runner
Write-Host "Modulus Cognito Setup" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

$errors = 0

# Check AWS
Write-Host "`nChecking AWS CLI..." -ForegroundColor Yellow
try {
    $aws = aws --version 2>&1
    if ($aws -like "*aws-cli*") {
        Write-Host "AWS CLI: OK" -ForegroundColor Green
    } else {
        Write-Host "AWS CLI: MISSING" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host "AWS CLI: ERROR" -ForegroundColor Red
    $errors++
}

# Check credentials
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
try {
    $creds = aws sts get-caller-identity 2>&1
    if ($creds -like "*error*") {
        Write-Host "AWS Credentials: NOT CONFIGURED" -ForegroundColor Red
        $errors++
    } else {
        Write-Host "AWS Credentials: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "AWS Credentials: ERROR" -ForegroundColor Red
    $errors++
}

if ($errors -gt 0) {
    Write-Host "`nSetup aborted due to errors." -ForegroundColor Red
    exit 1
}

# Create database files
Write-Host "`nCreating database files..." -ForegroundColor Yellow
try {
    & ".\create-cognito-database.ps1"
    Write-Host "Database files: CREATED" -ForegroundColor Green
} catch {
    Write-Host "Database files: ERROR" -ForegroundColor Red
}

# Create simple Cognito setup
Write-Host "`nCreating Cognito User Pool..." -ForegroundColor Yellow

$poolCmd = "aws cognito-idp create-user-pool --pool-name 'modulus-lms-users' --output json"
$poolResult = Invoke-Expression $poolCmd 2>&1

if ($LASTEXITCODE -eq 0 -and $poolResult -notlike "*error*") {
    $pool = $poolResult | ConvertFrom-Json
    $poolId = $pool.UserPool.Id
    Write-Host "User Pool created: $poolId" -ForegroundColor Green
    
    # Create app client
    Write-Host "Creating App Client..." -ForegroundColor Yellow
    $clientCmd = "aws cognito-idp create-user-pool-client --user-pool-id '$poolId' --client-name 'modulus-web-client' --output json"
    $clientResult = Invoke-Expression $clientCmd 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $clientResult -notlike "*error*") {
        $client = $clientResult | ConvertFrom-Json
        $clientId = $client.UserPoolClient.ClientId
        Write-Host "App Client created: $clientId" -ForegroundColor Green
        
        # Save config
        $config = @"
# Cognito Configuration
USER_POOL_ID=$poolId
CLIENT_ID=$clientId
REGION=eu-west-2
"@
        $config | Out-File -FilePath "cognito-config.txt" -Encoding UTF8
        Write-Host "Config saved: cognito-config.txt" -ForegroundColor Green
        
    } else {
        Write-Host "App Client creation failed: $clientResult" -ForegroundColor Red
    }
} else {
    Write-Host "User Pool creation failed: $poolResult" -ForegroundColor Red
}

Write-Host "`nSetup complete!" -ForegroundColor Cyan
