# Modulus LMS Deployment Script (PowerShell)
Write-Host "🚀 Starting Modulus LMS Deployment..." -ForegroundColor Green

# Set AWS region
$env:AWS_DEFAULT_REGION = "eu-west-2"

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Build Docker image
Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
docker build -t modulus-frontend .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully!" -ForegroundColor Green

# Tag for ECR
$ECR_REGISTRY = "533267404533.dkr.ecr.eu-west-2.amazonaws.com"
$IMAGE_TAG = "latest"
$FULL_IMAGE_NAME = "$ECR_REGISTRY/modulus:$IMAGE_TAG"

Write-Host "🏷️ Tagging image for ECR..." -ForegroundColor Yellow
docker tag modulus-frontend:latest $FULL_IMAGE_NAME

# Login to ECR
Write-Host "🔐 Logging into ECR..." -ForegroundColor Yellow
$loginCommand = aws ecr get-login-password --region eu-west-2
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ECR login command failed!" -ForegroundColor Red
    exit 1
}

$loginCommand | docker login --username AWS --password-stdin $ECR_REGISTRY

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ECR login failed!" -ForegroundColor Red
    exit 1
}

# Push to ECR
Write-Host "⬆️ Pushing image to ECR..." -ForegroundColor Yellow
docker push $FULL_IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image pushed to ECR successfully!" -ForegroundColor Green

# Update ECS service
Write-Host "🔄 Updating ECS service..." -ForegroundColor Yellow
aws ecs update-service --cluster modulus-cluster --service modulus-service --force-new-deployment --region eu-west-2

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ECS service update failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ ECS service update initiated!" -ForegroundColor Green
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow

# Wait for service to become stable
aws ecs wait services-stable --cluster modulus-cluster --services modulus-service --region eu-west-2

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend should be available at: http://modulus-alb-2046761654.eu-west-2.elb.amazonaws.com" -ForegroundColor Cyan

# Test the deployment
Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "http://modulus-alb-2046761654.eu-west-2.elb.amazonaws.com" -TimeoutSec 30
    Write-Host "✅ Frontend is responding!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend might still be starting up. Please check in a few minutes." -ForegroundColor Yellow
}

Write-Host "✅ Deployment script completed!" -ForegroundColor Green
