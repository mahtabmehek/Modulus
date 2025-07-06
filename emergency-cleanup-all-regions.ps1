# 🚨 EMERGENCY: Delete ALL AWS Resources Across ALL Regions
# This script will delete EVERYTHING to prevent charges

Write-Host "🚨 EMERGENCY CLEANUP: Deleting ALL AWS resources across ALL regions!" -ForegroundColor Red
Write-Host "This will delete EVERYTHING Modulus-related to prevent charges!" -ForegroundColor Yellow

# Get all AWS regions
$regions = @(
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-north-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1",
    "ca-central-1", "sa-east-1"
)

foreach ($region in $regions) {
    Write-Host "🗑️ Cleaning region: $region" -ForegroundColor Cyan
    
    try {
        # Delete ECS Services (must be done first)
        Write-Host "  Deleting ECS services in $region..."
        $clusters = aws ecs list-clusters --region $region --query 'clusterArns' --output text 2>$null
        if ($clusters -and $clusters -ne "None") {
            $clusters -split "`t" | ForEach-Object {
                if ($_ -match "modulus") {
                    $clusterName = ($_ -split "/")[-1]
                    $services = aws ecs list-services --cluster $clusterName --region $region --query 'serviceArns' --output text 2>$null
                    if ($services -and $services -ne "None") {
                        $services -split "`t" | ForEach-Object {
                            $serviceName = ($_ -split "/")[-1]
                            aws ecs delete-service --cluster $clusterName --service $serviceName --force --region $region 2>$null
                            Write-Host "    Deleted service: $serviceName" -ForegroundColor Green
                        }
                    }
                }
            }
        }

        # Wait a bit for services to delete
        Start-Sleep -Seconds 10

        # Delete Load Balancers
        Write-Host "  Deleting Load Balancers in $region..."
        $albs = aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[?contains(LoadBalancerName, `modulus`)].LoadBalancerArn' --output text 2>$null
        if ($albs -and $albs -ne "None") {
            $albs -split "`t" | ForEach-Object {
                aws elbv2 delete-load-balancer --load-balancer-arn $_ --region $region 2>$null
                Write-Host "    Deleted ALB: $_" -ForegroundColor Green
            }
        }

        # Delete Target Groups
        Write-Host "  Deleting Target Groups in $region..."
        $tgs = aws elbv2 describe-target-groups --region $region --query 'TargetGroups[?contains(TargetGroupName, `modulus`)].TargetGroupArn' --output text 2>$null
        if ($tgs -and $tgs -ne "None") {
            $tgs -split "`t" | ForEach-Object {
                aws elbv2 delete-target-group --target-group-arn $_ --region $region 2>$null
                Write-Host "    Deleted Target Group: $_" -ForegroundColor Green
            }
        }

        # Delete ECS Clusters
        Write-Host "  Deleting ECS Clusters in $region..."
        $clusters = aws ecs list-clusters --region $region --query 'clusterArns' --output text 2>$null
        if ($clusters -and $clusters -ne "None") {
            $clusters -split "`t" | ForEach-Object {
                if ($_ -match "modulus") {
                    $clusterName = ($_ -split "/")[-1]
                    aws ecs delete-cluster --cluster $clusterName --region $region 2>$null
                    Write-Host "    Deleted cluster: $clusterName" -ForegroundColor Green
                }
            }
        }

        # Delete ECR Repositories
        Write-Host "  Deleting ECR Repositories in $region..."
        $repos = aws ecr describe-repositories --region $region --query 'repositories[?contains(repositoryName, `modulus`)].repositoryName' --output text 2>$null
        if ($repos -and $repos -ne "None") {
            $repos -split "`t" | ForEach-Object {
                aws ecr delete-repository --repository-name $_ --force --region $region 2>$null
                Write-Host "    Deleted ECR repo: $_" -ForegroundColor Green
            }
        }

        # Delete RDS Instances
        Write-Host "  Deleting RDS Instances in $region..."
        $dbs = aws rds describe-db-instances --region $region --query 'DBInstances[?contains(DBInstanceIdentifier, `modulus`)].DBInstanceIdentifier' --output text 2>$null
        if ($dbs -and $dbs -ne "None") {
            $dbs -split "`t" | ForEach-Object {
                aws rds delete-db-instance --db-instance-identifier $_ --skip-final-snapshot --region $region 2>$null
                Write-Host "    Deleted RDS: $_" -ForegroundColor Green
            }
        }

        # Delete Security Groups (do this last)
        Write-Host "  Deleting Security Groups in $region..."
        $sgs = aws ec2 describe-security-groups --region $region --query 'SecurityGroups[?contains(GroupName, `modulus`)].GroupId' --output text 2>$null
        if ($sgs -and $sgs -ne "None") {
            $sgs -split "`t" | ForEach-Object {
                aws ec2 delete-security-group --group-id $_ --region $region 2>$null
                Write-Host "    Deleted Security Group: $_" -ForegroundColor Green
            }
        }

        # Delete CloudWatch Log Groups
        Write-Host "  Deleting CloudWatch Log Groups in $region..."
        $logs = aws logs describe-log-groups --region $region --query 'logGroups[?contains(logGroupName, `modulus`) || contains(logGroupName, `/ecs/`)].logGroupName' --output text 2>$null
        if ($logs -and $logs -ne "None") {
            $logs -split "`t" | ForEach-Object {
                aws logs delete-log-group --log-group-name $_ --region $region 2>$null
                Write-Host "    Deleted Log Group: $_" -ForegroundColor Green
            }
        }

        # Delete S3 Buckets (if any)
        if ($region -eq "us-east-1") {  # S3 is global but we'll check from us-east-1
            Write-Host "  Deleting S3 Buckets..."
            $buckets = aws s3 ls | Select-String "modulus"
            if ($buckets) {
                $buckets | ForEach-Object {
                    $bucketName = ($_ -split "\s+")[-1]
                    aws s3 rb s3://$bucketName --force 2>$null
                    Write-Host "    Deleted S3 bucket: $bucketName" -ForegroundColor Green
                }
            }
        }

        Write-Host "  ✅ Completed cleanup for $region" -ForegroundColor Green

    } catch {
        Write-Host "  ⚠️ Error in $region`: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 EMERGENCY CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "💰 All Modulus resources should be deleted to prevent charges" -ForegroundColor Green
Write-Host "🔍 Please check AWS Console to verify all resources are gone" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️ If you see any remaining resources, delete them manually:" -ForegroundColor Red
Write-Host "1. Go to AWS Console" -ForegroundColor White
Write-Host "2. Check each region for leftover resources" -ForegroundColor White
Write-Host "3. Delete anything with 'modulus' in the name" -ForegroundColor White
