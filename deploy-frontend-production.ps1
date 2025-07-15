#!/usr/bin/env pwsh
# Frontend Deployment Script for Modulus LMS
# This script builds and deploys the frontend to S3

Write-Host "🚀 Starting Modulus LMS Frontend Deployment" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Configuration
$BUCKET_NAME = "modulus-frontend-1370267358"
$REGION = "eu-west-2"
$API_URL = "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"

# Step 1: Verify AWS CLI is configured
Write-Host "`n🔧 Checking AWS configuration..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity --query "Account" --output text
    Write-Host "✅ AWS CLI configured for account: $awsIdentity" -ForegroundColor Green
}
catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure'" -ForegroundColor Red
    exit 1
}

# Step 2: Verify S3 bucket exists
Write-Host "`n🪣 Checking S3 bucket..." -ForegroundColor Yellow
try {
    aws s3api head-bucket --bucket $BUCKET_NAME --region $REGION 2>$null
    Write-Host "✅ S3 bucket exists: $BUCKET_NAME" -ForegroundColor Green
}
catch {
    Write-Host "❌ S3 bucket not found: $BUCKET_NAME" -ForegroundColor Red
    exit 1
}

# Step 3: Set environment variables for build
Write-Host "`n🌍 Setting environment variables..." -ForegroundColor Yellow
$env:NEXT_PUBLIC_API_URL = $API_URL
$env:NODE_ENV = "production"
Write-Host "✅ NEXT_PUBLIC_API_URL = $API_URL" -ForegroundColor Green
Write-Host "✅ NODE_ENV = production" -ForegroundColor Green

# Step 4: Install dependencies (if needed)
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Dependencies ready" -ForegroundColor Green

# Step 5: Build the application
Write-Host "`n🔨 Building the application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Check if build output exists
if (!(Test-Path "out")) {
    Write-Host "❌ Build output directory 'out' not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Step 6: Deploy to S3
Write-Host "`n☁️  Deploying to S3..." -ForegroundColor Yellow
Write-Host "Bucket: $BUCKET_NAME" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan

# Sync files to S3
aws s3 sync out/ s3://$BUCKET_NAME --region $REGION --delete
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ S3 sync failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Files uploaded to S3" -ForegroundColor Green

# Step 7: Set proper content types
Write-Host "`n📄 Setting content types..." -ForegroundColor Yellow

# Set content type for HTML files
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ --recursive --exclude "*" --include "*.html" --content-type "text/html" --metadata-directive REPLACE

# Set content type for CSS files
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE

# Set content type for JS files
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE

Write-Host "✅ Content types set" -ForegroundColor Green

# Step 8: Get website URL
Write-Host "`n🌐 Getting website URL..." -ForegroundColor Yellow
$WEBSITE_URL = "http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🎉 Your Modulus LMS is now live at:" -ForegroundColor Green
Write-Host "   $WEBSITE_URL" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "🔗 API Backend: $API_URL" -ForegroundColor Yellow
Write-Host "📊 Test with admin credentials:" -ForegroundColor Yellow
Write-Host "   Email: admin@test.com" -ForegroundColor White
Write-Host "   Password: Mahtabmehek@1337" -ForegroundColor White

# Step 9: Quick health check
Write-Host "`n🏥 Running quick health check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API is healthy" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Backend API returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠️  Could not reach backend API" -ForegroundColor Yellow
}

Write-Host "`n🚀 Deployment Summary:" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host "Frontend URL: $WEBSITE_URL" -ForegroundColor White
Write-Host "Backend API:  $API_URL" -ForegroundColor White
Write-Host "S3 Bucket:    $BUCKET_NAME" -ForegroundColor White
Write-Host "Region:       $REGION" -ForegroundColor White
