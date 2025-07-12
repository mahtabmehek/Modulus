# Modulus LMS - Deployment Trigger Script (PowerShell)
# Requires AWS CLI to be installed and configured

param(
    [Parameter()]
    [ValidateSet("full", "backend", "frontend", "database", "test", "status")]
    [string]$DeployType = ""
)

# Configuration
$AWS_REGION = "eu-west-2"
$LAMBDA_FUNCTION = "modulus-backend"
$S3_BUCKET = "modulus-frontend-1370267358"
$API_GATEWAY_NAME = "modulus-api"

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = "Red"
        "Green" = "Green" 
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "White" = "White"
        "Cyan" = "Cyan"
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

Write-ColorOutput "🚀 Modulus LMS Deployment Script" "Blue"
Write-ColorOutput "This script will deploy both backend and frontend components" "Yellow"
Write-Host ""

# Check AWS CLI
try {
    aws sts get-caller-identity | Out-Null
    Write-ColorOutput "✅ AWS CLI configured" "Green"
} catch {
    Write-ColorOutput "❌ AWS CLI not configured. Please run 'aws configure' first." "Red"
    exit 1
}

# Function to get API Gateway URL
function Get-ApiUrl {
    try {
        $apiId = aws apigateway get-rest-apis `
            --region $AWS_REGION `
            --query "items[?name=='$API_GATEWAY_NAME'].id" `
            --output text
        
        if ($apiId -and $apiId -ne "None") {
            return "https://$apiId.execute-api.$AWS_REGION.amazonaws.com/prod"
        }
    } catch {
        return $null
    }
    return $null
}

# Backend deployment function
function Deploy-Backend {
    Write-ColorOutput "📦 Building and deploying backend..." "Yellow"
    
    Push-Location backend
    try {
        # Install dependencies
        Write-ColorOutput "Installing dependencies..." "Blue"
        npm install
        
        # Create deployment package
        $needsRebuild = $false
        if (-not (Test-Path "modulus-backend.zip")) {
            $needsRebuild = $true
        } else {
            $zipTime = (Get-Item "modulus-backend.zip").LastWriteTime
            $jsFiles = Get-ChildItem -Path "." -Filter "*.js" -Recurse | Where-Object { $_.LastWriteTime -gt $zipTime }
            if ($jsFiles) {
                $needsRebuild = $true
            }
        }
        
        if ($needsRebuild) {
            Write-ColorOutput "Creating new backend package..." "Yellow"
            
            # Remove old package
            if (Test-Path "modulus-backend.zip") {
                Remove-Item "modulus-backend.zip"
            }
            
            # Create new package excluding unnecessary files
            $excludePatterns = @("node_modules", "*.zip", "test", ".git", "*.log")
            $filesToZip = Get-ChildItem -Path "." -Recurse | Where-Object { 
                $file = $_
                $shouldExclude = $false
                foreach ($pattern in $excludePatterns) {
                    if ($file.FullName -like "*$pattern*") {
                        $shouldExclude = $true
                        break
                    }
                }
                -not $shouldExclude
            }
            
            Compress-Archive -Path $filesToZip -DestinationPath "modulus-backend.zip" -Force
            Write-ColorOutput "✅ Backend package created" "Green"
        } else {
            Write-ColorOutput "✅ Backend package is up to date" "Green"
        }
        
        # Deploy to Lambda
        Write-ColorOutput "🚀 Updating Lambda function..." "Yellow"
        aws lambda update-function-code `
            --function-name $LAMBDA_FUNCTION `
            --zip-file fileb://modulus-backend.zip `
            --region $AWS_REGION
        
        # Wait for update
        Write-ColorOutput "⏳ Waiting for Lambda update..." "Yellow"
        aws lambda wait function-updated `
            --function-name $LAMBDA_FUNCTION `
            --region $AWS_REGION
        
        Write-ColorOutput "✅ Backend deployed successfully" "Green"
        
    } finally {
        Pop-Location
    }
}

# Frontend deployment function
function Deploy-Frontend {
    Write-ColorOutput "📦 Building and deploying frontend..." "Yellow"
    
    Push-Location frontend
    try {
        # Install dependencies and build
        Write-ColorOutput "Installing dependencies..." "Blue"
        npm install
        
        Write-ColorOutput "Building React application..." "Blue"
        npm run build
        
        # Deploy to S3
        Write-ColorOutput "🚀 Uploading to S3..." "Yellow"
        aws s3 sync dist/ s3://$S3_BUCKET/ `
            --region $AWS_REGION `
            --delete `
            --cache-control "public, max-age=86400"
        
        # Update S3 website configuration
        aws s3 website s3://$S3_BUCKET `
            --index-document index.html `
            --error-document index.html `
            --region $AWS_REGION
        
        Write-ColorOutput "✅ Frontend deployed successfully" "Green"
        Write-ColorOutput "🌐 Frontend URL: http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com/" "Blue"
        
    } finally {
        Pop-Location
    }
}

# Database initialization function
function Initialize-Database {
    Write-ColorOutput "🗄️ Initializing database..." "Yellow"
    
    $apiUrl = Get-ApiUrl
    
    if (-not $apiUrl) {
        Write-ColorOutput "❌ Could not find API Gateway URL" "Red"
        return
    }
    
    Write-ColorOutput "Using API URL: $apiUrl" "Blue"
    
    try {
        # Initialize database
        Write-ColorOutput "Creating database tables..." "Yellow"
        $response = Invoke-RestMethod -Uri "$apiUrl/api/admin/init-db" -Method POST -ContentType "application/json"
        
        Write-ColorOutput "✅ Database initialized: $($response.message)" "Green"
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 200 -or $statusCode -eq 201) {
            Write-ColorOutput "✅ Database initialization completed" "Green"
        } else {
            Write-ColorOutput "⚠️ Database may already be initialized (HTTP: $statusCode)" "Yellow"
        }
    }
}

# Test function
function Test-Deployment {
    Write-ColorOutput "🧪 Running deployment tests..." "Yellow"
    
    $apiUrl = Get-ApiUrl
    
    if (-not $apiUrl) {
        Write-ColorOutput "❌ Could not find API Gateway URL" "Red"
        return
    }
    
    Write-ColorOutput "Testing API at: $apiUrl" "Blue"
    
    # Test health endpoint
    Write-ColorOutput "Testing health endpoint..." "Yellow"
    try {
        $healthResponse = Invoke-RestMethod -Uri "$apiUrl/api/health" -Method GET
        Write-ColorOutput "✅ Health check passed: $($healthResponse.message)" "Green"
    } catch {
        Write-ColorOutput "❌ Health check failed" "Red"
        return
    }
    
    # Test registration endpoints
    Write-ColorOutput "Testing registration endpoints..." "Yellow"
    
    $roles = @("student", "instructor", "staff", "admin")
    $accessCodes = @{
        "student" = "student2025"
        "instructor" = "instructor2025" 
        "staff" = "staff2025"
        "admin" = "mahtabmehek1337"
    }
    
    foreach ($role in $roles) {
        Write-ColorOutput "Testing $role registration..." "Blue"
        
        $testUser = @{
            name = "Test $role User"
            email = "test.$role@modulus.test"
            password = "TestPassword123!"
            role = $role
            accessCode = $accessCodes[$role]
        }
        
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/api/auth/register" `
                -Method POST `
                -ContentType "application/json" `
                -Body ($testUser | ConvertTo-Json)
            
            Write-ColorOutput "✅ $role registration test passed" "Green"
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-ColorOutput "⚠️ $role registration test: HTTP $statusCode" "Yellow"
        }
    }
    
    Write-ColorOutput "✅ All tests completed" "Green"
}

# Status function
function Show-Status {
    Write-ColorOutput "📊 Deployment Status" "Blue"
    Write-Host "===================="
    
    # Lambda function status
    try {
        $lambdaStatus = aws lambda get-function `
            --function-name $LAMBDA_FUNCTION `
            --region $AWS_REGION `
            --query 'Configuration.State' `
            --output text
        
        Write-ColorOutput "Lambda Function: $LAMBDA_FUNCTION - Status: $lambdaStatus" "Green"
    } catch {
        Write-ColorOutput "Lambda Function: $LAMBDA_FUNCTION - Status: ERROR" "Red"
    }
    
    # S3 bucket status
    try {
        aws s3api head-bucket --bucket $S3_BUCKET --region $AWS_REGION | Out-Null
        Write-ColorOutput "S3 Bucket: $S3_BUCKET - Status: EXISTS" "Green"
    } catch {
        Write-ColorOutput "S3 Bucket: $S3_BUCKET - Status: NOT_FOUND" "Red"
    }
    
    # API Gateway status
    $apiUrl = Get-ApiUrl
    if ($apiUrl) {
        Write-ColorOutput "API Gateway: $API_GATEWAY_NAME - URL: $apiUrl" "Green"
    } else {
        Write-ColorOutput "API Gateway: NOT_FOUND" "Red"
    }
    
    Write-Host ""
}

# Main deployment logic
function Start-Deployment {
    Show-Status
    
    if (-not $DeployType) {
        Write-ColorOutput "Select deployment option:" "Blue"
        Write-Host "1) Full deployment (backend + frontend + database)"
        Write-Host "2) Backend only"
        Write-Host "3) Frontend only"
        Write-Host "4) Database initialization only"
        Write-Host "5) Run tests only"
        Write-Host "6) Show status only"
        
        $choice = Read-Host "Enter choice (1-6)"
        
        switch ($choice) {
            "1" { $DeployType = "full" }
            "2" { $DeployType = "backend" }
            "3" { $DeployType = "frontend" }
            "4" { $DeployType = "database" }
            "5" { $DeployType = "test" }
            "6" { $DeployType = "status" }
            default { 
                Write-ColorOutput "Invalid choice" "Red"
                exit 1
            }
        }
    }
    
    switch ($DeployType) {
        "full" {
            Write-ColorOutput "Starting full deployment..." "Blue"
            Deploy-Backend
            Deploy-Frontend
            Initialize-Database
            Test-Deployment
        }
        "backend" {
            Write-ColorOutput "Starting backend deployment..." "Blue"
            Deploy-Backend
        }
        "frontend" {
            Write-ColorOutput "Starting frontend deployment..." "Blue"
            Deploy-Frontend
        }
        "database" {
            Write-ColorOutput "Initializing database..." "Blue"
            Initialize-Database
        }
        "test" {
            Write-ColorOutput "Running tests..." "Blue"
            Test-Deployment
        }
        "status" {
            Show-Status
            exit 0
        }
    }
    
    Write-Host ""
    Write-ColorOutput "🎉 Deployment completed successfully!" "Green"
    Show-Status
}

# Run main function
Start-Deployment
