# AWS Service Monitor for Modulus LMS
Write-Host "AWS Service Monitor for Modulus LMS" -ForegroundColor Cyan

# Check Lambda Functions
Write-Host "`nLambda Functions:" -ForegroundColor Yellow
try {
    $functions = aws lambda list-functions --output json | ConvertFrom-Json
    $modulusFunctions = $functions.Functions | Where-Object { $_.FunctionName -like "*modulus*" }
    
    if ($modulusFunctions.Count -eq 0) {
        Write-Host "  No Modulus Lambda functions found" -ForegroundColor Gray
    } else {
        foreach ($func in $modulusFunctions) {
            $status = if ($func.State -eq "Active") { "✅" } else { "❌" }
            Write-Host "  $status $($func.FunctionName) - $($func.Runtime)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "  Failed to retrieve Lambda functions: $($_.Exception.Message)" -ForegroundColor Red
}

# Check API Gateway
Write-Host "`nAPI Gateway:" -ForegroundColor Yellow
try {
    $apis = aws apigateway get-rest-apis --output json | ConvertFrom-Json
    
    if ($apis.items.Count -eq 0) {
        Write-Host "  No API Gateways found" -ForegroundColor Gray
    } else {
        foreach ($api in $apis.items) {
            Write-Host "  ✅ $($api.name) (ID: $($api.id))" -ForegroundColor White
            $region = aws configure get region
            $endpoint = "https://$($api.id).execute-api.$region.amazonaws.com/prod"
            Write-Host "     Endpoint: $endpoint" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "  Failed to retrieve API Gateway: $($_.Exception.Message)" -ForegroundColor Red
}

# Check RDS
Write-Host "`nRDS Databases:" -ForegroundColor Yellow
try {
    $instances = aws rds describe-db-instances --output json | ConvertFrom-Json
    $clusters = aws rds describe-db-clusters --output json 2>$null | ConvertFrom-Json
    
    $found = $false
    
    if ($instances.DBInstances) {
        foreach ($instance in $instances.DBInstances) {
            $status = switch ($instance.DBInstanceStatus) {
                "available" { "✅" }
                "creating" { "🔄" }
                default { "❌" }
            }
            Write-Host "  $status $($instance.DBInstanceIdentifier) - $($instance.DBInstanceStatus)" -ForegroundColor White
            $found = $true
        }
    }
    
    if ($clusters.DBClusters) {
        foreach ($cluster in $clusters.DBClusters) {
            $status = switch ($cluster.Status) {
                "available" { "✅" }
                "creating" { "🔄" }
                default { "❌" }
            }
            Write-Host "  $status $($cluster.DBClusterIdentifier) (Aurora) - $($cluster.Status)" -ForegroundColor White
            $found = $true
        }
    }
    
    if (-not $found) {
        Write-Host "  No RDS instances or clusters found" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Failed to retrieve RDS status: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nMonitoring complete!" -ForegroundColor Green
