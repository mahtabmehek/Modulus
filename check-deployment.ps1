# PowerShell script to check deployment status

Write-Host "=== MODULUS DEPLOYMENT STATUS CHECK ===" -ForegroundColor Cyan
Write-Host

# Function to run AWS CLI and handle output
function Get-AWSOutput {
    param($Command)
    try {
        $result = Invoke-Expression $Command 2>$null
        return $result
    } catch {
        return "ERROR"
    }
}

Write-Host "1. Checking ECS Service..." -ForegroundColor Yellow
$runningCount = Get-AWSOutput "aws ecs describe-services --cluster modulus-cluster --services modulus-service --region eu-west-2 --query 'services[0].runningCount' --output text"
$desiredCount = Get-AWSOutput "aws ecs describe-services --cluster modulus-cluster --services modulus-service --region eu-west-2 --query 'services[0].desiredCount' --output text"
$serviceStatus = Get-AWSOutput "aws ecs describe-services --cluster modulus-cluster --services modulus-service --region eu-west-2 --query 'services[0].status' --output text"

Write-Host "Service Status: $serviceStatus"
Write-Host "Running Tasks: $runningCount/$desiredCount"

Write-Host "2. Checking Load Balancer..." -ForegroundColor Yellow
$albDNS = Get-AWSOutput "aws elbv2 describe-load-balancers --region eu-west-2 --query 'LoadBalancers[0].DNSName' --output text"
$albState = Get-AWSOutput "aws elbv2 describe-load-balancers --region eu-west-2 --query 'LoadBalancers[0].State.Code' --output text"

Write-Host "ALB DNS: $albDNS"
Write-Host "ALB State: $albState"

Write-Host "3. Application URL:" -ForegroundColor Green
if ($albDNS -ne "ERROR" -and $albDNS -ne "None" -and $albDNS.Trim() -ne "") {
    Write-Host "🌐 http://$albDNS" -ForegroundColor Green
    Write-Host "Try accessing this URL in your browser" -ForegroundColor White
} else {
    Write-Host "❌ No load balancer found" -ForegroundColor Red
}

Write-Host "4. Troubleshooting Info:" -ForegroundColor Yellow
if ($runningCount -eq "0") {
    Write-Host "❌ No tasks running - checking recent task failures..." -ForegroundColor Red
    
    # Get stopped tasks to see why they failed
    Write-Host "Checking stopped tasks..."
    $stoppedTasks = Get-AWSOutput "aws ecs list-tasks --cluster modulus-cluster --desired-status STOPPED --region eu-west-2 --query 'taskArns[0]' --output text"
    if ($stoppedTasks -ne "ERROR" -and $stoppedTasks -ne "None") {
        Write-Host "Recent stopped task: $stoppedTasks"
        Write-Host "Checking task details..."
        $taskDetails = Get-AWSOutput "aws ecs describe-tasks --cluster modulus-cluster --tasks $stoppedTasks --region eu-west-2 --query 'tasks[0].stoppedReason' --output text"
        Write-Host "Stop reason: $taskDetails"
    }
} elseif ($runningCount -gt 0) {
    Write-Host "✅ Tasks are running - checking health..." -ForegroundColor Green
}

Write-Host "`n=== END STATUS CHECK ===" -ForegroundColor Cyan
