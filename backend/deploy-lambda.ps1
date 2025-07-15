# Deploy Modulus Backend to AWS Lambda
Write-Host "🚀 Creating optimized Lambda deployment package..." -ForegroundColor Green

# Create temporary deployment directory
$deployDir = "deploy-temp"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir

# Copy only necessary files (exclude node_modules, zips, logs, etc.)
$includeFiles = @(
    "*.js",
    "*.json",
    ".env"
)

$excludePatterns = @(
    "node_modules",
    "*.zip",
    "*.log",
    "*.tmp",
    "deploy-temp"
)

# Copy files
foreach ($pattern in $includeFiles) {
    Get-ChildItem -Path . -Filter $pattern | Where-Object {
        $file = $_
        $include = $true
        foreach ($exclude in $excludePatterns) {
            if ($file.Name -like $exclude -or $file.FullName -like "*$exclude*") {
                $include = $false
                break
            }
        }
        return $include
    } | Copy-Item -Destination $deployDir
}

# Copy routes directory
if (Test-Path "routes") {
    Copy-Item -Path "routes" -Destination "$deployDir\routes" -Recurse
}

# Create package.json for production
$packageJson = @{
    name = "modulus-backend"
    version = "1.0.0"
    main = "lambda.js"
    dependencies = @{
        "aws-sdk" = "^2.1692.0"
        "bcryptjs" = "^2.4.3"
        "cors" = "^2.8.5"
        "dotenv" = "^16.3.1"
        "express" = "^4.21.2"
        "express-rate-limit" = "^7.1.5"
        "express-validator" = "^7.2.1"
        "helmet" = "^7.1.0"
        "jsonwebtoken" = "^9.0.2"
        "pg" = "^8.16.3"
        "serverless-http" = "^3.2.0"
    }
} | ConvertTo-Json -Depth 10

$packageJson | Out-File -FilePath "$deployDir\package.json" -Encoding UTF8

Write-Host "📦 Creating Lambda package..." -ForegroundColor Yellow
Compress-Archive -Path "$deployDir\*" -DestinationPath "modulus-backend-optimized.zip" -Force

Write-Host "🔄 Deploying to AWS Lambda..." -ForegroundColor Blue
aws lambda update-function-code --function-name modulus-backend --zip-file fileb://modulus-backend-optimized.zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend deployment successful!" -ForegroundColor Green
    
    # Update environment variables if needed
    Write-Host "🔧 Updating Lambda configuration..." -ForegroundColor Yellow
    aws lambda update-function-configuration --function-name modulus-backend --environment Variables="{NODE_ENV=production,JWT_SECRET=production-secret-key-$(Get-Random),DB_HOST=modulus-aurora-cluster.cluster-cziw68k8m79u.eu-west-2.rds.amazonaws.com,DB_NAME=modulus,DB_USER=modulus_admin,DB_PASSWORD=ModulusAurora2025!}"
    
    Write-Host "🌐 Getting Lambda function URL..." -ForegroundColor Cyan
    aws lambda get-function-url-config --function-name modulus-backend
} else {
    Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
}

# Cleanup
Remove-Item $deployDir -Recurse -Force
Write-Host "🧹 Cleanup completed" -ForegroundColor Gray
