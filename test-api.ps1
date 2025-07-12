# Simple API test script
Write-Host "🧪 Testing Modulus Backend API" -ForegroundColor Green

$API_URL = "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"

function Test-APIEndpoint {
    param(
        [string]$endpoint,
        [string]$description
    )
    
    Write-Host "`nTesting $description..." -ForegroundColor Yellow
    $fullUrl = "$API_URL$endpoint"
    Write-Host "URL: $fullUrl"
    
    try {
        $response = Invoke-RestMethod -Uri $fullUrl -Method GET -TimeoutSec 30
        Write-Host "✅ Success" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 3
    }
    catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
        }
    }
}

# Test endpoints
Test-APIEndpoint "/health" "Health Check"
Test-APIEndpoint "/status" "API Status"
Test-APIEndpoint "/admin/seed" "Admin Seed Endpoint"

Write-Host "`n🎯 API Testing Complete" -ForegroundColor Green
