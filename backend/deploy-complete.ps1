# Deploy Lambda with all dependencies and directories
Write-Host "Creating complete Lambda package..." -ForegroundColor Green

# Create temp directory
New-Item -ItemType Directory -Path "lambda-complete" -Force

# Copy source files
Copy-Item "*.js" "lambda-complete/" -ErrorAction SilentlyContinue
Copy-Item ".env" "lambda-complete/" -ErrorAction SilentlyContinue

# Copy all directories
if (Test-Path "routes") {
    Copy-Item "routes" "lambda-complete/routes" -Recurse -ErrorAction SilentlyContinue
}

if (Test-Path "middleware") {
    Copy-Item "middleware" "lambda-complete/middleware" -Recurse -ErrorAction SilentlyContinue
}

if (Test-Path "services") {
    Copy-Item "services" "lambda-complete/services" -Recurse -ErrorAction SilentlyContinue
}

# Create production package.json
$pkg = @{
    name = "modulus-backend"
    version = "1.0.0"
    main = "lambda.js"
    dependencies = @{
        "aws-sdk" = "^2.1692.0"
        "express" = "^4.21.2"
        "cors" = "^2.8.5"
        "dotenv" = "^16.3.1"
        "express-validator" = "^7.2.1"
        "bcryptjs" = "^2.4.3"
        "jsonwebtoken" = "^9.0.2"
        "serverless-http" = "^3.2.0"
        "helmet" = "^7.1.0"
        "express-rate-limit" = "^7.1.5"
        "pg" = "^8.16.3"
    }
}

$pkg | ConvertTo-Json -Depth 3 | Out-File "lambda-complete/package.json" -Encoding UTF8

# Install production dependencies
Push-Location "lambda-complete"
npm install --omit=dev --omit=optional
Pop-Location

# Create deployment package
Compress-Archive -Path "lambda-complete/*" -DestinationPath "modulus-backend-complete.zip" -Force

Write-Host "Deploying to Lambda..." -ForegroundColor Blue
aws lambda update-function-code --function-name modulus-backend --zip-file fileb://modulus-backend-complete.zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Function URL: https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
}

# Cleanup
Remove-Item "lambda-complete" -Recurse -Force
Write-Host "Cleanup complete" -ForegroundColor Gray
