# Modulus LMS Frontend - Windows PowerShell Deployment Script
# This script automates the deployment of the Modulus LMS frontend to AWS S3

param(
    [string]$BucketName = "modulus-frontend-1370267358",
    [string]$Region = "eu-west-2",
    [string]$CloudFrontDistributionId = "",
    [switch]$SkipBuild = $false
)

Write-Host "🚀 Starting Modulus LMS Frontend Deployment..." -ForegroundColor Cyan
Write-Host ""

# Configuration Display
Write-Host "📋 Deployment Configuration:" -ForegroundColor Blue
Write-Host "  S3 Bucket: $BucketName" -ForegroundColor Yellow
Write-Host "  Region: $Region" -ForegroundColor Yellow
if ($CloudFrontDistributionId) {
    Write-Host "  CloudFront: $CloudFrontDistributionId" -ForegroundColor Yellow
} else {
    Write-Host "  CloudFront: Not configured" -ForegroundColor Gray
}
Write-Host ""

# Step 1: Build the application (unless skipped)
if (-not $SkipBuild) {
    Write-Host "🔨 Step 1: Building the application..." -ForegroundColor Blue
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Step 1: Skipping build (using existing build)" -ForegroundColor Yellow
}

# Step 2: Verify build output
Write-Host "📦 Step 2: Verifying build output..." -ForegroundColor Blue
if (Test-Path "out") {
    $fileCount = (Get-ChildItem -Path "out" -Recurse -File).Count
    $totalSize = [math]::Round((Get-ChildItem -Path "out" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "✅ Build output verified: $fileCount files, $totalSize MB total" -ForegroundColor Green
} else {
    Write-Host "❌ Build output directory not found" -ForegroundColor Red
    exit 1
}

# Step 3: Check AWS CLI
Write-Host "🔧 Step 3: Checking AWS CLI..." -ForegroundColor Blue
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Step 4: Create S3 bucket (if it doesn't exist)
Write-Host "🪣 Step 4: Checking S3 bucket..." -ForegroundColor Blue
try {
    aws s3 ls "s3://$BucketName" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Bucket doesn't exist. Creating..." -ForegroundColor Yellow
        aws s3 mb "s3://$BucketName" --region $Region
        
        # Enable static website hosting
        aws s3 website "s3://$BucketName" --index-document index.html --error-document 404.html
        
        Write-Host "✅ S3 bucket created and configured" -ForegroundColor Green
    } else {
        Write-Host "✅ S3 bucket exists" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to check/create S3 bucket" -ForegroundColor Red
    exit 1
}

# Step 5: Upload files to S3
Write-Host "☁️  Step 5: Uploading files to S3..." -ForegroundColor Blue

# Upload static assets with long cache
Write-Host "  Uploading static assets..." -ForegroundColor Gray
aws s3 sync out/ "s3://$BucketName" --delete --cache-control "public, max-age=31536000" --exclude "*.html" --exclude "*.json" --exclude "*.txt"

# Upload HTML and JSON files with shorter cache
Write-Host "  Uploading HTML and configuration files..." -ForegroundColor Gray
aws s3 sync out/ "s3://$BucketName" --delete --cache-control "public, max-age=3600" --exclude "*" --include "*.html" --include "*.json" --include "*.txt"

Write-Host "✅ Files uploaded to S3" -ForegroundColor Green

# Step 6: Configure bucket policy for public access
Write-Host "🔓 Step 6: Configuring bucket policy..." -ForegroundColor Blue

$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BucketName/*"
        }
    ]
}
"@

$bucketPolicy | aws s3api put-bucket-policy --bucket $BucketName --policy file:///dev/stdin

Write-Host "✅ Bucket policy configured" -ForegroundColor Green

# Step 7: Invalidate CloudFront cache (if distribution ID provided)
if ($CloudFrontDistributionId) {
    Write-Host "🌐 Step 7: Invalidating CloudFront cache..." -ForegroundColor Blue
    aws cloudfront create-invalidation --distribution-id $CloudFrontDistributionId --paths "/*"
    Write-Host "✅ CloudFront cache invalidated" -ForegroundColor Green
} else {
    Write-Host "⚠️  CloudFront distribution ID not provided, skipping cache invalidation" -ForegroundColor Yellow
}

# Step 8: Display deployment information
Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Information:" -ForegroundColor Blue
Write-Host "  S3 Website URL: http://$BucketName.s3-website-$Region.amazonaws.com" -ForegroundColor Yellow
Write-Host "  S3 Bucket: s3://$BucketName" -ForegroundColor Yellow
Write-Host "  Total Files: $fileCount" -ForegroundColor Yellow
Write-Host "  Total Size: $totalSize MB" -ForegroundColor Yellow

if ($CloudFrontDistributionId) {
    Write-Host "  CloudFront URL: https://$CloudFrontDistributionId.cloudfront.net" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Your Modulus LMS is now live!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Blue
Write-Host "  1. Configure your custom domain (optional)" -ForegroundColor White
Write-Host "  2. Set up SSL certificate with CloudFront" -ForegroundColor White
Write-Host "  3. Update your backend API CORS settings" -ForegroundColor White
Write-Host "  4. Begin user onboarding" -ForegroundColor White
Write-Host ""

# Save deployment info to file
$deploymentInfo = @"
Modulus LMS Frontend Deployment Information
==========================================
Deployment Date: $(Get-Date)
S3 Bucket: $BucketName
Region: $Region
Website URL: http://$BucketName.s3-website-$Region.amazonaws.com
Total Files: $fileCount
Total Size: $totalSize MB
$(if ($CloudFrontDistributionId) { "CloudFront URL: https://$CloudFrontDistributionId.cloudfront.net" })

Status: Successfully Deployed ✅
"@

$deploymentInfo | Out-File -FilePath "deployment-info.txt" -Encoding UTF8
Write-Host "💾 Deployment information saved to deployment-info.txt" -ForegroundColor Cyan
