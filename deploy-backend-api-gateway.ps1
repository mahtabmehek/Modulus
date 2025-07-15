#!/usr/bin/env pwsh
# Backend Deployment Script for Modulus LMS
# This script deploys the backend to AWS Lambda through API Gateway

Write-Host "🚀 Starting Modulus Backend Deployment" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Configuration
$FUNCTION_NAME = "modulus-backend"
$REGION = "eu-west-2"
$API_ID = "9yr579qaz1"

# Step 1: Navigate to backend directory
Write-Host "`n📁 Preparing backend code..." -ForegroundColor Yellow
Set-Location backend

# Step 2: Create deployment package
Write-Host "`n📦 Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "lambda-deploy") {
    Remove-Item -Recurse -Force lambda-deploy
}
New-Item -ItemType Directory -Name lambda-deploy

# Copy necessary files
Copy-Item lambda.js lambda-deploy/
Copy-Item lambda-server.js lambda-deploy/
Copy-Item rds-data-client.js lambda-deploy/
Copy-Item package.json lambda-deploy/
Copy-Item -Recurse routes lambda-deploy/
Copy-Item -Recurse middleware lambda-deploy/

# Step 3: Install production dependencies
Write-Host "`n📋 Installing production dependencies..." -ForegroundColor Yellow
Set-Location lambda-deploy
npm install --production --no-optional

# Step 4: Create deployment ZIP
Write-Host "`n🗜️ Creating deployment ZIP..." -ForegroundColor Yellow
Compress-Archive -Path * -DestinationPath ../modulus-backend-deployment.zip -Force

# Step 5: Deploy to Lambda
Write-Host "`n☁️ Deploying to AWS Lambda..." -ForegroundColor Yellow
Set-Location ..
aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://modulus-backend-deployment.zip --region $REGION

# Step 6: Update API Gateway deployment
Write-Host "`n🌐 Updating API Gateway deployment..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --description "Backend update $timestamp" --region $REGION

# Step 7: Test deployment
Write-Host "`n🧪 Testing deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $response = Invoke-RestMethod -Uri "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/api/status" -Method GET
    Write-Host "✅ Backend Status: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Cleanup
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Yellow
Remove-Item -Recurse -Force lambda-deploy -ErrorAction SilentlyContinue
Remove-Item modulus-backend-deployment.zip -ErrorAction SilentlyContinue

# Step 8: Test authentication
Write-Host "`n🔐 Testing authentication..." -ForegroundColor Yellow
try {
    $testCreds = @{
        email = "staffuser@test.com"
        password = "test123"
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/api/auth/login" -Method POST -ContentType "application/json" -Body $testCreds
    Write-Host "✅ Authentication test successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This might be expected if using different credentials" -ForegroundColor Yellow
}

Write-Host "`n🎉 Backend deployment complete!" -ForegroundColor Green
Write-Host "Backend API: https://$API_ID.execute-api.$REGION.amazonaws.com/prod/api" -ForegroundColor White

Set-Location ..
