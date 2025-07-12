#!/usr/bin/env pwsh

Write-Host "Testing Modulus LMS Deployment" -ForegroundColor Green

# Test AWS CLI
try {
    $awsVersion = aws --version 2>&1
    Write-Host "AWS CLI: $awsVersion" -ForegroundColor Green
}
catch {
    Write-Host "AWS CLI not found" -ForegroundColor Red
    exit 1
}

# Check for Lambda function
Write-Host "Checking Lambda function..." -ForegroundColor Cyan
try {
    $lambdaCheck = aws lambda get-function --function-name modulus-backend --region us-east-1 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Lambda function exists" -ForegroundColor Green
    } else {
        Write-Host "Lambda function not found" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error checking Lambda: $_" -ForegroundColor Red
}

# Check for API Gateway
Write-Host "Checking API Gateway..." -ForegroundColor Cyan
try {
    $apiCheck = aws apigateway get-rest-apis --region us-east-1 --query "items[?name=='modulus-api'].id" --output text 2>&1
    if ($apiCheck -and $apiCheck -ne "None" -and $apiCheck.Trim() -ne "") {
        $apiUrl = "https://$($apiCheck.Trim()).execute-api.us-east-1.amazonaws.com/prod"
        Write-Host "API Gateway found: $apiUrl" -ForegroundColor Green
        
        # Test health endpoint
        Write-Host "Testing health endpoint..." -ForegroundColor Cyan
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/api/health" -Method Get -TimeoutSec 10
            Write-Host "Health check passed: $($response.status)" -ForegroundColor Green
        }
        catch {
            Write-Host "Health check failed: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "API Gateway not found" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error checking API Gateway: $_" -ForegroundColor Red
}

# Check S3 buckets
Write-Host "Checking S3 buckets..." -ForegroundColor Cyan
try {
    $buckets = aws s3 ls | Select-String "modulus-frontend"
    if ($buckets) {
        Write-Host "Frontend buckets found:" -ForegroundColor Green
        $buckets | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    } else {
        Write-Host "No frontend buckets found" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error checking S3: $_" -ForegroundColor Red
}

Write-Host "Test completed!" -ForegroundColor Green
