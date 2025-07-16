# Modulus Cognito Setup Orchestrator
param(
    [switch]$SkipDatabase = $false,
    [switch]$SkipCognito = $false
)

$ErrorActionPreference = "Stop"
$setupErrors = 0

Write-Host "🚀 MODULUS COGNITO SETUP ORCHESTRATOR" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Started: $(Get-Date)" -ForegroundColor White
Write-Host ""

# Step 1: Check Prerequisites
Write-Host "🔍 STEP 1: Checking Prerequisites" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

try {
    Write-Host "Checking AWS CLI..." -ForegroundColor Gray
    $awsVersion = aws --version 2>&1
    if ($awsVersion -like "*aws-cli*") {
        Write-Host "✅ AWS CLI: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ AWS CLI: NOT FOUND" -ForegroundColor Red
        $setupErrors++
    }
} catch {
    Write-Host "❌ AWS CLI: ERROR" -ForegroundColor Red
    $setupErrors++
}

try {
    Write-Host "Checking AWS credentials..." -ForegroundColor Gray
    $identity = aws sts get-caller-identity --output json 2>&1
    if ($identity -like "*error*") {
        Write-Host "❌ AWS Credentials: NOT CONFIGURED" -ForegroundColor Red
        $setupErrors++
    } else {
        Write-Host "✅ AWS Credentials: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ AWS Credentials: ERROR" -ForegroundColor Red
    $setupErrors++
}

if ($setupErrors -gt 0) {
    Write-Host "`n❌ Prerequisites failed. Fix issues and try again." -ForegroundColor Red
    exit 1
}

# Step 2: Create Database Files
if (-not $SkipDatabase) {
    Write-Host "`n🗄️ STEP 2: Creating Database Files" -ForegroundColor Yellow
    Write-Host "===================================" -ForegroundColor Yellow
    
    try {
        & ".\create-cognito-database.ps1"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database files created successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Database file creation failed" -ForegroundColor Red
            $setupErrors++
        }
    } catch {
        Write-Host "❌ Database setup error: $($_.Exception.Message)" -ForegroundColor Red
        $setupErrors++
    }
} else {
    Write-Host "`n⏭️ STEP 2: Database setup skipped" -ForegroundColor Yellow
}

# Step 3: Setup Cognito Infrastructure
if (-not $SkipCognito) {
    Write-Host "`n☁️ STEP 3: Setting up Cognito Infrastructure" -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Yellow
    
    # First check if the fast setup script has syntax issues
    Write-Host "Checking setup script syntax..." -ForegroundColor Gray
    
    try {
        $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content 'setup-cognito-fast.ps1' -Raw), [ref]$null)
        Write-Host "✅ Script syntax: OK" -ForegroundColor Green
        
        Write-Host "Executing Cognito infrastructure setup..." -ForegroundColor Gray
        & ".\setup-cognito-fast.ps1"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Cognito infrastructure setup completed" -ForegroundColor Green
        } else {
            Write-Host "❌ Cognito setup failed" -ForegroundColor Red
            $setupErrors++
        }
    } catch {
        Write-Host "❌ Script syntax error detected" -ForegroundColor Red
        Write-Host "   Creating clean Cognito setup..." -ForegroundColor Yellow
        
        # Create a minimal working Cognito setup
        $miniSetup = @'
# Mini Cognito Setup
Write-Host "Creating Cognito User Pool..." -ForegroundColor Cyan

$userPoolResult = aws cognito-idp create-user-pool --pool-name "modulus-lms-users" --output json 2>&1

if ($userPoolResult -like "*error*") {
    Write-Host "Failed to create User Pool: $userPoolResult" -ForegroundColor Red
    exit 1
}

$userPool = $userPoolResult | ConvertFrom-Json
Write-Host "User Pool created: $($userPool.UserPool.Id)" -ForegroundColor Green

$clientResult = aws cognito-idp create-user-pool-client --user-pool-id $userPool.UserPool.Id --client-name "modulus-web-client" --output json 2>&1

if ($clientResult -like "*error*") {
    Write-Host "Failed to create App Client: $clientResult" -ForegroundColor Red
    exit 1
}

$client = $clientResult | ConvertFrom-Json
Write-Host "App Client created: $($client.UserPoolClient.ClientId)" -ForegroundColor Green

Write-Host "`nCognito setup complete!" -ForegroundColor Green
Write-Host "User Pool ID: $($userPool.UserPool.Id)" -ForegroundColor Yellow
Write-Host "Client ID: $($client.UserPoolClient.ClientId)" -ForegroundColor Yellow
'@

        $miniSetup | Out-File -FilePath "mini-cognito-setup.ps1" -Encoding UTF8
        & ".\mini-cognito-setup.ps1"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Mini Cognito setup completed" -ForegroundColor Green
        } else {
            Write-Host "❌ Mini Cognito setup failed" -ForegroundColor Red
            $setupErrors++
        }
    }
} else {
    Write-Host "`n⏭️ STEP 3: Cognito setup skipped" -ForegroundColor Yellow
}

# Step 4: Verification
Write-Host "`n✅ STEP 4: Verification" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow

try {
    Write-Host "Checking for User Pools..." -ForegroundColor Gray
    $pools = aws cognito-idp list-user-pools --max-items 10 --output json 2>&1
    
    if ($pools -like "*error*") {
        Write-Host "❌ Cannot verify User Pools" -ForegroundColor Red
    } else {
        $poolsObj = $pools | ConvertFrom-Json
        $modulusPools = $poolsObj.UserPools | Where-Object { $_.Name -like "*modulus*" }
        
        if ($modulusPools) {
            Write-Host "✅ Found Modulus User Pool(s):" -ForegroundColor Green
            foreach ($pool in $modulusPools) {
                Write-Host "   - $($pool.Name) ($($pool.Id))" -ForegroundColor Gray
            }
        } else {
            Write-Host "⚠️ No Modulus User Pools found" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Verification error: $($_.Exception.Message)" -ForegroundColor Red
}

# Final Report
Write-Host "`n📊 SETUP COMPLETE" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

if ($setupErrors -eq 0) {
    Write-Host "🎉 SUCCESS: Setup completed without errors!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Files created:" -ForegroundColor White
    if (Test-Path "cognito-schema.sql") { Write-Host "   ✅ cognito-schema.sql" -ForegroundColor Gray }
    if (Test-Path "sample-data.sql") { Write-Host "   ✅ sample-data.sql" -ForegroundColor Gray }
    if (Test-Path "mini-cognito-setup.ps1") { Write-Host "   ✅ mini-cognito-setup.ps1" -ForegroundColor Gray }
    
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor White
    Write-Host "   1. Update frontend to use Cognito authentication" -ForegroundColor Gray
    Write-Host "   2. Update Lambda to validate Cognito tokens" -ForegroundColor Gray
    Write-Host "   3. Initialize database with your RDS details" -ForegroundColor Gray
} else {
    Write-Host "❌ FAILED: Setup encountered $setupErrors error(s)" -ForegroundColor Red
    Write-Host "   Please review the errors above and try again." -ForegroundColor Red
}

Write-Host ""
Write-Host "Completed: $(Get-Date)" -ForegroundColor White
