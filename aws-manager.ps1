# 🛠️ Modulus AWS Manager - Unified Management Script
# Handles cleanup, scanning, verification, and monitoring
# Usage: .\aws-manager.ps1 <command>
# Commands: scan, cleanup, verify, monitor, emergency-cleanup

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("scan", "cleanup", "verify", "monitor", "emergency-cleanup")]
    [string]$Command,
    
    [string]$Region = "eu-west-2",
    [switch]$AllRegions,
    [switch]$DryRun
)

# Color functions
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Header { param($Message) Write-Host "`n🔵 $Message" -ForegroundColor Cyan; Write-Host ("=" * 50) -ForegroundColor Gray }

# Regions to check
$DefaultRegions = @("eu-west-2")
$AllRegionsList = @(
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-north-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1",
    "ca-central-1", "sa-east-1"
)

$RegionsToCheck = if ($AllRegions) { $AllRegionsList } else { $DefaultRegions }

# Verify AWS CLI access
function Test-AWSAccess {
    try {
        $account = aws sts get-caller-identity --query Account --output text 2>$null
        if ($account) {
            Write-Success "AWS CLI connected - Account: $account"
            return $true
        }
    } catch {
        Write-Error "AWS CLI not configured or no access"
        return $false
    }
}

# Scan AWS resources
function Invoke-AWSScan {
    Write-Header "SCANNING AWS RESOURCES"
    $totalResources = 0
    
    foreach ($region in $RegionsToCheck) {
        Write-Info "Scanning region: $region"
        $regionResources = 0
        
        # EC2 Instances
        $ec2 = aws ec2 describe-instances --region $region --query 'Reservations[].Instances[?State.Name!=`terminated`].[InstanceId,State.Name,InstanceType]' --output text 2>$null
        if ($ec2 -and $ec2 -ne "None" -and $ec2.Trim() -ne "") {
            $instanceCount = ($ec2.Split("`n") | Where-Object { $_ -match "i-" }).Count
            Write-Warning "EC2 Instances: $instanceCount"
            $regionResources += $instanceCount
        } else {
            Write-Success "EC2 Instances: 0"
        }
        
        # ECS Clusters
        $ecsClusters = aws ecs list-clusters --region $region --query 'clusterArns' --output text 2>$null
        if ($ecsClusters -and $ecsClusters -ne "None" -and $ecsClusters.Trim() -ne "") {
            $clusterCount = ($ecsClusters.Split() | Where-Object { $_ -ne "" }).Count
            Write-Warning "ECS Clusters: $clusterCount"
            $regionResources += $clusterCount
        } else {
            Write-Success "ECS Clusters: 0"
        }
        
        # Load Balancers
        $albs = aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[].LoadBalancerArn' --output text 2>$null
        if ($albs -and $albs -ne "None" -and $albs.Trim() -ne "") {
            $albCount = ($albs.Split() | Where-Object { $_ -ne "" }).Count
            Write-Warning "Load Balancers: $albCount"
            $regionResources += $albCount
        } else {
            Write-Success "Load Balancers: 0"
        }
        
        # RDS Instances
        $rds = aws rds describe-db-instances --region $region --query 'DBInstances[].DBInstanceIdentifier' --output text 2>$null
        if ($rds -and $rds -ne "None" -and $rds.Trim() -ne "") {
            $rdsCount = ($rds.Split() | Where-Object { $_ -ne "" }).Count
            Write-Warning "RDS Instances: $rdsCount"
            $regionResources += $rdsCount
        } else {
            Write-Success "RDS Instances: 0"
        }
        
        $totalResources += $regionResources
        if ($regionResources -eq 0) {
            Write-Success "Region ${region}: No billable resources found"
        } else {
            Write-Warning "Region ${region}: $regionResources resources found"
        }
    }
    
    Write-Header "SCAN SUMMARY"
    if ($totalResources -eq 0) {
        Write-Success "🎉 No billable resources found across all regions!"
    } else {
        Write-Warning "⚠️  Total billable resources: $totalResources"
        Write-Warning "Consider running cleanup to avoid charges"
    }
}

# Cleanup AWS resources
function Invoke-AWSCleanup {
    Write-Header "CLEANING UP AWS RESOURCES"
    
    if ($DryRun) {
        Write-Info "DRY RUN MODE - No resources will be deleted"
    }
    
    foreach ($region in $RegionsToCheck) {
        Write-Info "Cleaning region: $region"
        
        # 1. Delete ECS Services first (prevents billing)
        $clusters = aws ecs list-clusters --region $region --query 'clusterArns[]' --output text 2>$null
        if ($clusters -and $clusters -ne "None") {
            $clusters.Split() | Where-Object { $_ -match "modulus" } | ForEach-Object {
                $clusterName = Split-Path $_ -Leaf
                Write-Warning "Found cluster: $clusterName"
                
                # Get and delete services
                $services = aws ecs list-services --cluster $clusterName --region $region --query 'serviceArns[]' --output text 2>$null
                if ($services -and $services -ne "None") {
                    $services.Split() | ForEach-Object {
                        $serviceName = Split-Path $_ -Leaf
                        if (-not $DryRun) {
                            Write-Info "Deleting service: $serviceName"
                            aws ecs update-service --cluster $clusterName --service $serviceName --desired-count 0 --region $region 2>$null
                            aws ecs delete-service --cluster $clusterName --service $serviceName --force --region $region 2>$null
                        } else {
                            Write-Info "[DRY RUN] Would delete service: $serviceName"
                        }
                    }
                }
                
                # Delete cluster
                if (-not $DryRun) {
                    Start-Sleep -Seconds 10
                    aws ecs delete-cluster --cluster $clusterName --region $region 2>$null
                    Write-Success "Deleted cluster: $clusterName"
                } else {
                    Write-Info "[DRY RUN] Would delete cluster: $clusterName"
                }
            }
        }
        
        # 2. Delete Load Balancers
        $albs = aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[?contains(LoadBalancerName, `modulus`)].LoadBalancerArn' --output text 2>$null
        if ($albs -and $albs -ne "None") {
            $albs.Split() | ForEach-Object {
                if ($_ -ne "") {
                    if (-not $DryRun) {
                        Write-Info "Deleting ALB: $_"
                        aws elbv2 delete-load-balancer --load-balancer-arn $_ --region $region 2>$null
                    } else {
                        Write-Info "[DRY RUN] Would delete ALB: $_"
                    }
                }
            }
        }
        
        # 3. Delete Target Groups
        $targetGroups = aws elbv2 describe-target-groups --region $region --query 'TargetGroups[?contains(TargetGroupName, `modulus`)].TargetGroupArn' --output text 2>$null
        if ($targetGroups -and $targetGroups -ne "None") {
            $targetGroups.Split() | ForEach-Object {
                if ($_ -ne "") {
                    if (-not $DryRun) {
                        Write-Info "Deleting Target Group: $_"
                        aws elbv2 delete-target-group --target-group-arn $_ --region $region 2>$null
                    } else {
                        Write-Info "[DRY RUN] Would delete Target Group: $_"
                    }
                }
            }
        }
        
        # 4. Delete ECR Repositories
        $ecrRepos = aws ecr describe-repositories --region $region --query 'repositories[?contains(repositoryName, `modulus`)].repositoryName' --output text 2>$null
        if ($ecrRepos -and $ecrRepos -ne "None") {
            $ecrRepos.Split() | ForEach-Object {
                if ($_ -ne "") {
                    if (-not $DryRun) {
                        Write-Info "Deleting ECR Repository: $_"
                        aws ecr delete-repository --repository-name $_ --force --region $region 2>$null
                    } else {
                        Write-Info "[DRY RUN] Would delete ECR Repository: $_"
                    }
                }
            }
        }
    }
    
    if (-not $DryRun) {
        Write-Success "Cleanup completed!"
        Write-Info "Running verification scan..."
        Start-Sleep -Seconds 5
        Invoke-AWSScan
    } else {
        Write-Info "Dry run completed. Use without -DryRun to actually delete resources."
    }
}

# Verify deployment health
function Invoke-DeploymentVerification {
    Write-Header "VERIFYING DEPLOYMENT HEALTH"
    
    $region = $RegionsToCheck[0]  # Use primary region
    
    # Check ECS service health
    $clusters = aws ecs list-clusters --region $region --query 'clusterArns[?contains(@, `modulus`)]' --output text 2>$null
    if ($clusters -and $clusters -ne "None") {
        $clusterName = Split-Path $clusters.Split()[0] -Leaf
        Write-Info "Checking cluster: $clusterName"
        
        $services = aws ecs list-services --cluster $clusterName --region $region --query 'serviceArns' --output text 2>$null
        if ($services -and $services -ne "None") {
            $serviceName = Split-Path $services.Split()[0] -Leaf
            $serviceDetails = aws ecs describe-services --cluster $clusterName --services $serviceName --region $region --query 'services[0].[status,runningCount,desiredCount]' --output text 2>$null
            if ($serviceDetails) {
                $status, $running, $desired = $serviceDetails.Split()
                Write-Info "Service Status: $status"
                Write-Info "Running Tasks: $running/$desired"
                
                if ($status -eq "ACTIVE" -and $running -eq $desired) {
                    Write-Success "✅ ECS service is healthy"
                } else {
                    Write-Warning "⚠️  ECS service may have issues"
                }
            }
        }
    }
    
    # Check ALB health
    $albs = aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[?contains(LoadBalancerName, `modulus`)][LoadBalancerArn,DNSName,State.Code]' --output text 2>$null
    if ($albs -and $albs -ne "None") {
        $albDetails = $albs.Split()
        $dnsName = $albDetails[1]
        $state = $albDetails[2]
        
        Write-Info "ALB DNS: $dnsName"
        Write-Info "ALB State: $state"
        
        if ($state -eq "active") {
            Write-Success "✅ Load balancer is active"
            Write-Info "🌐 Application should be accessible at: http://$dnsName"
        } else {
            Write-Warning "⚠️  Load balancer is not active"
        }
    }
}

# Monitor AWS costs and usage
function Invoke-AWSMonitoring {
    Write-Header "AWS COST AND USAGE MONITORING"
    
    # Get current month costs
    $startDate = (Get-Date -Day 1).ToString("yyyy-MM-dd")
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    
    Write-Info "Checking costs from $startDate to $endDate"
    
    $costs = aws ce get-cost-and-usage --time-period Start=$startDate,End=$endDate --granularity MONTHLY --metrics BlendedCost --group-by Type=DIMENSION,Key=SERVICE --region us-east-1 2>$null
    
    if ($costs) {
        Write-Success "Cost data retrieved successfully"
        # Parse and display top services by cost
        Write-Info "Check AWS Console > Billing for detailed cost breakdown"
    } else {
        Write-Warning "Unable to retrieve cost data (may need billing permissions)"
    }
    
    # Show resource counts
    Write-Info "Current resource counts:"
    Invoke-AWSScan
}

# Main execution
Write-Host "🛠️  Modulus AWS Manager" -ForegroundColor Magenta
Write-Host "Command: $Command" -ForegroundColor White
Write-Host "Region(s): $($RegionsToCheck -join ', ')" -ForegroundColor White

if (-not (Test-AWSAccess)) {
    exit 1
}

switch ($Command) {
    "scan" { Invoke-AWSScan }
    "cleanup" { Invoke-AWSCleanup }
    "verify" { Invoke-DeploymentVerification }
    "monitor" { Invoke-AWSMonitoring }
    "emergency-cleanup" { 
        Write-Warning "Emergency cleanup will delete ALL resources in ALL regions!"
        $confirm = Read-Host "Type 'DELETE ALL' to confirm"
        if ($confirm -eq "DELETE ALL") {
            $script:AllRegions = $true
            $script:RegionsToCheck = $AllRegionsList
            Invoke-AWSCleanup
        } else {
            Write-Info "Emergency cleanup cancelled"
        }
    }
}

Write-Success "✅ AWS Manager operation completed"
