# Cognito Integration Test Script
Write-Host "🧪 TESTING COGNITO INTEGRATION" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

$testResults = @()

# Test 1: Check if Cognito User Pool exists
Write-Host "`n[TEST 1] Verifying Cognito User Pool..." -ForegroundColor Yellow
try {
    $userPool = aws cognito-idp describe-user-pool --user-pool-id eu-west-2_4vo3VDZa5 --output json 2>&1
    if ($userPool -like "*error*") {
        Write-Host "❌ User Pool test failed" -ForegroundColor Red
        $testResults += "User Pool: FAILED"
    } else {
        Write-Host "✅ User Pool exists and is accessible" -ForegroundColor Green
        $testResults += "User Pool: PASSED"
    }
} catch {
    Write-Host "❌ User Pool test error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "User Pool: ERROR"
}

# Test 2: Check App Client
Write-Host "`n[TEST 2] Verifying App Client..." -ForegroundColor Yellow
try {
    $appClient = aws cognito-idp describe-user-pool-client --user-pool-id eu-west-2_4vo3VDZa5 --client-id 4jfe4rmrv0mec1e2hrvmo32a2h --output json 2>&1
    if ($appClient -like "*error*") {
        Write-Host "❌ App Client test failed" -ForegroundColor Red
        $testResults += "App Client: FAILED"
    } else {
        Write-Host "✅ App Client exists and is accessible" -ForegroundColor Green
        $testResults += "App Client: PASSED"
    }
} catch {
    Write-Host "❌ App Client test error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "App Client: ERROR"
}

# Test 3: Check if development server is running
Write-Host "`n[TEST 3] Checking development server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Development server is running on http://localhost:3000" -ForegroundColor Green
        $testResults += "Dev Server: PASSED"
    } else {
        Write-Host "❌ Development server not responding correctly" -ForegroundColor Red
        $testResults += "Dev Server: FAILED"
    }
} catch {
    Write-Host "❌ Cannot connect to development server" -ForegroundColor Red
    $testResults += "Dev Server: ERROR"
}

# Test 4: Check required files exist
Write-Host "`n[TEST 4] Checking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "src/config/cognito.ts",
    "src/components/providers/auth-provider.tsx",
    "src/components/auth/cognito-auth.tsx",
    "cognito-config.txt",
    "cognito-schema.sql"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    $testResults += "Required Files: PASSED"
} else {
    $testResults += "Required Files: FAILED ($($missingFiles.Count) missing)"
}

# Test 5: Check npm packages
Write-Host "`n[TEST 5] Checking npm packages..." -ForegroundColor Yellow
try {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $awsAmplifyUI = $packageJson.dependencies.'@aws-amplify/ui-react'
    $awsAmplify = $packageJson.dependencies.'aws-amplify'
    
    if ($awsAmplifyUI -and $awsAmplify) {
        Write-Host "✅ AWS Amplify packages installed" -ForegroundColor Green
        Write-Host "   @aws-amplify/ui-react: $awsAmplifyUI" -ForegroundColor Gray
        Write-Host "   aws-amplify: $awsAmplify" -ForegroundColor Gray
        $testResults += "NPM Packages: PASSED"
    } else {
        Write-Host "❌ AWS Amplify packages missing" -ForegroundColor Red
        $testResults += "NPM Packages: FAILED"
    }
} catch {
    Write-Host "❌ Error checking packages: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "NPM Packages: ERROR"
}

# Test 6: Create a test user (optional)
Write-Host "`n[TEST 6] Testing user creation (optional)..." -ForegroundColor Yellow
$createTestUser = Read-Host "Do you want to create a test user? (y/N)"
if ($createTestUser -eq 'y' -or $createTestUser -eq 'Y') {
    $testEmail = Read-Host "Enter test email"
    $testUsername = Read-Host "Enter test username"
    $testPassword = Read-Host "Enter test password (min 8 chars, uppercase, lowercase, number)" -AsSecureString
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($testPassword))
    
    try {
        $createResult = aws cognito-idp admin-create-user --user-pool-id eu-west-2_4vo3VDZa5 --username $testUsername --user-attributes Name=email,Value=$testEmail --temporary-password $plainPassword --message-action SUPPRESS --output json 2>&1
        
        if ($createResult -like "*error*") {
            Write-Host "❌ Test user creation failed: $createResult" -ForegroundColor Red
            $testResults += "Test User: FAILED"
        } else {
            Write-Host "✅ Test user created successfully" -ForegroundColor Green
            Write-Host "   Username: $testUsername" -ForegroundColor Gray
            Write-Host "   Email: $testEmail" -ForegroundColor Gray
            Write-Host "   Note: User will need to change password on first login" -ForegroundColor Yellow
            $testResults += "Test User: PASSED"
        }
    } catch {
        Write-Host "❌ Error creating test user: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += "Test User: ERROR"
    }
} else {
    $testResults += "Test User: SKIPPED"
}

# Test Summary
Write-Host "`n📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
foreach ($result in $testResults) {
    if ($result -like "*PASSED*") {
        Write-Host "✅ $result" -ForegroundColor Green
    } elseif ($result -like "*FAILED*") {
        Write-Host "❌ $result" -ForegroundColor Red
    } elseif ($result -like "*ERROR*") {
        Write-Host "⚠️ $result" -ForegroundColor Yellow
    } else {
        Write-Host "⏭️ $result" -ForegroundColor Gray
    }
}

$passedTests = ($testResults | Where-Object { $_ -like "*PASSED*" }).Count
$totalTests = $testResults.Count - ($testResults | Where-Object { $_ -like "*SKIPPED*" }).Count

Write-Host "`n🎯 OVERALL RESULT" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "Passed: $passedTests / $totalTests tests" -ForegroundColor White

if ($passedTests -eq $totalTests) {
    Write-Host "🎉 ALL TESTS PASSED! Cognito integration is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor White
    Write-Host "   1. Open http://localhost:3000 in your browser" -ForegroundColor Gray
    Write-Host "   2. Try creating a new account" -ForegroundColor Gray
    Write-Host "   3. Check your email for verification code" -ForegroundColor Gray
    Write-Host "   4. Sign in with your new account" -ForegroundColor Gray
} else {
    Write-Host "⚠️ Some tests failed. Please review the results above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Configuration details:" -ForegroundColor White
Write-Host "   User Pool ID: eu-west-2_4vo3VDZa5" -ForegroundColor Gray
Write-Host "   Client ID: 4jfe4rmrv0mec1e2hrvmo32a2h" -ForegroundColor Gray
Write-Host "   Region: eu-west-2" -ForegroundColor Gray
Write-Host "   Frontend URL: http://localhost:3000" -ForegroundColor Gray
