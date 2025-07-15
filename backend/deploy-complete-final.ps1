# Complete Lambda deployment with proper file structure
Write-Host "Creating complete Lambda deployment..." -ForegroundColor Green

# Clean up
if (Test-Path "lambda-deploy-complete") { Remove-Item "lambda-deploy-complete" -Recurse -Force }

# Create directory structure
New-Item -ItemType Directory -Path "lambda-deploy-complete" -Force
New-Item -ItemType Directory -Path "lambda-deploy-complete/routes" -Force
New-Item -ItemType Directory -Path "lambda-deploy-complete/middleware" -Force

# Copy Lambda entry points
Copy-Item "lambda.js" "lambda-deploy-complete/"
Copy-Item "lambda-server.js" "lambda-deploy-complete/"
Copy-Item "rds-data-client.js" "lambda-deploy-complete/"

# Copy ALL routes (excluding desktop that has docker dependencies)
Get-ChildItem "routes/*.js" | Where-Object { $_.Name -ne "desktop.js" } | ForEach-Object {
    Copy-Item $_.FullName "lambda-deploy-complete/routes/"
}

# Copy ALL middleware
Get-ChildItem "middleware/*.js" | ForEach-Object {
    Copy-Item $_.FullName "lambda-deploy-complete/middleware/"
}

# Copy environment file if exists
if (Test-Path ".env") {
    Copy-Item ".env" "lambda-deploy-complete/"
}

# Create clean package.json
@'
{
  "name": "modulus-backend",
  "version": "1.0.0",
  "main": "lambda.js",
  "dependencies": {
    "aws-sdk": "^2.1692.0",
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.2.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "serverless-http": "^3.2.0",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "pg": "^8.16.3"
  }
}
'@ | Out-File "lambda-deploy-complete/package.json" -Encoding ASCII

# Install dependencies
Push-Location "lambda-deploy-complete"
npm install --production --no-optional
Pop-Location

# Create deployment package
Compress-Archive -Path "lambda-deploy-complete/*" -DestinationPath "modulus-backend-complete-deployment.zip" -Force

Write-Host "Deploying complete package to Lambda..." -ForegroundColor Blue
aws lambda update-function-code --function-name modulus-backend --zip-file fileb://modulus-backend-complete-deployment.zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Complete deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Testing authentication..." -ForegroundColor Yellow
    
    # Wait for deployment
    Start-Sleep -Seconds 3
    
    # Test status endpoint
    try {
        $status = Invoke-WebRequest -Uri "https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/api/status" -UseBasicParsing
        Write-Host "✅ Status endpoint working: $($status.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Status endpoint failed" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
}

# Cleanup
Remove-Item "lambda-deploy-complete" -Recurse -Force
Write-Host "Deployment complete!" -ForegroundColor Cyan
