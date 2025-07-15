# Deploy Lambda without problematic dependencies
Write-Host "Creating Lambda-optimized package..." -ForegroundColor Green

# Create temp directory
New-Item -ItemType Directory -Path "lambda-optimized" -Force

# Copy essential Lambda files
Copy-Item "lambda.js" "lambda-optimized/"
Copy-Item "lambda-server.js" "lambda-optimized/"
Copy-Item "rds-data-client.js" "lambda-optimized/"
Copy-Item ".env" "lambda-optimized/" -ErrorAction SilentlyContinue

# Copy routes excluding desktop
Copy-Item "routes/auth.js" "lambda-optimized/routes/" -Force
Copy-Item "routes/users.js" "lambda-optimized/routes/" -Force
Copy-Item "routes/health.js" "lambda-optimized/routes/" -Force
Copy-Item "routes/admin.js" "lambda-optimized/routes/" -Force
Copy-Item "routes/courses.js" "lambda-optimized/routes/" -Force
Copy-Item "routes/labs.js" "lambda-optimized/routes/" -Force

# Copy middleware
if (Test-Path "middleware") {
    Copy-Item "middleware" "lambda-optimized/middleware" -Recurse -ErrorAction SilentlyContinue
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

$pkg | ConvertTo-Json -Depth 3 | Out-File "lambda-optimized/package.json" -Encoding UTF8

# Install production dependencies
Push-Location "lambda-optimized"
npm install --omit=dev --omit=optional
Pop-Location

# Create deployment package
Compress-Archive -Path "lambda-optimized/*" -DestinationPath "modulus-backend-optimized.zip" -Force

Write-Host "Deploying optimized package to Lambda..." -ForegroundColor Blue
aws lambda update-function-code --function-name modulus-backend --zip-file fileb://modulus-backend-optimized.zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Function URL: https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
}

# Cleanup
Remove-Item "lambda-optimized" -Recurse -Force
Write-Host "Cleanup complete" -ForegroundColor Gray
