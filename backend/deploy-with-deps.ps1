# Deploy Lambda with dependencies
Write-Host "Creating Lambda package with dependencies..." -ForegroundColor Green

# Create temp directory
New-Item -ItemType Directory -Path "lambda-deploy" -Force

# Copy source files
Copy-Item "*.js" "lambda-deploy/" -ErrorAction SilentlyContinue
Copy-Item "routes" "lambda-deploy/routes" -Recurse -ErrorAction SilentlyContinue
Copy-Item ".env" "lambda-deploy/" -ErrorAction SilentlyContinue

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

$pkg | ConvertTo-Json -Depth 3 | Out-File "lambda-deploy/package.json" -Encoding UTF8

# Install production dependencies
Push-Location "lambda-deploy"
npm install --only=production --no-optional
Pop-Location

# Create deployment package
Compress-Archive -Path "lambda-deploy/*" -DestinationPath "modulus-backend-full.zip" -Force

Write-Host "Deploying to Lambda..." -ForegroundColor Blue
aws lambda update-function-code --function-name modulus-backend --zip-file fileb://modulus-backend-full.zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Function URL: https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
}

# Cleanup
Remove-Item "lambda-deploy" -Recurse -Force
Write-Host "Cleanup complete" -ForegroundColor Gray
