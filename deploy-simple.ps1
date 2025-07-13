# Frontend Deployment Script for Modulus LMS
# This script builds and deploys the frontend to S3

Write-Host "Starting Modulus LMS Frontend Deployment" -ForegroundColor Green

# Configuration
$BUCKET_NAME = "modulus-frontend-1370267358"
$REGION = "eu-west-2"
$API_URL = "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"

# Step 1: Set environment variables for build
Write-Host "Setting environment variables..." -ForegroundColor Yellow
$env:NEXT_PUBLIC_API_URL = $API_URL
$env:NODE_ENV = "production"
Write-Host "API URL: $API_URL" -ForegroundColor Green

# Step 2: Build the application
Write-Host "Building the application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Build successful" -ForegroundColor Green

# Step 3: Deploy to S3
Write-Host "Deploying to S3..." -ForegroundColor Yellow
aws s3 sync out/ s3://$BUCKET_NAME --region $REGION --delete
if ($LASTEXITCODE -ne 0) {
    Write-Host "S3 sync failed" -ForegroundColor Red
    exit 1
}
Write-Host "Deployment successful" -ForegroundColor Green

# Step 4: Show results
$WEBSITE_URL = "http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Website URL: $WEBSITE_URL" -ForegroundColor Cyan
Write-Host "Backend API: $API_URL" -ForegroundColor Yellow
