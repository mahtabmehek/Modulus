# Final Lambda deployment script
Write-Host "Creating final Lambda package..." -ForegroundColor Green

# Remove any existing deployment directories
if (Test-Path "lambda-final") { Remove-Item "lambda-final" -Recurse -Force }

# Create temp directory structure
New-Item -ItemType Directory -Path "lambda-final" -Force
New-Item -ItemType Directory -Path "lambda-final/routes" -Force
New-Item -ItemType Directory -Path "lambda-final/middleware" -Force

# Copy Lambda-specific files
Copy-Item "lambda.js" "lambda-final/"
Copy-Item "lambda-server.js" "lambda-final/"
Copy-Item "rds-data-client.js" "lambda-final/"

# Copy all routes except desktop
Copy-Item "routes/auth.js" "lambda-final/routes/"
Copy-Item "routes/users.js" "lambda-final/routes/"
Copy-Item "routes/health.js" "lambda-final/routes/"
Copy-Item "routes/admin.js" "lambda-final/routes/"
Copy-Item "routes/courses.js" "lambda-final/routes/"
Copy-Item "routes/labs.js" "lambda-final/routes/"

# Copy middleware
Copy-Item "middleware/*" "lambda-final/middleware/" -Recurse

# Copy .env if exists
if (Test-Path ".env") {
    Copy-Item ".env" "lambda-final/"
}

# Create production package.json with exact encoding
@"
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
"@ | Out-File "lambda-final/package.json" -Encoding ASCII

# Install dependencies
Push-Location "lambda-final"
npm install --production --no-optional
Pop-Location

# Create deployment package
Compress-Archive -Path "lambda-final/*" -DestinationPath "modulus-backend-final.zip" -Force

Write-Host "Deploying final package to Lambda..." -ForegroundColor Blue
aws lambda update-function-code --function-name modulus-backend --zip-file fileb://modulus-backend-final.zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Final deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Testing endpoint..." -ForegroundColor Yellow
    
    # Wait a moment for deployment
    Start-Sleep -Seconds 5
    
    # Test the endpoint
    try {
        $response = Invoke-WebRequest -Uri "https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/api/status" -UseBasicParsing
        Write-Host "✅ API is responding: $($response.StatusCode)" -ForegroundColor Green
        Write-Host $response.Content
    } catch {
        Write-Host "⚠️ API test failed, checking logs..." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
}

# Cleanup
Remove-Item "lambda-final" -Recurse -Force
Write-Host "Cleanup complete" -ForegroundColor Gray
