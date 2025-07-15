# Simple Lambda deployment script
Write-Host "Creating optimized package..." -ForegroundColor Green

# Create temp directory
New-Item -ItemType Directory -Path "temp-deploy" -Force

# Copy essential files only
Copy-Item "*.js" "temp-deploy/" -ErrorAction SilentlyContinue
Copy-Item "package.json" "temp-deploy/"
Copy-Item ".env" "temp-deploy/" -ErrorAction SilentlyContinue
Copy-Item "routes" "temp-deploy/routes" -Recurse -ErrorAction SilentlyContinue

# Create optimized package.json
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

$pkg | ConvertTo-Json -Depth 3 | Out-File "temp-deploy/package.json" -Encoding UTF8

# Create zip
Compress-Archive -Path "temp-deploy/*" -DestinationPath "backend-optimized.zip" -Force

# Deploy
Write-Host "Deploying to Lambda..." -ForegroundColor Blue
aws lambda update-function-code --function-name modulus-backend --zip-file fileb://backend-optimized.zip

# Clean up
Remove-Item "temp-deploy" -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
