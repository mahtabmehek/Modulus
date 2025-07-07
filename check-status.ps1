# Monitor Modulus LMS Deployment Status (PowerShell)

$AWS_REGION = "eu-west-2"
$CLUSTER_NAME = "modulus-cluster"
$SERVICE_NAME = "modulus-service"
$ALB_NAME = "modulus-alb"
$TARGET_GROUP_NAME = "modulus-tg"

function Write-Info { param($Message) Write-Host "INFO: $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "SUCCESS: $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "WARNING: $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "ERROR: $Message" -ForegroundColor Red }

Write-Host "STATUS CHECK: Modulus LMS Deployment Status Check" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check ECS Service
Write-Info "Checking ECS Service Status..."
try {
    $serviceStatus = aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}' --output table 2>$null
    if ($serviceStatus) {
        Write-Output $serviceStatus
    } else {
        Write-Warning "ECS Service not found - deployment may be in progress"
    }
} catch {
    Write-Warning "Could not check ECS service status"
}

# Check ALB Status
Write-Info "Checking Load Balancer..."
try {
    $albDns = aws elbv2 describe-load-balancers --names $ALB_NAME --region $AWS_REGION --query 'LoadBalancers[0].DNSName' --output text 2>$null
    if ($albDns -and $albDns -ne "None") {
        Write-Success "Load Balancer DNS: http://$albDns"
    } else {
        Write-Warning "Load Balancer not found"
    }
} catch {
    Write-Warning "Could not check Load Balancer status"
}

# Check Target Health
Write-Info "Checking Target Group Health..."
try {
    $targetGroupArn = aws elbv2 describe-target-groups --names $TARGET_GROUP_NAME --region $AWS_REGION --query 'TargetGroups[0].TargetGroupArn' --output text 2>$null
    if ($targetGroupArn -and $targetGroupArn -ne "None") {
        $targetHealth = aws elbv2 describe-target-health --target-group-arn $targetGroupArn --region $AWS_REGION --query 'TargetHealthDescriptions[*].{Target:Target.Id,Health:TargetHealth.State}' --output table 2>$null
        if ($targetHealth) {
            Write-Output $targetHealth
        } else {
            Write-Warning "No targets found in target group"
        }
    } else {
        Write-Warning "Target Group not found"
    }
} catch {
    Write-Warning "Could not check Target Group health"
}

# Check latest ECS tasks
Write-Info "Recent ECS Task Status..."
try {
    $taskArns = aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --region $AWS_REGION --query 'taskArns[0:3]' --output text 2>$null
    if ($taskArns -and $taskArns -ne "None" -and $taskArns.Trim() -ne "") {
        $taskDetails = aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $taskArns --region $AWS_REGION --query 'tasks[*].{TaskArn:taskArn,LastStatus:lastStatus,DesiredStatus:desiredStatus,CreatedAt:createdAt}' --output table 2>$null
        if ($taskDetails) {
            Write-Output $taskDetails
        }
    } else {
        Write-Warning "No tasks found"
    }
} catch {
    Write-Warning "Could not get task details"
}

Write-Host ""
Write-Info "TIPS:"
Write-Host "  - GitHub Actions workflow: https://github.com/mahtabmehek/Modulus/actions" -ForegroundColor Gray
Write-Host "  - AWS ECS Console: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION" -ForegroundColor Gray
Write-Host "  - CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/%2Fecs%2Fmodulus" -ForegroundColor Gray
