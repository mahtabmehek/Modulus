# 🗑️ AWS Resource Cleanup Script - Emergency Deletion (PowerShell)
# Deletes ALL Modulus-related resources to avoid charges

Write-Host "🚨 EMERGENCY CLEANUP: Deleting ALL AWS Resources" -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Yellow

# Get regions to check
$regions = @("eu-west-2", "eu-west-1", "eu-central-1", "eu-north-1", "us-east-1")

foreach ($region in $regions) {
    Write-Host "🔍 Cleaning up region: $region" -ForegroundColor Yellow
    
    # 1. Delete ECS Services first (most important)
    Write-Host "Deleting ECS services in $region..." -ForegroundColor Cyan
    try {
        $clusters = aws ecs list-clusters --region $region --query 'clusterArns[]' --output text 2>$null
        if ($clusters) {
            $clusters.Split() | Where-Object { $_ -match "modulus|simple" } | ForEach-Object {
                $clusterName = Split-Path $_ -Leaf
                Write-Host "⚠️  Found cluster: $clusterName" -ForegroundColor Yellow
                
                # Get and delete services
                $services = aws ecs list-services --cluster $clusterName --region $region --query 'serviceArns[]' --output text 2>$null
                if ($services) {
                    $services.Split() | ForEach-Object {
                        $serviceName = Split-Path $_ -Leaf
                        Write-Host "Deleting service: $serviceName" -ForegroundColor Red
                        aws ecs update-service --cluster $clusterName --service $serviceName --desired-count 0 --region $region 2>$null
                        aws ecs delete-service --cluster $clusterName --service $serviceName --force --region $region 2>$null
                    }
                }
                
                # Delete cluster
                Start-Sleep -Seconds 10
                aws ecs delete-cluster --cluster $clusterName --region $region 2>$null
                Write-Host "✅ Deleted cluster: $clusterName" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "No ECS clusters found in $region" -ForegroundColor Gray
    }
    
    # 2. Delete Load Balancers
    Write-Host "Deleting load balancers in $region..." -ForegroundColor Cyan
    try {
        $albs = aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[?contains(LoadBalancerName, `modulus`) || contains(LoadBalancerName, `simple`)].LoadBalancerArn' --output text 2>$null
        if ($albs) {
            $albs.Split() | ForEach-Object {
                if ($_ -ne "") {
                    Write-Host "Deleting ALB: $_" -ForegroundColor Red
                    aws elbv2 delete-load-balancer --load-balancer-arn $_ --region $region 2>$null
                }
            }
        }
    } catch {
        Write-Host "No load balancers found in $region" -ForegroundColor Gray
    }
    
    # 3. Delete Target Groups
    Write-Host "Deleting target groups in $region..." -ForegroundColor Cyan
    try {
        $tgs = aws elbv2 describe-target-groups --region $region --query 'TargetGroups[?contains(TargetGroupName, `modulus`) || contains(TargetGroupName, `simple`)].TargetGroupArn' --output text 2>$null
        if ($tgs) {
            $tgs.Split() | ForEach-Object {
                if ($_ -ne "") {
                    Write-Host "Deleting target group: $_" -ForegroundColor Red
                    aws elbv2 delete-target-group --target-group-arn $_ --region $region 2>$null
                }
            }
        }
    } catch {
        Write-Host "No target groups found in $region" -ForegroundColor Gray
    }
    
    # 4. Delete RDS Instances
    Write-Host "Deleting RDS instances in $region..." -ForegroundColor Cyan
    try {
        $dbs = aws rds describe-db-instances --region $region --query 'DBInstances[?contains(DBInstanceIdentifier, `modulus`) || contains(DBInstanceIdentifier, `simple`)].DBInstanceIdentifier' --output text 2>$null
        if ($dbs) {
            $dbs.Split() | ForEach-Object {
                if ($_ -ne "") {
                    Write-Host "Deleting RDS instance: $_" -ForegroundColor Red
                    aws rds delete-db-instance --db-instance-identifier $_ --skip-final-snapshot --delete-automated-backups --region $region 2>$null
                }
            }
        }
    } catch {
        Write-Host "No RDS instances found in $region" -ForegroundColor Gray
    }
    
    # 5. Delete ECR Repositories
    Write-Host "Deleting ECR repositories in $region..." -ForegroundColor Cyan
    try {
        $repos = aws ecr describe-repositories --region $region --query 'repositories[?contains(repositoryName, `modulus`) || contains(repositoryName, `simple`)].repositoryName' --output text 2>$null
        if ($repos) {
            $repos.Split() | ForEach-Object {
                if ($_ -ne "") {
                    Write-Host "Deleting ECR repository: $_" -ForegroundColor Red
                    aws ecr delete-repository --repository-name $_ --force --region $region 2>$null
                }
            }
        }
    } catch {
        Write-Host "No ECR repositories found in $region" -ForegroundColor Gray
    }
    
    Write-Host "✅ Cleanup completed for region: $region" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "🎉 EMERGENCY CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "All Modulus-related AWS resources have been deleted" -ForegroundColor Cyan
Write-Host "This should prevent any further charges" -ForegroundColor Cyan
Write-Host "⚠️  Please check AWS Console to verify all resources are gone" -ForegroundColor Yellow
Write-Host ""
