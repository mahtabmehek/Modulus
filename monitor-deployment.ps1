# Monitor deployment status
param(
    [string]$Service = "all"
)

Write-Host "Monitoring Modulus LMS Deployment Status..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check ALB status
Write-Host "`nApplication Load Balancer:" -ForegroundColor Yellow
try {
    $alb = aws elbv2 describe-load-balancers --names "modulus-alb" --region "eu-west-2" --query 'LoadBalancers[0].[State.Code,DNSName]' --output text 2>$null
    if ($alb) {
        $albState, $albDns = $alb -split "`t"
        Write-Host "  Status: $albState" -ForegroundColor Green
        Write-Host "  URL: http://$albDns" -ForegroundColor Green
    } else {
        Write-Host "  Status: Not Found" -ForegroundColor Red
    }
} catch {
    Write-Host "  Status: Error checking ALB" -ForegroundColor Red
}

# Check ECS Services
Write-Host "`nECS Services:" -ForegroundColor Yellow

# Frontend service
Write-Host "  Frontend Service:" -ForegroundColor White
try {
    $frontend = aws ecs describe-services --cluster "modulus-cluster" --services "modulus-frontend-service" --region "eu-west-2" --query 'services[0].[status,runningCount,desiredCount]' --output text 2>$null
    if ($frontend) {
        $frontendStatus, $frontendRunning, $frontendDesired = $frontend -split "`t"
        Write-Host "    Status: $frontendStatus ($frontendRunning/$frontendDesired running)" -ForegroundColor Green
    } else {
        Write-Host "    Status: Not Found" -ForegroundColor Red
    }
} catch {
    Write-Host "    Status: Error checking frontend service" -ForegroundColor Red
}

# Backend service
Write-Host "  Backend Service:" -ForegroundColor White
try {
    $backend = aws ecs describe-services --cluster "modulus-cluster" --services "modulus-backend-service" --region "eu-west-2" --query 'services[0].[status,runningCount,desiredCount]' --output text 2>$null
    if ($backend) {
        $backendStatus, $backendRunning, $backendDesired = $backend -split "`t"
        Write-Host "    Status: $backendStatus ($backendRunning/$backendDesired running)" -ForegroundColor Green
    } else {
        Write-Host "    Status: Not Found" -ForegroundColor Red
    }
} catch {
    Write-Host "    Status: Error checking backend service" -ForegroundColor Red
}

# Check RDS Database
Write-Host "`nRDS Database:" -ForegroundColor Yellow
try {
    $rds = aws rds describe-db-instances --db-instance-identifier "modulus-db" --region "eu-west-2" --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]' --output text 2>$null
    if ($rds) {
        $rdsStatus, $rdsEndpoint = $rds -split "`t"
        Write-Host "  Status: $rdsStatus" -ForegroundColor Green
        Write-Host "  Endpoint: $rdsEndpoint" -ForegroundColor Green
    } else {
        Write-Host "  Status: Not Found" -ForegroundColor Red
    }
} catch {
    Write-Host "  Status: Error checking RDS" -ForegroundColor Red
}

# Check CloudWatch Log Groups
Write-Host "`nCloudWatch Log Groups:" -ForegroundColor Yellow
try {
    $logGroups = aws logs describe-log-groups --log-group-name-prefix "/ecs/modulus" --region "eu-west-2" --query 'logGroups[*].logGroupName' --output text 2>$null
    if ($logGroups) {
        $logGroups -split "`t" | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Green
        }
    } else {
        Write-Host "  No log groups found" -ForegroundColor Red
    }
} catch {
    Write-Host "  Error checking log groups" -ForegroundColor Red
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Monitoring complete. Run again to refresh status." -ForegroundColor Cyan
