Write-Host "EMERGENCY CLEANUP: Deleting ALL AWS resources!" -ForegroundColor Red

$regions = @("us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1")

foreach ($region in $regions) {
    Write-Host "Cleaning region: $region" -ForegroundColor Cyan
    
    # Delete ECS Services first
    aws ecs list-clusters --region $region --query 'clusterArns' --output text 2>$null | ForEach-Object {
        if ($_ -match "modulus") {
            $clusterName = ($_ -split "/")[-1]
            aws ecs list-services --cluster $clusterName --region $region --query 'serviceArns' --output text 2>$null | ForEach-Object {
                $serviceName = ($_ -split "/")[-1]
                aws ecs delete-service --cluster $clusterName --service $serviceName --force --region $region 2>$null
                Write-Host "  Deleted service: $serviceName"
            }
        }
    }
    
    Start-Sleep -Seconds 5
    
    # Delete Load Balancers
    aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[].LoadBalancerArn' --output text 2>$null | ForEach-Object {
        if ($_ -match "modulus") {
            aws elbv2 delete-load-balancer --load-balancer-arn $_ --region $region 2>$null
            Write-Host "  Deleted ALB: $_"
        }
    }
    
    # Delete Target Groups
    aws elbv2 describe-target-groups --region $region --query 'TargetGroups[].TargetGroupArn' --output text 2>$null | ForEach-Object {
        if ($_ -match "modulus") {
            aws elbv2 delete-target-group --target-group-arn $_ --region $region 2>$null
            Write-Host "  Deleted TG: $_"
        }
    }
    
    # Delete ECS Clusters
    aws ecs list-clusters --region $region --query 'clusterArns' --output text 2>$null | ForEach-Object {
        if ($_ -match "modulus") {
            $clusterName = ($_ -split "/")[-1]
            aws ecs delete-cluster --cluster $clusterName --region $region 2>$null
            Write-Host "  Deleted cluster: $clusterName"
        }
    }
    
    # Delete ECR Repositories
    aws ecr describe-repositories --region $region --query 'repositories[].repositoryName' --output text 2>$null | ForEach-Object {
        if ($_ -match "modulus") {
            aws ecr delete-repository --repository-name $_ --force --region $region 2>$null
            Write-Host "  Deleted ECR: $_"
        }
    }
    
    Write-Host "Completed: $region" -ForegroundColor Green
}

Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
