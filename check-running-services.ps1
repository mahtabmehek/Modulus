Write-Host "🔍 Checking ALL running services that could cost money..." -ForegroundColor Cyan
Write-Host "=" * 60

$region = "eu-west-2"  # Your primary region
$totalRunning = 0

# 1. EC2 Instances
Write-Host "`n💻 EC2 INSTANCES:" -ForegroundColor Yellow
$ec2Result = aws ec2 describe-instances --region $region --query 'Reservations[].Instances[?State.Name!=`terminated`].[InstanceId,State.Name,InstanceType]' --output text 2>$null
if ($ec2Result -and $ec2Result.Trim() -and $ec2Result -ne "None") {
    $instances = $ec2Result -split "`n" | Where-Object { $_.Trim() }
    foreach ($instance in $instances) {
        Write-Host "  RUNNING: $instance" -ForegroundColor Red
        $totalRunning++
    }
} else {
    Write-Host "  ✅ No EC2 instances running" -ForegroundColor Green
}

# 2. RDS Databases
Write-Host "`n🗄️  RDS DATABASES:" -ForegroundColor Yellow
$rdsResult = aws rds describe-db-instances --region $region --query 'DBInstances[?DBInstanceStatus==`available`].[DBInstanceIdentifier,DBInstanceStatus,DBInstanceClass]' --output text 2>$null
if ($rdsResult -and $rdsResult.Trim() -and $rdsResult -ne "None") {
    $databases = $rdsResult -split "`n" | Where-Object { $_.Trim() }
    foreach ($db in $databases) {
        Write-Host "  RUNNING: $db" -ForegroundColor Red
        $totalRunning++
    }
} else {
    Write-Host "  ✅ No RDS databases running" -ForegroundColor Green
}

# 3. Load Balancers
Write-Host "`n⚖️  LOAD BALANCERS:" -ForegroundColor Yellow
$albResult = aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[?State.Code==`active`].[LoadBalancerName,State.Code,Type]' --output text 2>$null
if ($albResult -and $albResult.Trim() -and $albResult -ne "None") {
    $albs = $albResult -split "`n" | Where-Object { $_.Trim() }
    foreach ($alb in $albs) {
        Write-Host "  RUNNING: $alb" -ForegroundColor Red
        $totalRunning++
    }
} else {
    Write-Host "  ✅ No load balancers active" -ForegroundColor Green
}

# 4. ECS Clusters and Services
Write-Host "`n⚙️  ECS CLUSTERS:" -ForegroundColor Yellow
$clusterResult = aws ecs list-clusters --region $region --query 'clusterArns' --output text 2>$null
if ($clusterResult -and $clusterResult.Trim() -and $clusterResult -ne "None") {
    $clusters = $clusterResult -split "`t" | Where-Object { $_.Trim() }
    foreach ($cluster in $clusters) {
        $clusterName = ($cluster -split "/")[-1]
        Write-Host "  Cluster found: $clusterName" -ForegroundColor White
        
        # Check for running services
        $serviceResult = aws ecs list-services --cluster $clusterName --region $region --query 'serviceArns' --output text 2>$null
        if ($serviceResult -and $serviceResult.Trim() -and $serviceResult -ne "None") {
            $services = $serviceResult -split "`t" | Where-Object { $_.Trim() }
            foreach ($service in $services) {
                $serviceName = ($service -split "/")[-1]
                
                # Check if service has running tasks
                $taskResult = aws ecs list-tasks --cluster $clusterName --service-name $serviceName --region $region --query 'taskArns' --output text 2>$null
                if ($taskResult -and $taskResult.Trim() -and $taskResult -ne "None") {
                    Write-Host "    🔴 RUNNING SERVICE: $serviceName with tasks" -ForegroundColor Red
                    $totalRunning++
                } else {
                    Write-Host "    ⚪ Service exists but no running tasks: $serviceName" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "    No services in cluster" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ✅ No ECS clusters found" -ForegroundColor Green
}

# 5. ECR Repositories (check for stored images)
Write-Host "`n📦 ECR REPOSITORIES:" -ForegroundColor Yellow
$ecrResult = aws ecr describe-repositories --region $region --query 'repositories[].[repositoryName,repositoryUri]' --output text 2>$null
if ($ecrResult -and $ecrResult.Trim() -and $ecrResult -ne "None") {
    $repos = $ecrResult -split "`n" | Where-Object { $_.Trim() }
    foreach ($repo in $repos) {
        $repoName = ($repo -split "`t")[0]
        # Check for images in repository
        $imageResult = aws ecr list-images --repository-name $repoName --region $region --query 'imageIds' --output text 2>$null
        if ($imageResult -and $imageResult.Trim() -and $imageResult -ne "None") {
            Write-Host "  📦 Repository with images: $repoName" -ForegroundColor Yellow
        } else {
            Write-Host "  📦 Empty repository: $repoName" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ✅ No ECR repositories found" -ForegroundColor Green
}

# 6. Lambda Functions
Write-Host "`n⚡ LAMBDA FUNCTIONS:" -ForegroundColor Yellow
$lambdaResult = aws lambda list-functions --region $region --query 'Functions[].[FunctionName,Runtime,State]' --output text 2>$null
if ($lambdaResult -and $lambdaResult.Trim() -and $lambdaResult -ne "None") {
    $functions = $lambdaResult -split "`n" | Where-Object { $_.Trim() }
    foreach ($func in $functions) {
        Write-Host "  ⚡ Function: $func" -ForegroundColor White
    }
} else {
    Write-Host "  ✅ No Lambda functions found" -ForegroundColor Green
}

# 7. S3 Buckets (check for non-empty buckets)
Write-Host "`n🪣 S3 BUCKETS:" -ForegroundColor Yellow
$s3Result = aws s3 ls 2>$null
if ($s3Result) {
    $buckets = $s3Result -split "`n" | Where-Object { $_.Trim() }
    foreach ($bucket in $buckets) {
        if ($bucket.Trim()) {
            $bucketName = ($bucket -split "\s+")[-1]
            Write-Host "  🪣 Bucket: $bucketName" -ForegroundColor White
        }
    }
} else {
    Write-Host "  ✅ No S3 buckets found" -ForegroundColor Green
}

# Summary
Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
if ($totalRunning -eq 0) {
    Write-Host "🎉 EXCELLENT! No expensive services are running!" -ForegroundColor Green
    Write-Host "💰 Your AWS costs should be MINIMAL (close to $0)" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: $totalRunning services are running!" -ForegroundColor Red
    Write-Host "💸 These services may generate charges!" -ForegroundColor Red
}
Write-Host "=" * 60 -ForegroundColor Cyan
