Write-Host "AWS Resource Scanner - Checking all regions..." -ForegroundColor Cyan

$regions = @("us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1")

$totalResources = 0

foreach ($region in $regions) {
    Write-Host "`nREGION: $region" -ForegroundColor Green
    Write-Host "=" * 40
    
    $regionResources = 0
    
    # EC2 Instances
    Write-Host "EC2 Instances:" -ForegroundColor Yellow
    $ec2 = aws ec2 describe-instances --region $region --query 'Reservations[].Instances[?State.Name!=`terminated`].InstanceId' --output text 2>$null
    if ($ec2 -and $ec2.Trim() -and $ec2 -ne "None") {
        $instanceIds = $ec2 -split "`t" | Where-Object { $_.Trim() }
        foreach ($instance in $instanceIds) {
            Write-Host "  Instance: $instance" -ForegroundColor White
            $regionResources++
        }
    } else {
        Write-Host "  No EC2 instances" -ForegroundColor Gray
    }
    
    # ECS Clusters
    Write-Host "ECS Clusters:" -ForegroundColor Yellow
    $clusters = aws ecs list-clusters --region $region --query 'clusterArns' --output text 2>$null
    if ($clusters -and $clusters.Trim() -and $clusters -ne "None") {
        $clusterArns = $clusters -split "`t" | Where-Object { $_.Trim() }
        foreach ($cluster in $clusterArns) {
            $clusterName = ($cluster -split "/")[-1]
            Write-Host "  Cluster: $clusterName" -ForegroundColor White
            
            # Check services
            $services = aws ecs list-services --cluster $clusterName --region $region --query 'serviceArns' --output text 2>$null
            if ($services -and $services.Trim() -and $services -ne "None") {
                $serviceArns = $services -split "`t" | Where-Object { $_.Trim() }
                foreach ($service in $serviceArns) {
                    $serviceName = ($service -split "/")[-1]
                    Write-Host "    Service: $serviceName" -ForegroundColor Cyan
                    $regionResources++
                }
            }
            $regionResources++
        }
    } else {
        Write-Host "  No ECS clusters" -ForegroundColor Gray
    }
    
    # Load Balancers
    Write-Host "Load Balancers:" -ForegroundColor Yellow
    $albs = aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[].LoadBalancerName' --output text 2>$null
    if ($albs -and $albs.Trim() -and $albs -ne "None") {
        $albNames = $albs -split "`t" | Where-Object { $_.Trim() }
        foreach ($alb in $albNames) {
            Write-Host "  Load Balancer: $alb" -ForegroundColor White
            $regionResources++
        }
    } else {
        Write-Host "  No load balancers" -ForegroundColor Gray
    }
    
    # RDS Databases
    Write-Host "RDS Databases:" -ForegroundColor Yellow
    $rds = aws rds describe-db-instances --region $region --query 'DBInstances[].DBInstanceIdentifier' --output text 2>$null
    if ($rds -and $rds.Trim() -and $rds -ne "None") {
        $dbIds = $rds -split "`t" | Where-Object { $_.Trim() }
        foreach ($db in $dbIds) {
            Write-Host "  Database: $db" -ForegroundColor Red
            $regionResources++
        }
    } else {
        Write-Host "  No RDS databases" -ForegroundColor Gray
    }
    
    # ECR Repositories
    Write-Host "ECR Repositories:" -ForegroundColor Yellow
    $ecr = aws ecr describe-repositories --region $region --query 'repositories[].repositoryName' --output text 2>$null
    if ($ecr -and $ecr.Trim() -and $ecr -ne "None") {
        $repoNames = $ecr -split "`t" | Where-Object { $_.Trim() }
        foreach ($repo in $repoNames) {
            Write-Host "  Repository: $repo" -ForegroundColor White
            $regionResources++
        }
    } else {
        Write-Host "  No ECR repositories" -ForegroundColor Gray
    }
    
    Write-Host "Region $region Total: $regionResources resources" -ForegroundColor $(if ($regionResources -gt 0) { "Red" } else { "Green" })
    $totalResources += $regionResources
}

# Check S3 buckets (global)
Write-Host "`nS3 Buckets (Global):" -ForegroundColor Yellow
$s3 = aws s3 ls 2>$null
if ($s3) {
    $buckets = $s3 -split "`n" | Where-Object { $_.Trim() }
    foreach ($bucket in $buckets) {
        if ($bucket.Trim()) {
            $bucketName = ($bucket -split "\s+")[-1]
            Write-Host "  Bucket: $bucketName" -ForegroundColor White
            $totalResources++
        }
    }
} else {
    Write-Host "  No S3 buckets" -ForegroundColor Gray
}

Write-Host "`n" + "=" * 50 -ForegroundColor Red
Write-Host "TOTAL RESOURCES ACROSS ALL REGIONS: $totalResources" -ForegroundColor Red
Write-Host "=" * 50 -ForegroundColor Red

if ($totalResources -gt 0) {
    Write-Host "`nWARNING: You have $totalResources resources running!" -ForegroundColor Red
    Write-Host "These could generate charges. Run cleanup if not needed." -ForegroundColor Yellow
} else {
    Write-Host "`nGood news! No significant resources found." -ForegroundColor Green
    Write-Host "You should have minimal AWS charges." -ForegroundColor Green
}
