# Modulus LMS - Simple Status Checker (PowerShell)
# Quick status check for all deployment components

# Configuration
$AWS_REGION = "eu-west-2"
$LAMBDA_FUNCTION = "modulus-backend"
$S3_BUCKET = "modulus-frontend-1370267358" 
$API_GATEWAY_NAME = "modulus-api"

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

Write-Status "🔍 Modulus LMS - Status Check" "Blue"
Write-Status "============================" "Blue"
Write-Host ""

# Check AWS CLI
try {
    aws sts get-caller-identity | Out-Null
    Write-Status "✅ AWS CLI configured" "Green"
} catch {
    Write-Status "❌ AWS CLI not configured" "Red"
    exit 1
}

Write-Host ""

# Check Lambda Function
Write-Status "Checking Lambda Function..." "Yellow"
try {
    $lambdaStatus = aws lambda get-function `
        --function-name $LAMBDA_FUNCTION `
        --region $AWS_REGION `
        --query 'Configuration.State' `
        --output text
    
    if ($lambdaStatus -eq "Active") {
        Write-Status "✅ Lambda Function: $LAMBDA_FUNCTION - Active" "Green"
    } else {
        Write-Status "❌ Lambda Function: $LAMBDA_FUNCTION - $lambdaStatus" "Red"
    }
} catch {
    Write-Status "❌ Lambda Function: $LAMBDA_FUNCTION - ERROR" "Red"
}

# Check S3 Bucket
Write-Host ""
Write-Status "Checking S3 Bucket..." "Yellow"
try {
    aws s3api head-bucket --bucket $S3_BUCKET --region $AWS_REGION | Out-Null
    Write-Status "✅ S3 Bucket: $S3_BUCKET - Exists" "Green"
    Write-Status "   Website URL: http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com/" "White"
} catch {
    Write-Status "❌ S3 Bucket: $S3_BUCKET - Not found" "Red"
}

# Check API Gateway
Write-Host ""
Write-Status "Checking API Gateway..." "Yellow"
try {
    $apiId = aws apigateway get-rest-apis `
        --region $AWS_REGION `
        --query "items[?name=='$API_GATEWAY_NAME'].id" `
        --output text
    
    if ($apiId -and $apiId -ne "None") {
        Write-Status "✅ API Gateway: $API_GATEWAY_NAME - Found" "Green"
        $apiUrl = "https://$apiId.execute-api.$AWS_REGION.amazonaws.com/prod"
        Write-Status "   API URL: $apiUrl" "White"
        
        # Test health endpoint
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/api/health" -Method GET -TimeoutSec 10
            Write-Status "   ✅ Health check: Passed" "Green"
        } catch {
            Write-Status "   ❌ Health check: Failed" "Red"
        }
    } else {
        Write-Status "❌ API Gateway: $API_GATEWAY_NAME - Not found" "Red"
    }
} catch {
    Write-Status "❌ API Gateway: $API_GATEWAY_NAME - ERROR" "Red"
}

Write-Host ""
Write-Status "Status check completed!" "Blue"
