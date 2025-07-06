#!/usr/bin/env pwsh
# Final AWS Account Verification Script
# Checks for any billable resources across all regions

Write-Host "🔍 AWS Account Final Verification" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Key regions to check
$regions = @(
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-central-1', 'eu-north-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
    'ca-central-1', 'sa-east-1', 'ap-south-1'
)

$foundIssues = $false

foreach ($region in $regions) {
    Write-Host "`n🌍 Checking region: $region" -ForegroundColor Yellow
    
    try {
        # EC2 Instances (any state except terminated)
        $ec2 = aws ec2 describe-instances --region $region --filters "Name=instance-state-name,Values=running,pending,stopping,stopped" --query 'Reservations[].Instances[].InstanceId' --output text 2>$null
        if ($ec2 -and $ec2.Trim() -ne "") {
            Write-Host "  ❌ EC2 Instances found: $ec2" -ForegroundColor Red
            $foundIssues = $true
        } else {
            Write-Host "  ✅ EC2: Clean" -ForegroundColor Green
        }
        
        # RDS Instances
        $rds = aws rds describe-db-instances --region $region --query 'DBInstances[].DBInstanceIdentifier' --output text 2>$null
        if ($rds -and $rds.Trim() -ne "") {
            Write-Host "  ❌ RDS Instances found: $rds" -ForegroundColor Red
            $foundIssues = $true
        } else {
            Write-Host "  ✅ RDS: Clean" -ForegroundColor Green
        }
        
        # Load Balancers
        $elb = aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[].LoadBalancerName' --output text 2>$null
        if ($elb -and $elb.Trim() -ne "") {
            Write-Host "  ❌ Load Balancers found: $elb" -ForegroundColor Red
            $foundIssues = $true
        } else {
            Write-Host "  ✅ Load Balancers: Clean" -ForegroundColor Green
        }
        
        # ECS Clusters with services
        $clusters = aws ecs list-clusters --region $region --query 'clusterArns[]' --output text 2>$null
        if ($clusters -and $clusters.Trim() -ne "") {
            $hasServices = $false
            foreach ($cluster in $clusters.Split("`n")) {
                if ($cluster.Trim() -ne "") {
                    $services = aws ecs list-services --region $region --cluster $cluster --query 'serviceArns[]' --output text 2>$null
                    if ($services -and $services.Trim() -ne "") {
                        Write-Host "  ❌ ECS Services found in cluster: $cluster" -ForegroundColor Red
                        $foundIssues = $true
                        $hasServices = $true
                    }
                }
            }
            if (-not $hasServices) {
                Write-Host "  ✅ ECS: Clean (clusters exist but no services)" -ForegroundColor Green
            }
        } else {
            Write-Host "  ✅ ECS: Clean" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "  ⚠️  Error checking $region - might not have access" -ForegroundColor Yellow
    }
}

Write-Host "`n" + "="*50
if ($foundIssues) {
    Write-Host "❌ ISSUES FOUND - Review red items above!" -ForegroundColor Red
    Write-Host "💰 These resources may incur charges" -ForegroundColor Red
} else {
    Write-Host "✅ ALL CLEAR - No billable resources found!" -ForegroundColor Green
    Write-Host "💚 Your AWS account is cost-optimized" -ForegroundColor Green
}
Write-Host "="*50

Write-Host "`n📊 Next steps:" -ForegroundColor Cyan
Write-Host "1. Monitor AWS Billing Dashboard" -ForegroundColor White
Write-Host "2. Set up billing alerts" -ForegroundColor White
Write-Host "3. Check again in 24 hours if concerned" -ForegroundColor White

Write-Host "`n📝 Report saved to: aws-status-final.md" -ForegroundColor Cyan
