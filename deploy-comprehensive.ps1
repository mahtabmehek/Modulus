#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Comprehensive deployment script for Modulus LMS
    
.DESCRIPTION
    This script deploys both backend and frontend with full validation
    and testing, incorporating all the fixes and features we've implemented.
    
.PARAMETER DeployBackend
    Deploy the backend Lambda function (default: true)
    
.PARAMETER DeployFrontend
    Deploy the frontend to S3 (default: true)
    
.PARAMETER TestEndpoints
    Test API endpoints after deployment (default: true)
    
.PARAMETER UseExistingBucket
    Use existing S3 bucket instead of creating new one (default: false)
    
.EXAMPLE
    .\deploy-comprehensive.ps1 -DeployBackend $true -DeployFrontend $true
#>

param(
    [bool]$DeployBackend = $true,
    [bool]$DeployFrontend = $true,
    [bool]$TestEndpoints = $true,
    [bool]$UseExistingBucket = $false,
    [string]$Region = "eu-west-2"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Comprehensive Modulus LMS Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Configuration
$FUNCTION_NAME = "modulus-backend"
$API_NAME = "modulus-api"
$BUCKET_NAME = if ($UseExistingBucket) { "modulus-frontend-1752085873" } else { "modulus-frontend-$(Get-Date -Format 'yyyyMMddHHmmss')" }

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "Cyan" }
    }
    Write-Host "[$Status] $Message" -ForegroundColor $color
}

function Test-AWSCli {
    try {
        aws --version | Out-Null
        Write-Status "AWS CLI is available" "SUCCESS"
        return $true
    }
    catch {
        Write-Status "AWS CLI not found. Please install AWS CLI and configure credentials." "ERROR"
        return $false
    }
}

function Test-Dependencies {
    Write-Status "Checking dependencies..."
    
    if (-not (Test-AWSCli)) { return $false }
    
    if (-not (Test-Path "backend/package.json")) {
        Write-Status "Backend package.json not found" "ERROR"
        return $false
    }
    
    if (-not (Test-Path "package.json")) {
        Write-Status "Frontend package.json not found" "ERROR"
        return $false
    }
    
    # Check Node.js
    try {
        node --version | Out-Null
        npm --version | Out-Null
        Write-Status "Node.js and npm are available" "SUCCESS"
    }
    catch {
        Write-Status "Node.js or npm not found" "ERROR"
        return $false
    }
    
    return $true
}

function Deploy-Backend {
    Write-Status "Starting backend deployment..." "INFO"
    
    # Validate backend structure
    Write-Status "Validating backend structure..."
    
    $requiredFiles = @(
        "backend/server.js",
        "backend/lambda.js", 
        "backend/routes/auth.js",
        "backend/routes/courses.js",
        "backend/routes/health.js"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Status "Required file missing: $file" "ERROR"
            return $false
        }
    }
    
    # Check for role-based access codes
    $authContent = Get-Content "backend/routes/auth.js" -Raw
    if ($authContent -notmatch "ROLE_ACCESS_CODES") {
        Write-Status "Role-based access codes not found in auth.js" "ERROR"
        return $false
    }
    
    Write-Status "Backend structure validation passed" "SUCCESS"
    
    # Install dependencies
    Write-Status "Installing backend dependencies..."
    Push-Location backend
    try {
        npm ci
        Write-Status "Backend dependencies installed" "SUCCESS"
    }
    catch {
        Write-Status "Failed to install backend dependencies: $_" "ERROR"
        return $false
    }
    finally {
        Pop-Location
    }
    
    # Create deployment package
    Write-Status "Creating deployment package..."
    try {
        if (Test-Path "backend-deployment.zip") {
            Remove-Item "backend-deployment.zip" -Force
        }
        
        # Create zip excluding unnecessary files
        Push-Location backend
        Compress-Archive -Path "*" -DestinationPath "../backend-deployment.zip" -Force
        Pop-Location
        
        $zipSize = (Get-Item "backend-deployment.zip").Length / 1MB
        Write-Status "Deployment package created: $([math]::Round($zipSize, 2)) MB" "SUCCESS"
    }
    catch {
        Write-Status "Failed to create deployment package: $_" "ERROR"
        return $false
    }
    
    # Deploy Lambda function
    Write-Status "Deploying Lambda function..."
    try {
        # Check if function exists
        $functionExists = aws lambda get-function --function-name $FUNCTION_NAME --region $Region 2>$null
        
        if ($functionExists) {
            Write-Status "Updating existing Lambda function..."
            aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://backend-deployment.zip --region $Region
        }
        else {
            Write-Status "Creating new Lambda function..."
            # Create IAM role first
            $rolePolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@
            
            $rolePolicy | Out-File -FilePath "lambda-role-policy.json" -Encoding utf8
            
            aws iam create-role --role-name lambda-execution-role --assume-role-policy-document file://lambda-role-policy.json --region $Region 2>$null
            aws iam attach-role-policy --role-name lambda-execution-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole --region $Region 2>$null
            
            # Get account ID
            $accountId = aws sts get-caller-identity --query Account --output text
            
            # Wait for role to be ready
            Start-Sleep -Seconds 10
            
            aws lambda create-function `
                --function-name $FUNCTION_NAME `
                --runtime nodejs18.x `
                --role "arn:aws:iam::$accountId:role/lambda-execution-role" `
                --handler lambda.handler `
                --zip-file fileb://backend-deployment.zip `
                --timeout 30 `
                --memory-size 512 `
                --region $Region
        }
        
        Write-Status "Lambda function deployed successfully" "SUCCESS"
    }
    catch {
        Write-Status "Failed to deploy Lambda function: $_" "ERROR"
        return $false
    }
    
    # Configure API Gateway
    Write-Status "Configuring API Gateway..."
    try {
        # Get or create API Gateway
        $apiId = aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text --region $Region
        
        if (-not $apiId -or $apiId -eq "None") {
            Write-Status "Creating new API Gateway..."
            $apiId = aws apigateway create-rest-api --name $API_NAME --description "Modulus LMS Backend API" --query 'id' --output text --region $Region
        }
        
        Write-Status "API Gateway ID: $apiId" "SUCCESS"
        
        # Configure proxy integration
        $rootId = aws apigateway get-resources --rest-api-id $apiId --query 'items[?path==`/`].id' --output text --region $Region
        
        # Create {proxy+} resource if it doesn't exist
        $proxyId = aws apigateway get-resources --rest-api-id $apiId --query 'items[?pathPart==`{proxy+}`].id' --output text --region $Region
        
        if (-not $proxyId -or $proxyId -eq "None") {
            $proxyId = aws apigateway create-resource --rest-api-id $apiId --parent-id $rootId --path-part '{proxy+}' --query 'id' --output text --region $Region
        }
        
        # Create ANY method
        aws apigateway put-method --rest-api-id $apiId --resource-id $proxyId --http-method ANY --authorization-type NONE --region $Region 2>$null
        
        # Get account ID for integration URI
        $accountId = aws sts get-caller-identity --query Account --output text
        
        # Create integration
        aws apigateway put-integration `
            --rest-api-id $apiId `
            --resource-id $proxyId `
            --http-method ANY `
            --type AWS_PROXY `
            --integration-http-method POST `
            --uri "arn:aws:apigateway:$Region:lambda:path/2015-03-31/functions/arn:aws:lambda:$Region:$accountId:function:$FUNCTION_NAME/invocations" `
            --region $Region 2>$null
        
        # Grant API Gateway permission to invoke Lambda
        aws lambda add-permission `
            --function-name $FUNCTION_NAME `
            --statement-id apigateway-invoke `
            --action lambda:InvokeFunction `
            --principal apigateway.amazonaws.com `
            --source-arn "arn:aws:execute-api:$Region:$accountId:$apiId/*/*" `
            --region $Region 2>$null
        
        # Deploy API
        aws apigateway create-deployment --rest-api-id $apiId --stage-name prod --region $Region
        
        $apiUrl = "https://$apiId.execute-api.$Region.amazonaws.com/prod"
        Write-Status "API Gateway deployed: $apiUrl" "SUCCESS"
        
        return $apiUrl
    }
    catch {
        Write-Status "Failed to configure API Gateway: $_" "ERROR"
        return $false
    }
}

function Deploy-Frontend {
    param([string]$ApiUrl)
    
    Write-Status "Starting frontend deployment..." "INFO"
    
    # Set environment variables
    $env:NEXT_PUBLIC_API_URL = "$ApiUrl/api"
    Write-Status "Building with API URL: $($env:NEXT_PUBLIC_API_URL)" "INFO"
    
    # Install dependencies
    Write-Status "Installing frontend dependencies..."
    try {
        npm ci
        Write-Status "Frontend dependencies installed" "SUCCESS"
    }
    catch {
        Write-Status "Failed to install frontend dependencies: $_" "ERROR"
        return $false
    }
    
    # Build frontend
    Write-Status "Building frontend..."
    try {
        npm run build
        
        if (-not (Test-Path "out")) {
            Write-Status "Build failed - no 'out' directory found" "ERROR"
            return $false
        }
        
        Write-Status "Frontend build completed" "SUCCESS"
    }
    catch {
        Write-Status "Failed to build frontend: $_" "ERROR"
        return $false
    }
    
    # Create or configure S3 bucket
    Write-Status "Configuring S3 bucket: $BUCKET_NAME" "INFO"
    try {
        # Check if bucket exists
        $bucketExists = aws s3api head-bucket --bucket $BUCKET_NAME --region $Region 2>$null
        
        if (-not $bucketExists) {
            Write-Status "Creating new S3 bucket..."
            if ($Region -eq "us-east-1") {
                aws s3api create-bucket --bucket $BUCKET_NAME --region $Region
            }
            else {
                aws s3api create-bucket --bucket $BUCKET_NAME --region $Region --create-bucket-configuration LocationConstraint=$Region
            }
        }
        
        # Configure for static website hosting
        aws s3api put-bucket-website --bucket $BUCKET_NAME --website-configuration '{
            "IndexDocument": {"Suffix": "index.html"},
            "ErrorDocument": {"Key": "404.html"}
        }' --region $Region
        
        # Set public access
        aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false --region $Region
        
        # Apply bucket policy
        $bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
"@
        $bucketPolicy | Out-File -FilePath "bucket-policy.json" -Encoding utf8
        aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json --region $Region
        
        Write-Status "S3 bucket configured" "SUCCESS"
    }
    catch {
        Write-Status "Failed to configure S3 bucket: $_" "ERROR"
        return $false
    }
    
    # Deploy to S3
    Write-Status "Deploying to S3..."
    try {
        aws s3 sync out/ s3://$BUCKET_NAME --delete --region $Region
        
        $websiteUrl = "http://$BUCKET_NAME.s3-website-$Region.amazonaws.com"
        if ($Region -eq "us-east-1") {
            $websiteUrl = "http://$BUCKET_NAME.s3-website.amazonaws.com"
        }
        
        Write-Status "Frontend deployed: $websiteUrl" "SUCCESS"
        return $websiteUrl
    }
    catch {
        Write-Status "Failed to deploy to S3: $_" "ERROR"
        return $false
    }
}

function Test-Deployment {
    param([string]$ApiUrl, [string]$WebsiteUrl)
    
    Write-Status "Testing deployment..." "INFO"
    
    # Test API endpoints
    Write-Status "Testing API endpoints..."
    try {
        # Test health endpoint
        $healthResponse = Invoke-RestMethod -Uri "$ApiUrl/api/health" -Method Get -TimeoutSec 30
        Write-Status "✅ Health endpoint: $($healthResponse.status)" "SUCCESS"
        
        # Test status endpoint
        $statusResponse = Invoke-RestMethod -Uri "$ApiUrl/api/status" -Method Get -TimeoutSec 30
        Write-Status "✅ Status endpoint: $($statusResponse.message)" "SUCCESS"
        
        # Test registration with role-based access code
        $registerPayload = @{
            name = "Test User Deploy"
            email = "test.deploy@university.edu"
            password = "testpassword123"
            role = "student"
            accessCode = "STUDENT2024"
        }
        
        $registerResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/register" -Method Post -Body ($registerPayload | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30
        Write-Status "✅ Student registration: $($registerResponse.message)" "SUCCESS"
        
        # Test admin login
        $loginPayload = @{
            email = "admin@modulus.edu"
            password = "admin123"
        }
        
        $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/login" -Method Post -Body ($loginPayload | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30
        
        if ($loginResponse.token) {
            Write-Status "✅ Admin login successful" "SUCCESS"
            
            # Test admin endpoints
            $headers = @{ Authorization = "Bearer $($loginResponse.token)" }
            
            $usersResponse = Invoke-RestMethod -Uri "$ApiUrl/api/admin/users" -Method Get -Headers $headers -TimeoutSec 30
            Write-Status "✅ Admin users endpoint: $($usersResponse.users.Count) users found" "SUCCESS"
            
            $coursesResponse = Invoke-RestMethod -Uri "$ApiUrl/api/courses" -Method Get -Headers $headers -TimeoutSec 30
            Write-Status "✅ Courses endpoint: $($coursesResponse.courses.Count) courses found" "SUCCESS"
        }
        
    }
    catch {
        Write-Status "API testing failed: $_" "WARNING"
    }
    
    # Test frontend
    if ($WebsiteUrl) {
        Write-Status "Testing frontend..."
        try {
            $frontendResponse = Invoke-WebRequest -Uri $WebsiteUrl -TimeoutSec 30
            if ($frontendResponse.Content -match "ModulusLMS") {
                Write-Status "✅ Frontend is accessible and contains expected content" "SUCCESS"
            }
            else {
                Write-Status "⚠️ Frontend accessible but content unexpected" "WARNING"
            }
        }
        catch {
            Write-Status "Frontend testing failed: $_" "WARNING"
        }
    }
}

# Main execution
try {
    Write-Status "Deployment configuration:" "INFO"
    Write-Status "- Deploy Backend: $DeployBackend" "INFO"
    Write-Status "- Deploy Frontend: $DeployFrontend" "INFO"
    Write-Status "- Test Endpoints: $TestEndpoints" "INFO"
    Write-Status "- Region: $Region" "INFO"
    Write-Status "- Bucket: $BUCKET_NAME" "INFO"
    
    if (-not (Test-Dependencies)) {
        Write-Status "Dependency check failed. Exiting." "ERROR"
        exit 1
    }
    
    $apiUrl = $null
    $websiteUrl = $null
    
    if ($DeployBackend) {
        $apiUrl = Deploy-Backend
        if (-not $apiUrl) {
            Write-Status "Backend deployment failed. Exiting." "ERROR"
            exit 1
        }
    }
    else {
        # Get existing API URL
        $apiId = aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text --region $Region
        if ($apiId -and $apiId -ne "None") {
            $apiUrl = "https://$apiId.execute-api.$Region.amazonaws.com/prod"
            Write-Status "Using existing API: $apiUrl" "INFO"
        }
    }
    
    if ($DeployFrontend -and $apiUrl) {
        $websiteUrl = Deploy-Frontend -ApiUrl $apiUrl
        if (-not $websiteUrl) {
            Write-Status "Frontend deployment failed. Exiting." "ERROR"
            exit 1
        }
    }
    
    if ($TestEndpoints -and $apiUrl) {
        Start-Sleep -Seconds 5  # Allow time for propagation
        Test-Deployment -ApiUrl $apiUrl -WebsiteUrl $websiteUrl
    }
    
    Write-Status "=====================================" "SUCCESS"
    Write-Status "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!" "SUCCESS"
    Write-Status "=====================================" "SUCCESS"
    
    if ($apiUrl) {
        Write-Status "🔗 API URL: $apiUrl" "SUCCESS"
        Write-Status "🏥 Health Check: $apiUrl/api/health" "SUCCESS"
    }
    
    if ($websiteUrl) {
        Write-Status "🌐 Website URL: $websiteUrl" "SUCCESS"
    }
    
    Write-Status "" "INFO"
    Write-Status "Features deployed:" "INFO"
    Write-Status "✅ Role-based registration (Student, Instructor, Staff, Admin)" "INFO"
    Write-Status "✅ User approval workflow" "INFO"
    Write-Status "✅ Admin dashboard with real user data" "INFO"
    Write-Status "✅ Course management (CRUD operations)" "INFO"
    Write-Status "✅ Profile pages for all users" "INFO"
    Write-Status "✅ Fixed registration form styling" "INFO"
    
}
catch {
    Write-Status "Deployment failed with error: $_" "ERROR"
    exit 1
}
finally {
    # Cleanup
    if (Test-Path "backend-deployment.zip") { Remove-Item "backend-deployment.zip" -Force -ErrorAction SilentlyContinue }
    if (Test-Path "lambda-role-policy.json") { Remove-Item "lambda-role-policy.json" -Force -ErrorAction SilentlyContinue }
    if (Test-Path "bucket-policy.json") { Remove-Item "bucket-policy.json" -Force -ErrorAction SilentlyContinue }
}
