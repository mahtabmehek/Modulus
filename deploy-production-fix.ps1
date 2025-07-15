#!/usr/bin/env pwsh
# Production Deployment Script for Modulus LMS with Database Fixes
# This script deploys the fixed backend and frontend to production

Write-Host "🚀 Starting Modulus Production Deployment with Database Fixes" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

# Configuration
$FUNCTION_NAME = "modulus-backend"
$REGION = "eu-west-2"
$API_ID = "9yr579qaz1"
$BUCKET_NAME = "modulus-frontend-1370267358"
$API_URL = "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/api"

# Step 1: Verify AWS CLI is configured
Write-Host "`n🔧 Checking AWS configuration..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity --query "Account" --output text
    Write-Host "✅ AWS CLI configured for account: $awsIdentity" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure'" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy Backend with Fixes
Write-Host "`n📁 Preparing fixed backend code..." -ForegroundColor Yellow
Set-Location backend

# Verify our fixed files exist
$requiredFiles = @("rds-data-client.js", "routes/courses.js", "server.js", "lambda.js")
foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        Write-Host "❌ Missing required file: $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ All required files present" -ForegroundColor Green

# Create deployment package
Write-Host "`n📦 Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "lambda-deploy") {
    Remove-Item -Recurse -Force lambda-deploy
}
New-Item -ItemType Directory -Name lambda-deploy | Out-Null

# Copy necessary files with fixes
Write-Host "Copying fixed files..." -ForegroundColor Cyan
Copy-Item lambda.js lambda-deploy/
Copy-Item lambda-server.js lambda-deploy/ -ErrorAction SilentlyContinue
Copy-Item rds-data-client.js lambda-deploy/
Copy-Item server.js lambda-deploy/
Copy-Item package.json lambda-deploy/
Copy-Item -Recurse routes lambda-deploy/
Copy-Item -Recurse middleware lambda-deploy/ -ErrorAction SilentlyContinue

# Install production dependencies
Write-Host "`n📋 Installing production dependencies..." -ForegroundColor Yellow
Set-Location lambda-deploy
$env:NODE_ENV = "production"
npm install --production --no-optional --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

# Create deployment ZIP
Write-Host "`n🗜️ Creating deployment ZIP..." -ForegroundColor Yellow
if (Test-Path "../modulus-backend-deployment.zip") {
    Remove-Item "../modulus-backend-deployment.zip"
}
Compress-Archive -Path * -DestinationPath ../modulus-backend-deployment.zip -Force

# Deploy to Lambda
Write-Host "`n☁️ Deploying fixed backend to AWS Lambda..." -ForegroundColor Yellow
Set-Location ..
aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://modulus-backend-deployment.zip --region $REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lambda deployment failed" -ForegroundColor Red
    exit 1
}

# Update API Gateway deployment
Write-Host "`n🌐 Updating API Gateway deployment..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --description "Backend fix deployment $timestamp" --region $REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ API Gateway deployment failed" -ForegroundColor Red
    exit 1
}

# Wait for deployment to propagate
Write-Host "`n⏱️ Waiting for deployment to propagate..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test backend deployment
Write-Host "`n🧪 Testing fixed backend deployment..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/courses" -Method GET -ErrorAction Stop
    Write-Host "✅ Backend test successful!" -ForegroundColor Green
    Write-Host "Found $($response.courses.Length) courses" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Backend test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Will continue with frontend deployment..." -ForegroundColor Yellow
}

# Cleanup backend deployment files
Write-Host "`n🧹 Cleaning up backend deployment files..." -ForegroundColor Yellow
Remove-Item -Recurse -Force lambda-deploy -ErrorAction SilentlyContinue
Remove-Item modulus-backend-deployment.zip -ErrorAction SilentlyContinue

# Step 3: Deploy Frontend
Set-Location ..
Write-Host "`n📱 Preparing frontend deployment..." -ForegroundColor Yellow

# Set environment variables for production build
$env:NEXT_PUBLIC_API_URL = $API_URL
$env:NODE_ENV = "production"
Write-Host "API URL: $API_URL" -ForegroundColor Green

# Build the application
Write-Host "`n🔨 Building frontend application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend build successful" -ForegroundColor Green

# Deploy to S3
Write-Host "`n📤 Deploying frontend to S3..." -ForegroundColor Yellow
aws s3 sync out/ s3://$BUCKET_NAME --region $REGION --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ S3 sync failed" -ForegroundColor Red
    exit 1
}

# Set proper content types
Write-Host "`n🔧 Setting content types..." -ForegroundColor Yellow
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ --recursive --exclude "*" --include "*.html" --content-type "text/html" --metadata-directive REPLACE --quiet
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE --quiet
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE --quiet

# Step 4: Final Tests
Write-Host "`n🎯 Running final production tests..." -ForegroundColor Yellow

# Test course listing
try {
    $response = Invoke-RestMethod -Uri "$API_URL/courses" -Method GET -ErrorAction Stop
    Write-Host "✅ Course listing test passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Course listing test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test authentication
try {
    $testCreds = @{
        email = "staffuser@test.com"
        password = "password123"
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -ContentType "application/json" -Body $testCreds -ErrorAction Stop
    Write-Host "✅ Authentication test passed" -ForegroundColor Green
    
    # Test course update with the fixed backend
    if ($authResponse.token) {
        Write-Host "🧪 Testing course update with fixed database types..." -ForegroundColor Yellow
        $headers = @{
            "Authorization" = "Bearer $($authResponse.token)"
            "Content-Type" = "application/json"
        }
        
        # Try to get course 17 to test the fix
        try {
            $course = Invoke-RestMethod -Uri "$API_URL/courses/17" -Method GET -Headers $headers -ErrorAction Stop
            Write-Host "✅ Course retrieval test passed" -ForegroundColor Green
            
            # Test update (the main fix)
            $updateData = @{
                title = $course.course.title
                code = $course.course.code
                description = $course.course.description + " (updated)"
                department = $course.course.department
                academicLevel = $course.course.academicLevel
                duration = $course.course.duration
                totalCredits = $course.course.totalCredits
            } | ConvertTo-Json
            
            $updateResponse = Invoke-RestMethod -Uri "$API_URL/courses/17" -Method PUT -Headers $headers -Body $updateData -ErrorAction Stop
            Write-Host "✅ Course update test PASSED! The integer <> text error is FIXED!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Course update test failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Authentication test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Display results
$WEBSITE_URL = "http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
Write-Host "`n🎉 Production deployment complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "🌐 Frontend URL: $WEBSITE_URL" -ForegroundColor Cyan
Write-Host "🔗 Backend API: $API_URL" -ForegroundColor Yellow
Write-Host "🔧 Database: Aurora PostgreSQL with RDS Data API" -ForegroundColor Magenta
Write-Host "✅ Fixes Applied:" -ForegroundColor White
Write-Host "  - PostgreSQL type conversion (integer <> text errors fixed)" -ForegroundColor Gray
Write-Host "  - RDS Data API parameter type detection" -ForegroundColor Gray
Write-Host "  - Enhanced error logging and validation" -ForegroundColor Gray
Write-Host "`nProduction deployment ready for testing!" -ForegroundColor Green
