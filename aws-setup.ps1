# AWS CLI Setup Script for Modulus LMS
# This script helps set up AWS CLI for better integration

Write-Host "🚀 Setting up AWS CLI for Modulus LMS Integration" -ForegroundColor Cyan

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>$null
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check current AWS configuration
Write-Host "`n🔍 Checking AWS Configuration..." -ForegroundColor Cyan
try {
    $identity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
    Write-Host "✅ AWS configured for user: $($identity.Arn)" -ForegroundColor Green
    Write-Host "   Account: $($identity.Account)" -ForegroundColor White
    Write-Host "   Region: $(aws configure get region)" -ForegroundColor White
} catch {
    Write-Host "❌ AWS not configured. Run 'aws configure' first" -ForegroundColor Red
    Write-Host "   You'll need:" -ForegroundColor Yellow
    Write-Host "   - Access Key ID" -ForegroundColor Yellow
    Write-Host "   - Secret Access Key" -ForegroundColor Yellow
    Write-Host "   - Default region (eu-west-2)" -ForegroundColor Yellow
    exit 1
}

# Test CloudWatch access
Write-Host "`n🔍 Testing CloudWatch access..." -ForegroundColor Cyan
try {
    aws logs describe-log-groups --limit 1 --output json > $null 2>&1
    Write-Host "✅ CloudWatch logs access confirmed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  CloudWatch access might be limited" -ForegroundColor Yellow
}

# Test Lambda access
Write-Host "`n🔍 Testing Lambda access..." -ForegroundColor Cyan
try {
    aws lambda list-functions --max-items 1 --output json > $null 2>&1
    Write-Host "✅ Lambda access confirmed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Lambda access might be limited" -ForegroundColor Yellow
}

# Test API Gateway access
Write-Host "`n🔍 Testing API Gateway access..." -ForegroundColor Cyan
try {
    aws apigateway get-rest-apis --limit 1 --output json > $null 2>&1
    Write-Host "✅ API Gateway access confirmed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  API Gateway access might be limited" -ForegroundColor Yellow
}

Write-Host "`n✅ AWS CLI setup verification complete!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: ./aws-log-viewer.ps1 to view logs" -ForegroundColor White
Write-Host "   2. Run: ./aws-monitor.ps1 to check service status" -ForegroundColor White
Write-Host "   3. Run: ./aws-cognito-setup.ps1 to begin Cognito migration" -ForegroundColor White
