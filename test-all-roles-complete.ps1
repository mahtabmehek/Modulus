#!/usr/bin/env pwsh

Write-Host "=== Modulus LMS Registration & Login Test ===" -ForegroundColor Green
Write-Host "Testing all roles: student, instructor, staff, admin" -ForegroundColor Yellow
Write-Host ""

$apiUrl = "https://9yr579qaz1.execute-api.us-east-1.amazonaws.com/prod"
$lambdaFunction = "modulus-backend"

# Test data for each role
$testUsers = @(
    @{
        name = "Alice Student"
        email = "alice.student@test.com"
        password = "password123"
        role = "student"
        accessCode = "student2025"
    },
    @{
        name = "Bob Instructor"
        email = "bob.instructor@test.com"
        password = "password123"
        role = "instructor"
        accessCode = "instructor2025"
    },
    @{
        name = "Carol Staff"
        email = "carol.staff@test.com"
        password = "password123"
        role = "staff"
        accessCode = "staff2025"
    },
    @{
        name = "David Admin"
        email = "david.admin@test.com"
        password = "password123"
        role = "admin"
        accessCode = "mahtabmehek1337"
    }
)

foreach ($user in $testUsers) {
    Write-Host "Testing registration for $($user.role): $($user.name)" -ForegroundColor Cyan
    
    # Create registration payload
    $regPayload = @{
        httpMethod = "POST"
        path = "/api/auth/register"
        headers = @{
            "Content-Type" = "application/json"
        }
        body = ($user | ConvertTo-Json -Compress)
    } | ConvertTo-Json -Depth 3
    
    # Save payload to temp file
    $tempFile = "temp-reg-$($user.role).json"
    $regPayload | Out-File -FilePath $tempFile -Encoding utf8
    
    # Test registration
    try {
        $regResult = aws lambda invoke --function-name $lambdaFunction --payload file://$tempFile --cli-binary-format raw-in-base64-out "result-reg-$($user.role).json" 2>&1
        $regResponse = Get-Content "result-reg-$($user.role).json" | ConvertFrom-Json
        
        if ($regResponse.statusCode -eq 201) {
            $body = $regResponse.body | ConvertFrom-Json
            Write-Host "  ✓ Registration successful - User ID: $($body.user.id)" -ForegroundColor Green
            
            # Test login
            Write-Host "  Testing login for $($user.role): $($user.email)" -ForegroundColor Cyan
            
            $loginPayload = @{
                httpMethod = "POST"
                path = "/api/auth/login"
                headers = @{
                    "Content-Type" = "application/json"
                }
                body = @{
                    email = $user.email
                    password = $user.password
                } | ConvertTo-Json -Compress
            } | ConvertTo-Json -Depth 3
            
            $loginFile = "temp-login-$($user.role).json"
            $loginPayload | Out-File -FilePath $loginFile -Encoding utf8
            
            $loginResult = aws lambda invoke --function-name $lambdaFunction --payload file://$loginFile --cli-binary-format raw-in-base64-out "result-login-$($user.role).json" 2>&1
            $loginResponse = Get-Content "result-login-$($user.role).json" | ConvertFrom-Json
            
            if ($loginResponse.statusCode -eq 200) {
                $loginBody = $loginResponse.body | ConvertFrom-Json
                Write-Host "  ✓ Login successful - Token received" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Login failed - Status: $($loginResponse.statusCode)" -ForegroundColor Red
            }
        } else {
            Write-Host "  ✗ Registration failed - Status: $($regResponse.statusCode)" -ForegroundColor Red
            if ($regResponse.body) {
                $errorBody = $regResponse.body | ConvertFrom-Json
                Write-Host "    Error: $($errorBody.message)" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Cleanup temp files
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    Remove-Item $loginFile -ErrorAction SilentlyContinue
    
    Write-Host ""
}

Write-Host "=== Test Complete ===" -ForegroundColor Green
Write-Host "Frontend URL: https://d22z8cqbxlr42z.cloudfront.net/" -ForegroundColor Yellow
Write-Host "API Gateway URL: $apiUrl" -ForegroundColor Yellow
