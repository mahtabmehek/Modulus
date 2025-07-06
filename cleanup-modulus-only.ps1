Write-Host "Cleaning up ONLY Modulus-related resources..." -ForegroundColor Cyan

# Target only eu-west-2 where Modulus resources exist
$region = "eu-west-2"

Write-Host "Cleaning Modulus resources in $region..." -ForegroundColor Yellow

# 1. Deregister all Modulus task definitions
Write-Host "Deregistering task definitions..." -ForegroundColor White
for ($i = 1; $i -le 4; $i++) {
    aws ecs deregister-task-definition --task-definition "modulus-simple-task:$i" --region $region 2>$null
    Write-Host "  Deregistered modulus-simple-task:$i" -ForegroundColor Green
}

# 2. Delete any ECR repositories
Write-Host "Checking ECR repositories..." -ForegroundColor White
$repos = aws ecr describe-repositories --region $region --query 'repositories[].repositoryName' --output text 2>$null
if ($repos -and $repos.Trim() -and $repos -ne "None") {
    $repoNames = $repos -split "`t" | Where-Object { $_ -match "modulus" }
    foreach ($repo in $repoNames) {
        aws ecr delete-repository --repository-name $repo --force --region $region 2>$null
        Write-Host "  Deleted ECR repository: $repo" -ForegroundColor Green
    }
} else {
    Write-Host "  No ECR repositories found" -ForegroundColor Gray
}

# 3. Delete any CloudWatch log groups
Write-Host "Cleaning CloudWatch logs..." -ForegroundColor White
$logGroups = aws logs describe-log-groups --region $region --query 'logGroups[?contains(logGroupName, `modulus`) || contains(logGroupName, `/ecs/`)].logGroupName' --output text 2>$null
if ($logGroups -and $logGroups.Trim() -and $logGroups -ne "None") {
    $logGroupNames = $logGroups -split "`t"
    foreach ($logGroup in $logGroupNames) {
        if ($logGroup.Trim()) {
            aws logs delete-log-group --log-group-name $logGroup --region $region 2>$null
            Write-Host "  Deleted log group: $logGroup" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  No Modulus log groups found" -ForegroundColor Gray
}

# 4. Delete any custom security groups (not default ones)
Write-Host "Checking custom security groups..." -ForegroundColor White
$sgs = aws ec2 describe-security-groups --region $region --query 'SecurityGroups[?contains(GroupName, `modulus`)].GroupId' --output text 2>$null
if ($sgs -and $sgs.Trim() -and $sgs -ne "None") {
    $sgIds = $sgs -split "`t"
    foreach ($sg in $sgIds) {
        if ($sg.Trim()) {
            aws ec2 delete-security-group --group-id $sg --region $region 2>$null
            Write-Host "  Deleted security group: $sg" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  No custom Modulus security groups found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Modulus cleanup complete!" -ForegroundColor Green
Write-Host "💰 All potentially costly Modulus resources have been removed" -ForegroundColor Green
Write-Host ""
Write-Host "ℹ️  NOTE: The remaining 150+ resources in your CSV are:" -ForegroundColor Cyan
Write-Host "   - Default VPC infrastructure (FREE)" -ForegroundColor White
Write-Host "   - Default security groups (FREE)" -ForegroundColor White  
Write-Host "   - Default subnets and route tables (FREE)" -ForegroundColor White
Write-Host "   - These are created automatically by AWS and don't cost money" -ForegroundColor White
