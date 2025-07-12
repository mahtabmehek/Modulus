#!/usr/bin/env powershell

# Modulus LMS - Multi-Region Resource Scanner and Cleanup
# Scans all AWS regions for Modulus-related resources

param(
    [switch]$DryRun = $true,
    [switch]$Delete = $false
)

$regions = @(
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-north-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1",
    "ca-central-1", "sa-east-1"
)

$currentRegion = "eu-west-2"  # Our current production region
$resourcesToKeep = @()
$resourcesToDelete = @()

Write-Host "🔍 Scanning all AWS regions for Modulus resources..." -ForegroundColor Cyan
Write-Host "Production region: $currentRegion" -ForegroundColor Green
Write-Host ""

foreach ($region in $regions) {
    Write-Host "=== Region: $region ===" -ForegroundColor Yellow
    
    # Check Lambda functions
    try {
        $lambdas = aws lambda list-functions --region $region --query "Functions[?contains(FunctionName, 'modulus')].{Name:FunctionName,Runtime:Runtime,LastModified:LastModified}" --output json 2>$null | ConvertFrom-Json
        if ($lambdas -and $lambdas.Count -gt 0) {
            foreach ($lambda in $lambdas) {
                $resource = @{
                    Type = "Lambda"
                    Region = $region
                    Name = $lambda.Name
                    Details = "Runtime: $($lambda.Runtime), Modified: $($lambda.LastModified)"
                    Keep = ($region -eq $currentRegion)
                }
                if ($resource.Keep) {
                    $resourcesToKeep += $resource
                    Write-Host "  ✅ Lambda: $($lambda.Name) (KEEP - Production)" -ForegroundColor Green
                } else {
                    $resourcesToDelete += $resource
                    Write-Host "  ❌ Lambda: $($lambda.Name) (DELETE)" -ForegroundColor Red
                }
            }
        }
    } catch {
        Write-Host "  ⚠️  Error checking Lambda: $($_.Exception.Message)" -ForegroundColor Gray
    }
    
    # Check S3 buckets (note: S3 bucket names are global, but we check each region)
    if ($region -eq "us-east-1") {  # S3 API defaults to us-east-1
        try {
            $buckets = aws s3api list-buckets --query "Buckets[?contains(Name, 'modulus')].{Name:Name,CreationDate:CreationDate}" --output json 2>$null | ConvertFrom-Json
            if ($buckets -and $buckets.Count -gt 0) {
                foreach ($bucket in $buckets) {
                    # Check bucket region
                    try {
                        $bucketRegion = aws s3api get-bucket-location --bucket $bucket.Name --query "LocationConstraint" --output text 2>$null
                        if (-not $bucketRegion -or $bucketRegion -eq "null") { $bucketRegion = "us-east-1" }
                        
                        $resource = @{
                            Type = "S3"
                            Region = $bucketRegion
                            Name = $bucket.Name
                            Details = "Created: $($bucket.CreationDate)"
                            Keep = ($bucketRegion -eq $currentRegion)
                        }
                        if ($resource.Keep) {
                            $resourcesToKeep += $resource
                            Write-Host "  ✅ S3: $($bucket.Name) in $bucketRegion (KEEP - Production)" -ForegroundColor Green
                        } else {
                            $resourcesToDelete += $resource
                            Write-Host "  ❌ S3: $($bucket.Name) in $bucketRegion (DELETE)" -ForegroundColor Red
                        }
                    } catch {
                        Write-Host "  ⚠️  Could not determine region for bucket: $($bucket.Name)" -ForegroundColor Gray
                    }
                }
            }
        } catch {
            Write-Host "  ⚠️  Error checking S3: $($_.Exception.Message)" -ForegroundColor Gray
        }
    }
    
    # Check API Gateway
    try {
        $apis = aws apigateway get-rest-apis --region $region --query "items[?contains(name, 'modulus')].{Id:id,Name:name,CreatedDate:createdDate}" --output json 2>$null | ConvertFrom-Json
        if ($apis -and $apis.Count -gt 0) {
            foreach ($api in $apis) {
                $resource = @{
                    Type = "API Gateway"
                    Region = $region
                    Name = "$($api.Name) ($($api.Id))"
                    Details = "Created: $($api.CreatedDate)"
                    Keep = ($region -eq $currentRegion)
                }
                if ($resource.Keep) {
                    $resourcesToKeep += $resource
                    Write-Host "  ✅ API Gateway: $($api.Name) (KEEP - Production)" -ForegroundColor Green
                } else {
                    $resourcesToDelete += $resource
                    Write-Host "  ❌ API Gateway: $($api.Name) (DELETE)" -ForegroundColor Red
                }
            }
        }
    } catch {
        Write-Host "  ⚠️  Error checking API Gateway: $($_.Exception.Message)" -ForegroundColor Gray
    }
    
    # Check CloudFormation stacks
    try {
        $stacks = aws cloudformation list-stacks --region $region --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query "StackSummaries[?contains(StackName, 'modulus')].{Name:StackName,Status:StackStatus,CreationTime:CreationTime}" --output json 2>$null | ConvertFrom-Json
        if ($stacks -and $stacks.Count -gt 0) {
            foreach ($stack in $stacks) {
                $resource = @{
                    Type = "CloudFormation"
                    Region = $region
                    Name = $stack.Name
                    Details = "Status: $($stack.Status), Created: $($stack.CreationTime)"
                    Keep = ($region -eq $currentRegion)
                }
                if ($resource.Keep) {
                    $resourcesToKeep += $resource
                    Write-Host "  ✅ CloudFormation: $($stack.Name) (KEEP - Production)" -ForegroundColor Green
                } else {
                    $resourcesToDelete += $resource
                    Write-Host "  ❌ CloudFormation: $($stack.Name) (DELETE)" -ForegroundColor Red
                }
            }
        }
    } catch {
        Write-Host "  ⚠️  Error checking CloudFormation: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📊 SCAN SUMMARY" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resources to KEEP (Production - $currentRegion):" -ForegroundColor Green
$resourcesToKeep | ForEach-Object { Write-Host "  ✅ $($_.Type): $($_.Name) in $($_.Region)" -ForegroundColor Green }

Write-Host ""
Write-Host "Resources to DELETE:" -ForegroundColor Red
$resourcesToDelete | ForEach-Object { Write-Host "  ❌ $($_.Type): $($_.Name) in $($_.Region)" -ForegroundColor Red }

Write-Host ""
Write-Host "Total resources found: $($resourcesToKeep.Count + $resourcesToDelete.Count)" -ForegroundColor White
Write-Host "  - To keep: $($resourcesToKeep.Count)" -ForegroundColor Green
Write-Host "  - To delete: $($resourcesToDelete.Count)" -ForegroundColor Red

if ($resourcesToDelete.Count -gt 0) {
    Write-Host ""
    if ($Delete -and -not $DryRun) {
        Write-Host "⚠️  PROCEEDING WITH DELETION..." -ForegroundColor Yellow
        
        foreach ($resource in $resourcesToDelete) {
            Write-Host "Deleting $($resource.Type): $($resource.Name) in $($resource.Region)..." -ForegroundColor Yellow
            
            try {
                switch ($resource.Type) {
                    "Lambda" {
                        aws lambda delete-function --function-name $resource.Name --region $resource.Region
                        Write-Host "  ✅ Deleted Lambda: $($resource.Name)" -ForegroundColor Green
                    }
                    "S3" {
                        # Empty bucket first
                        aws s3 rm s3://$($resource.Name) --recursive
                        aws s3api delete-bucket --bucket $resource.Name --region $resource.Region
                        Write-Host "  ✅ Deleted S3: $($resource.Name)" -ForegroundColor Green
                    }
                    "API Gateway" {
                        $apiId = $resource.Name -replace ".*\(([^)]+)\).*", '$1'
                        aws apigateway delete-rest-api --rest-api-id $apiId --region $resource.Region
                        Write-Host "  ✅ Deleted API Gateway: $($resource.Name)" -ForegroundColor Green
                    }
                    "CloudFormation" {
                        aws cloudformation delete-stack --stack-name $resource.Name --region $resource.Region
                        Write-Host "  ✅ Deleting CloudFormation: $($resource.Name) (async)" -ForegroundColor Green
                    }
                }
            } catch {
                Write-Host "  ❌ Error deleting $($resource.Type): $($resource.Name) - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "🧹 Cleanup completed!" -ForegroundColor Green
    } else {
        Write-Host "🔍 DRY RUN MODE - No resources will be deleted" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To actually delete these resources, run:" -ForegroundColor White
        Write-Host "  .\cleanup-scan-all-regions.ps1 -Delete -DryRun:`$false" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "✅ No unnecessary resources found to delete!" -ForegroundColor Green
}
