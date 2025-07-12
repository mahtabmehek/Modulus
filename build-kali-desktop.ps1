# Build script for Modulus Kali Linux Hybrid Desktop (Windows PowerShell)

Write-Host "🚀 Building Modulus Kali Linux Hybrid Desktop Image" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue

# Change to docker directory
$dockerPath = Join-Path $PSScriptRoot "docker\kali-hybrid"

if (-not (Test-Path $dockerPath)) {
    Write-Host "❌ Docker directory not found: $dockerPath" -ForegroundColor Red
    exit 1
}

Set-Location $dockerPath

# Build the Docker image
Write-Host "📦 Building Docker image..." -ForegroundColor Yellow
docker build -t modulus-kali-hybrid:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

# Tag for different environments
$dateTag = Get-Date -Format "yyyyMMdd"
docker tag modulus-kali-hybrid:latest "modulus-kali-hybrid:$dateTag"

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Image Details:" -ForegroundColor Cyan
docker images | Where-Object { $_ -match "modulus-kali-hybrid" }

Write-Host ""
Write-Host "🧪 To test the image locally:" -ForegroundColor Yellow
Write-Host "docker run -d -p 6080:6080 -p 5901:5901 ``" -ForegroundColor White
Write-Host "  -e USER_ID=1000 ``" -ForegroundColor White
Write-Host "  -e LAB_ID=test ``" -ForegroundColor White
Write-Host "  -e S3_BUCKET=modulus-user-data ``" -ForegroundColor White
Write-Host "  --name kali-test ``" -ForegroundColor White
Write-Host "  modulus-kali-hybrid:latest" -ForegroundColor White
Write-Host ""
Write-Host "Then visit: http://localhost:6080/vnc.html" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 Build process completed!" -ForegroundColor Green
