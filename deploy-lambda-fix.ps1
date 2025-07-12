# Lambda deployment fix script
Write-Host "🚀 Fixing and deploying Lambda function..." -ForegroundColor Green

# Check if AWS CLI is configured
try {
    $awsIdentity = aws sts get-caller-identity 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ AWS CLI is configured" -ForegroundColor Green
        $identity = $awsIdentity | ConvertFrom-Json
        Write-Host "Account: $($identity.Account), User: $($identity.Arn)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ AWS CLI not configured. Please run 'aws configure'" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
$backendDir = ".\backend"
if (-not (Test-Path $backendDir)) {
    Write-Host "❌ Backend directory not found: $backendDir" -ForegroundColor Red
    exit 1
}

Set-Location $backendDir

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found in backend directory" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Ensure serverless-http is installed
Write-Host "📦 Installing serverless-http..." -ForegroundColor Yellow
npm install serverless-http

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
$zipFile = "..\backend-deployment.zip"

# Remove old zip if exists
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Create zip file excluding unnecessary files
$filesToExclude = @(
    "node_modules\aws-sdk\*",
    "*.zip",
    "*.log",
    ".git\*",
    ".env*",
    "README.md"
)

# Use PowerShell to create zip
Add-Type -AssemblyName System.IO.Compression.FileSystem

$compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal
$zipArchive = [System.IO.Compression.ZipFile]::Open((Resolve-Path $zipFile), [System.IO.Compression.ZipArchiveMode]::Create)

# Add all files except excluded ones
Get-ChildItem -Recurse | Where-Object { 
    $file = $_
    $shouldExclude = $false
    foreach ($exclude in $filesToExclude) {
        if ($file.FullName -like "*$exclude*") {
            $shouldExclude = $true
            break
        }
    }
    -not $shouldExclude -and -not $file.PSIsContainer
} | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $entry = $zipArchive.CreateEntry($relativePath, $compressionLevel)
    $stream = $entry.Open()
    $fileStream = [System.IO.File]::OpenRead($_.FullName)
    $fileStream.CopyTo($stream)
    $fileStream.Close()
    $stream.Close()
}

$zipArchive.Dispose()

Write-Host "✅ Deployment package created: $zipFile" -ForegroundColor Green

# Go back to root directory
Set-Location ..

# Deploy to Lambda
Write-Host "🚀 Deploying to AWS Lambda..." -ForegroundColor Yellow
$functionName = "modulus-backend"
$region = "eu-west-2"

try {
    $updateResult = aws lambda update-function-code `
        --region $region `
        --function-name $functionName `
        --zip-file "fileb://backend-deployment.zip" `
        2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lambda function updated successfully!" -ForegroundColor Green
        
        # Wait for function to be updated
        Write-Host "⏳ Waiting for function to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Test the deployment
        Write-Host "🧪 Testing deployed function..." -ForegroundColor Yellow
        
        # Test health endpoint
        $healthUrl = "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api/health"
        try {
            $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method GET
            Write-Host "✅ Health endpoint working" -ForegroundColor Green
            Write-Host "Response: $($healthResponse | ConvertTo-Json)" -ForegroundColor Cyan
        } catch {
            Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Test seed endpoint
        $seedUrl = "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api/admin/seed"
        try {
            $seedResponse = Invoke-RestMethod -Uri $seedUrl -Method GET
            Write-Host "✅ Seed endpoint working!" -ForegroundColor Green
            Write-Host "Users created: $($seedResponse.users.Count)" -ForegroundColor Cyan
            Write-Host "Password for all users: $($seedResponse.password)" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Seed endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Lambda deployment failed:" -ForegroundColor Red
        Write-Host $updateResult -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error deploying to Lambda: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 Deployment Summary" -ForegroundColor Yellow
Write-Host "Function: $functionName"
Write-Host "Region: $region"
Write-Host "API URL: https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"

Write-Host "`n🎉 Deployment completed!" -ForegroundColor Green
