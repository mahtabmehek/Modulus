# Lambda deployment script
Write-Host "Deploying updated Lambda function..." -ForegroundColor Green

# Navigate to backend directory
Set-Location backend

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$zipFile = "..\backend-deployment-fixed.zip"

# Remove old zip if exists
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Create zip file
Add-Type -AssemblyName System.IO.Compression.FileSystem
$compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal
$zipArchive = [System.IO.Compression.ZipFile]::Open((Resolve-Path $zipFile), [System.IO.Compression.ZipArchiveMode]::Create)

# Add all files except excluded ones
$excludePatterns = @("*.zip", "*.log", ".git*", ".env*", "README.md")
Get-ChildItem -Recurse | Where-Object { 
    $file = $_
    $shouldExclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($file.FullName -like "*$pattern*") {
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
Write-Host "Deployment package created" -ForegroundColor Green

# Go back to root directory
Set-Location ..

# Deploy to Lambda
Write-Host "Updating Lambda function..." -ForegroundColor Yellow
$result = aws lambda update-function-code --region eu-west-2 --function-name modulus-backend --zip-file "fileb://backend-deployment-fixed.zip"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Lambda function updated successfully!" -ForegroundColor Green
    
    # Wait for function to be ready
    Write-Host "Waiting for function to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "Testing updated function..." -ForegroundColor Yellow
    
    # Test seed endpoint
    try {
        $seedResponse = Invoke-RestMethod -Uri "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api/admin/seed" -Method GET
        Write-Host "SUCCESS: Seed endpoint working!" -ForegroundColor Green
        Write-Host "Users created: $($seedResponse.users.Count)" -ForegroundColor Cyan
        Write-Host "Password: $($seedResponse.password)" -ForegroundColor Yellow
    } catch {
        Write-Host "ERROR: Seed endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
    
} else {
    Write-Host "Lambda deployment failed" -ForegroundColor Red
}

Write-Host "Deployment completed!" -ForegroundColor Green
