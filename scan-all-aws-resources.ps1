# 🔍 AWS Resource Scanner - Check ALL running services across ALL regions
Write-Host "🔍 Scanning ALL AWS resources across ALL regions..." -ForegroundColor Cyan
Write-Host "This will show you everything that's currently running and could cost money" -ForegroundColor Yellow

$regions = @(
    "us-east-1", "us-east-2", "us-west-1", "us-west-2", 
    "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-north-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1",
    "ca-central-1", "sa-east-1", "ap-southeast-3"
)

$totalResources = 0

foreach ($region in $regions) {
    Write-Host "`n🌍 REGION: $region" -ForegroundColor Green
    Write-Host "=" * 50 -ForegroundColor Gray
    
    $regionResources = 0
    
    # EC2 Instances
    Write-Host "🖥️  EC2 INSTANCES:" -ForegroundColor Yellow
    $ec2 = aws ec2 describe-instances --region $region --query 'Reservations[].Instances[?State.Name!=`terminated`].[InstanceId,State.Name,InstanceType]' --output table 2>$null
    if ($ec2 -and $ec2 -notmatch "None" -and $ec2.Count -gt 3) {
        Write-Host $ec2
        $regionResources += ($ec2 | Select-String "i-").Count
    } else {
        Write-Host "   No EC2 instances" -ForegroundColor Gray
    }
    
    # ECS Clusters
    Write-Host "`n⚙️  ECS CLUSTERS:" -ForegroundColor Yellow
    $clusters = aws ecs list-clusters --region $region --output text 2>$null
    if ($clusters -and $clusters -ne "CLUSTERARNS" -and $clusters.Trim()) {
        $clusterList = $clusters -split "`n" | Where-Object { $_ -and $_ -ne "CLUSTERARNS" }
        foreach ($cluster in $clusterList) {
            if ($cluster.Trim()) {
                $clusterName = ($cluster -split "/")[-1]
                Write-Host "   📦 Cluster: $clusterName" -ForegroundColor White
                
                # Check services in cluster
                $services = aws ecs list-services --cluster $clusterName --region $region --output text 2>$null
                if ($services -and $services -ne "SERVICEARNS" -and $services.Trim()) {
                    $serviceList = $services -split "`n" | Where-Object { $_ -and $_ -ne "SERVICEARNS" }
                    foreach ($service in $serviceList) {
                        if ($service.Trim()) {
                            $serviceName = ($service -split "/")[-1]
                            Write-Host "      🔄 Service: $serviceName" -ForegroundColor Cyan
                            $regionResources++
                        }
                    }
                }
                $regionResources++
            }
        }
    } else {
        Write-Host "   No ECS clusters" -ForegroundColor Gray
    }
    
    # Load Balancers
    Write-Host "`n⚖️  LOAD BALANCERS:" -ForegroundColor Yellow
    $albs = aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[].[LoadBalancerName,State.Code,Type]' --output table 2>$null
    if ($albs -and $albs -notmatch "None" -and $albs.Count -gt 3) {
        Write-Host $albs
        $regionResources += ($albs | Select-String "\|").Count - 3
    } else {
        Write-Host "   No load balancers" -ForegroundColor Gray
    }
    
    # RDS Instances
    Write-Host "`n🗄️  RDS DATABASES:" -ForegroundColor Yellow
    $rds = aws rds describe-db-instances --region $region --query 'DBInstances[].[DBInstanceIdentifier,DBInstanceStatus,DBInstanceClass]' --output table 2>$null
    if ($rds -and $rds -notmatch "None" -and $rds.Count -gt 3) {
        Write-Host $rds -ForegroundColor Red  # Red because RDS is expensive
        $regionResources += ($rds | Select-String "\|").Count - 3
    } else {
        Write-Host "   No RDS databases" -ForegroundColor Gray
    }
    
    # ECR Repositories
    Write-Host "`n📦 ECR REPOSITORIES:" -ForegroundColor Yellow
    $ecr = aws ecr describe-repositories --region $region --query 'repositories[].[repositoryName,createdAt]' --output table 2>$null
    if ($ecr -and $ecr -notmatch "None" -and $ecr.Count -gt 3) {
        Write-Host $ecr
        $regionResources += ($ecr | Select-String "\|").Count - 3
    } else {
        Write-Host "   No ECR repositories" -ForegroundColor Gray
    }
    
    # S3 Buckets (only check in us-east-1 since S3 is global)
    if ($region -eq "us-east-1") {
        Write-Host "`n🪣 S3 BUCKETS (Global):" -ForegroundColor Yellow
        $s3 = aws s3 ls 2>$null
        if ($s3) {
            $buckets = $s3 -split "`n" | Where-Object { $_.Trim() }
            foreach ($bucket in $buckets) {
                if ($bucket.Trim()) {
                    $bucketName = ($bucket -split "\s+")[-1]
                    Write-Host "   🪣 $bucketName" -ForegroundColor White
                    $regionResources++
                }
            }
        } else {
            Write-Host "   No S3 buckets" -ForegroundColor Gray
        }
    }
    
    # CloudWatch Log Groups
    Write-Host "`n📊 CLOUDWATCH LOG GROUPS:" -ForegroundColor Yellow
    $logs = aws logs describe-log-groups --region $region --query 'logGroups[].[logGroupName,storedBytes]' --output table 2>$null
    if ($logs -and $logs -notmatch "None" -and $logs.Count -gt 3) {
        $logCount = ($logs | Select-String "\|").Count - 3
        Write-Host "   📊 $logCount log groups found" -ForegroundColor White
        # Show only modulus-related logs
        $modulusLogs = $logs | Select-String "modulus|ecs"
        if ($modulusLogs) {
            Write-Host $modulusLogs -ForegroundColor Cyan
        }
        $regionResources += $logCount
    } else {
        Write-Host "   No log groups" -ForegroundColor Gray
    }
    
    # Security Groups
    Write-Host "`n🔒 SECURITY GROUPS:" -ForegroundColor Yellow
    $sgs = aws ec2 describe-security-groups --region $region --query 'SecurityGroups[?GroupName!=`default`].[GroupName,GroupId]' --output table 2>$null
    if ($sgs -and $sgs -notmatch "None" -and $sgs.Count -gt 3) {
        $sgCount = ($sgs | Select-String "\|").Count - 3
        Write-Host "   🔒 $sgCount custom security groups" -ForegroundColor White
        # Show only modulus-related SGs
        $modulusSgs = $sgs | Select-String "modulus"
        if ($modulusSgs) {
            Write-Host $modulusSgs -ForegroundColor Cyan
        }
        $regionResources += $sgCount
    } else {
        Write-Host "   Only default security groups" -ForegroundColor Gray
    }
    
    Write-Host "`n📊 Region $region Total Resources: $regionResources" -ForegroundColor $(if ($regionResources -gt 0) { "Red" } else { "Green" })
    $totalResources += $regionResources
}

Write-Host "`n" + "=" * 70 -ForegroundColor Red
Write-Host "🚨 TOTAL RESOURCES ACROSS ALL REGIONS: $totalResources" -ForegroundColor Red
Write-Host "=" * 70 -ForegroundColor Red

if ($totalResources -gt 0) {
    Write-Host "`n⚠️  WARNING: You have $totalResources resources running!" -ForegroundColor Red
    Write-Host "💰 These could generate charges. Consider running cleanup if not needed." -ForegroundColor Yellow
    Write-Host "🗑️  Run: .\quick-cleanup.ps1 to delete modulus-related resources" -ForegroundColor White
} else {
    Write-Host "`n✅ Good news! No significant resources found running." -ForegroundColor Green
    Write-Host "💰 You should have minimal AWS charges." -ForegroundColor Green
}

Write-Host "`n🔍 Scan complete!" -ForegroundColor Cyan
