param(
    [string]$Region = "eu-west-2"
)

$ErrorActionPreference = "Continue"

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "Cyan" }
    }
    Write-Host "[$Status] $Message" -ForegroundColor $color
}

Write-Host "Modulus LMS Deployment Status Check" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Check Lambda function
Write-Status "Checking Lambda function..." "INFO"
try {
    $lambdaInfo = aws lambda get-function --function-name modulus-backend --region $Region | ConvertFrom-Json
    Write-Status "Lambda Function: modulus-backend found" "SUCCESS"
    Write-Status "Runtime: $($lambdaInfo.Configuration.Runtime)" "INFO"
    Write-Status "Memory: $($lambdaInfo.Configuration.MemorySize)MB" "INFO"
    Write-Status "Timeout: $($lambdaInfo.Configuration.Timeout)s" "INFO"
}
catch {
    Write-Status "Lambda Function: modulus-backend not found" "ERROR"
}

# Check API Gateway
Write-Status "Checking API Gateway..." "INFO"
try {
    $apiId = aws apigateway get-rest-apis --query "items[?name=='modulus-api'].id" --output text --region $Region
    if ($apiId -and $apiId -ne "None") {
        $apiUrl = "https://$apiId.execute-api.$Region.amazonaws.com/prod"
        Write-Status "API Gateway found: $apiUrl" "SUCCESS"
        
        # Test API health
        try {
            $healthResponse = Invoke-RestMethod -Uri "$apiUrl/api/health" -Method Get -TimeoutSec 10
            Write-Status "Health endpoint: Working" "SUCCESS"
        }
        catch {
            Write-Status "Health endpoint: Failed" "ERROR"
        }
        
        # Test API status
        try {
            $statusResponse = Invoke-RestMethod -Uri "$apiUrl/api/status" -Method Get -TimeoutSec 10
            Write-Status "Status endpoint: Working" "SUCCESS"
        }
        catch {
            Write-Status "Status endpoint: Failed" "ERROR"
        }
    }
    else {
        Write-Status "API Gateway: modulus-api not found" "ERROR"
    }
}
catch {
    Write-Status "API Gateway check failed" "ERROR"
}

# Check S3 frontend
Write-Status "Checking S3 frontend..." "INFO"
try {
    $buckets = aws s3api list-buckets --query 'Buckets[?contains(Name, `modulus-frontend`)].Name' --output text --region $Region
    if ($buckets) {
        $bucketList = $buckets.Split()
        foreach ($bucket in $bucketList) {
            if ($bucket.Trim()) {
                Write-Status "S3 Bucket found: $bucket" "SUCCESS"
                
                # Check website configuration
                try {
                    $websiteConfig = aws s3api get-bucket-website --bucket $bucket --region $Region 2>$null
                    if ($websiteConfig) {
                        $websiteUrl = "http://$bucket.s3-website.$Region.amazonaws.com"
                        Write-Status "Website URL: $websiteUrl" "SUCCESS"
                    }
                }
                catch {
                    Write-Status "Website configuration not found" "WARNING"
                }
            }
        }
    }
    else {
        Write-Status "No Modulus frontend buckets found" "ERROR"
    }
}
catch {
    Write-Status "S3 check failed" "ERROR"
}

Write-Host "" -ForegroundColor White
Write-Host "API URL: https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod" -ForegroundColor Green
Write-Host "Health Check: https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api/health" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Status "Status check completed!" "SUCCESS"
