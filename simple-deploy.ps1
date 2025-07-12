# Simple PowerShell Deployment Script for Modulus LMS
param(
    [ValidateSet("status", "backend", "frontend", "full", "test")]
    [string]$Action = "status"
)

# Configuration
$AWS_REGION = "eu-west-2"
$LAMBDA_FUNCTION = "modulus-backend"
$S3_BUCKET = "modulus-frontend-1370267358"
$API_GATEWAY_NAME = "modulus-api"

Write-Host "🚀 Modulus LMS - Simple Deployment" -ForegroundColor Blue
Write-Host "Action: $Action" -ForegroundColor Yellow
Write-Host ""

# Check AWS CLI
try {
    $awsIdentity = aws sts get-caller-identity | ConvertFrom-Json
    Write-Host "✅ AWS CLI configured - Account: $($awsIdentity.Account)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not configured" -ForegroundColor Red
    exit 1
}

switch ($Action) {
    "status" {
        Write-Host "📊 Checking deployment status..." -ForegroundColor Yellow
        
        # Check Lambda
        try {
            $lambdaStatus = aws lambda get-function --function-name $LAMBDA_FUNCTION --region $AWS_REGION --query 'Configuration.State' --output text
            Write-Host "Lambda Function: $LAMBDA_FUNCTION - Status: $lambdaStatus" -ForegroundColor Green
        } catch {
            Write-Host "Lambda Function: ERROR" -ForegroundColor Red
        }
        
        # Check S3
        try {
            aws s3api head-bucket --bucket $S3_BUCKET --region $AWS_REGION | Out-Null
            Write-Host "S3 Bucket: $S3_BUCKET - Status: EXISTS" -ForegroundColor Green
        } catch {
            Write-Host "S3 Bucket: NOT_FOUND" -ForegroundColor Red
        }
        
        # Check API Gateway
        try {
            $apiId = aws apigateway get-rest-apis --region $AWS_REGION --query "items[?name=='$API_GATEWAY_NAME'].id" --output text
            if ($apiId) {
                Write-Host "API Gateway: $API_GATEWAY_NAME - ID: $apiId" -ForegroundColor Green
                $apiUrl = "https://$apiId.execute-api.$AWS_REGION.amazonaws.com/prod"
                Write-Host "API URL: $apiUrl" -ForegroundColor Cyan
            } else {
                Write-Host "API Gateway: NOT_FOUND" -ForegroundColor Red
            }
        } catch {
            Write-Host "API Gateway: ERROR" -ForegroundColor Red
        }
    }
    
    "backend" {
        Write-Host "🔨 Deploying backend..." -ForegroundColor Yellow
        
        if (-not (Test-Path "backend")) {
            Write-Host "❌ Backend directory not found" -ForegroundColor Red
            exit 1
        }
        
        Push-Location backend
        try {
            Write-Host "Installing dependencies..." -ForegroundColor Blue
            npm install
            
            Write-Host "Creating deployment package..." -ForegroundColor Blue
            if (Test-Path "modulus-backend.zip") {
                Remove-Item "modulus-backend.zip"
            }
            
            # Create zip package
            $files = Get-ChildItem -Recurse | Where-Object { 
                $_.FullName -notlike "*node_modules*" -and 
                $_.FullName -notlike "*.zip" -and 
                $_.FullName -notlike "*test*" 
            }
            Compress-Archive -Path $files -DestinationPath "modulus-backend.zip" -Force
            
            Write-Host "Deploying to Lambda..." -ForegroundColor Blue
            aws lambda update-function-code --function-name $LAMBDA_FUNCTION --zip-file fileb://modulus-backend.zip --region $AWS_REGION
            
            Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Backend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    }
    
    "frontend" {
        Write-Host "🎨 Deploying frontend..." -ForegroundColor Yellow
        
        if (-not (Test-Path "frontend")) {
            Write-Host "❌ Frontend directory not found" -ForegroundColor Red
            exit 1
        }
        
        Push-Location frontend
        try {
            Write-Host "Installing dependencies..." -ForegroundColor Blue
            npm install
            
            Write-Host "Building React application..." -ForegroundColor Blue
            npm run build
            
            Write-Host "Deploying to S3..." -ForegroundColor Blue
            aws s3 sync dist/ s3://$S3_BUCKET/ --region $AWS_REGION --delete
            
            # Configure S3 website hosting
            aws s3 website s3://$S3_BUCKET --index-document index.html --error-document index.html --region $AWS_REGION
            
            Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
            Write-Host "🌐 Website URL: http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com/" -ForegroundColor Cyan
        } catch {
            Write-Host "❌ Frontend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    }
    
    "full" {
        Write-Host "🚀 Full deployment starting..." -ForegroundColor Yellow
        
        # Deploy backend
        & $PSCommandPath -Action backend
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Backend deployment failed, stopping" -ForegroundColor Red
            exit 1
        }
        
        # Deploy frontend
        & $PSCommandPath -Action frontend
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Frontend deployment failed" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "🎉 Full deployment completed!" -ForegroundColor Green
    }
    
    "test" {
        Write-Host "🧪 Running tests..." -ForegroundColor Yellow
        
        # Get API URL
        $apiId = aws apigateway get-rest-apis --region $AWS_REGION --query "items[?name=='$API_GATEWAY_NAME'].id" --output text
        if (-not $apiId) {
            Write-Host "❌ API Gateway not found" -ForegroundColor Red
            exit 1
        }
        
        $apiUrl = "https://$apiId.execute-api.$AWS_REGION.amazonaws.com/prod"
        Write-Host "Testing API at: $apiUrl" -ForegroundColor Cyan
        
        # Test health endpoint
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/api/health" -Method GET -TimeoutSec 10
            Write-Host "✅ Health check passed" -ForegroundColor Green
        } catch {
            Write-Host "❌ Health check failed" -ForegroundColor Red
        }
        
        # Test registration endpoint
        $testUser = @{
            name = "Test User"
            email = "test@modulus.test" 
            password = "TestPassword123!"
            role = "student"
            accessCode = "student2025"
        }
        
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/api/auth/register" -Method POST -ContentType "application/json" -Body ($testUser | ConvertTo-Json)
            Write-Host "✅ Registration test passed" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Registration test: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Deployment action '$Action' completed!" -ForegroundColor Blue
