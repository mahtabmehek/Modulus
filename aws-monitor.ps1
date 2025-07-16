# AWS Service Monitor for Modulus LMS
# This script monitors the health and status of AWS services

param(
    [switch]$Lambda,
    [switch]$ApiGateway,
    [switch]$RDS,
    [switch]$All,
    [switch]$Detailed
)

Write-Host "🔍 Modulus LMS - AWS Service Monitor" -ForegroundColor Cyan

function Get-LambdaStatus {
    Write-Host "`n🔧 Lambda Functions:" -ForegroundColor Yellow
    try {
        $functions = aws lambda list-functions --output json | ConvertFrom-Json
        $modulusFunctions = $functions.Functions | Where-Object { $_.FunctionName -like "*modulus*" -or $_.FunctionName -like "*lms*" }
        
        if ($modulusFunctions.Count -eq 0) {
            Write-Host "   ℹ️  No Modulus-related Lambda functions found" -ForegroundColor Gray
            return
        }
        
        foreach ($func in $modulusFunctions) {
            $status = if ($func.State -eq "Active") { "✅" } else { "❌" }
            Write-Host "   $status $($func.FunctionName)" -ForegroundColor White
            
            if ($Detailed) {
                Write-Host "      Runtime: $($func.Runtime)" -ForegroundColor Gray
                Write-Host "      Memory: $($func.MemorySize)MB" -ForegroundColor Gray
                Write-Host "      Timeout: $($func.Timeout)s" -ForegroundColor Gray
                Write-Host "      Last Modified: $($func.LastModified)" -ForegroundColor Gray
                
                # Get recent invocations
                try {
                    $endTime = Get-Date
                    $startTime = $endTime.AddHours(-1)
                    $invocations = aws logs filter-log-events --log-group-name "/aws/lambda/$($func.FunctionName)" --start-time $([int64](($startTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)) --end-time $([int64](($endTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)) --filter-pattern "START RequestId" --output json 2>$null | ConvertFrom-Json
                    
                    if ($invocations.events) {
                        Write-Host "      Recent Invocations: $($invocations.events.Count) in last hour" -ForegroundColor Green
                    } else {
                        Write-Host "      Recent Invocations: 0 in last hour" -ForegroundColor Yellow
                    }
                } catch {
                    Write-Host "      Recent Invocations: Unable to fetch" -ForegroundColor Gray
                }
            }
        }
    } catch {
        Write-Host "   ❌ Failed to retrieve Lambda functions: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Get-ApiGatewayStatus {
    Write-Host "`n🌐 API Gateway:" -ForegroundColor Yellow
    try {
        $apis = aws apigateway get-rest-apis --output json | ConvertFrom-Json
        $modulusApis = $apis.items | Where-Object { $_.name -like "*modulus*" -or $_.name -like "*lms*" }
        
        if ($modulusApis.Count -eq 0) {
            Write-Host "   ℹ️  No Modulus-related API Gateways found" -ForegroundColor Gray
            return
        }
        
        foreach ($api in $modulusApis) {
            Write-Host "   ✅ $($api.name) (ID: $($api.id))" -ForegroundColor White
            
            if ($Detailed) {
                Write-Host "      Created: $($api.createdDate)" -ForegroundColor Gray
                Write-Host "      Description: $($api.description)" -ForegroundColor Gray
                
                # Get deployments
                try {
                    $deployments = aws apigateway get-deployments --rest-api-id $api.id --output json | ConvertFrom-Json
                    if ($deployments.items.Count -gt 0) {
                        $latest = $deployments.items | Sort-Object createdDate -Descending | Select-Object -First 1
                        Write-Host "      Latest Deployment: $($latest.createdDate)" -ForegroundColor Green
                    }
                } catch {
                    Write-Host "      Deployments: Unable to fetch" -ForegroundColor Gray
                }
                
                # Test API endpoint
                $region = aws configure get region
                $endpoint = "https://$($api.id).execute-api.$region.amazonaws.com/prod"
                Write-Host "      Endpoint: $endpoint" -ForegroundColor Cyan
            }
        }
    } catch {
        Write-Host "   ❌ Failed to retrieve API Gateway: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Get-RDSStatus {
    Write-Host "`n🗄️  RDS Databases:" -ForegroundColor Yellow
    try {
        $instances = aws rds describe-db-instances --output json | ConvertFrom-Json
        $clusters = aws rds describe-db-clusters --output json 2>$null | ConvertFrom-Json
        
        # Check RDS Instances
        if ($instances.DBInstances) {
            $modulusInstances = $instances.DBInstances | Where-Object { $_.DBInstanceIdentifier -like "*modulus*" -or $_.DBInstanceIdentifier -like "*lms*" }
            
            foreach ($instance in $modulusInstances) {
                $status = switch ($instance.DBInstanceStatus) {
                    "available" { "✅" }
                    "creating" { "🔄" }
                    "modifying" { "🔄" }
                    default { "❌" }
                }
                Write-Host "   $status $($instance.DBInstanceIdentifier) ($($instance.DBInstanceStatus))" -ForegroundColor White
                
                if ($Detailed) {
                    Write-Host "      Engine: $($instance.Engine) $($instance.EngineVersion)" -ForegroundColor Gray
                    Write-Host "      Class: $($instance.DBInstanceClass)" -ForegroundColor Gray
                    Write-Host "      Storage: $($instance.AllocatedStorage)GB" -ForegroundColor Gray
                    if ($instance.Endpoint) {
                        Write-Host "      Endpoint: $($instance.Endpoint.Address):$($instance.Endpoint.Port)" -ForegroundColor Cyan
                    }
                }
            }
        }
        
        # Check Aurora Clusters
        if ($clusters.DBClusters) {
            $modulusClusters = $clusters.DBClusters | Where-Object { $_.DBClusterIdentifier -like "*modulus*" -or $_.DBClusterIdentifier -like "*lms*" }
            
            foreach ($cluster in $modulusClusters) {
                $status = switch ($cluster.Status) {
                    "available" { "✅" }
                    "creating" { "🔄" }
                    "modifying" { "🔄" }
                    default { "❌" }
                }
                Write-Host "   $status $($cluster.DBClusterIdentifier) (Aurora - $($cluster.Status))" -ForegroundColor White
                
                if ($Detailed) {
                    Write-Host "      Engine: $($cluster.Engine) $($cluster.EngineVersion)" -ForegroundColor Gray
                    Write-Host "      Members: $($cluster.DBClusterMembers.Count)" -ForegroundColor Gray
                    if ($cluster.Endpoint) {
                        Write-Host "      Writer Endpoint: $($cluster.Endpoint)" -ForegroundColor Cyan
                    }
                    if ($cluster.ReaderEndpoint) {
                        Write-Host "      Reader Endpoint: $($cluster.ReaderEndpoint)" -ForegroundColor Cyan
                    }
                }
            }
        }
        
        if (-not $instances.DBInstances -and -not $clusters.DBClusters) {
            Write-Host "   ℹ️  No RDS instances or clusters found" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "   ❌ Failed to retrieve RDS status: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Get-CloudWatchAlarms {
    Write-Host "`n🚨 CloudWatch Alarms:" -ForegroundColor Yellow
    try {
        $alarms = aws cloudwatch describe-alarms --state-value ALARM --output json | ConvertFrom-Json
        
        if ($alarms.MetricAlarms.Count -eq 0) {
            Write-Host "   ✅ No active alarms" -ForegroundColor Green
        } else {
            foreach ($alarm in $alarms.MetricAlarms) {
                Write-Host "   🚨 $($alarm.AlarmName)" -ForegroundColor Red
                if ($Detailed) {
                    Write-Host "      State: $($alarm.StateValue)" -ForegroundColor Gray
                    Write-Host "      Reason: $($alarm.StateReason)" -ForegroundColor Gray
                    Write-Host "      Updated: $($alarm.StateUpdatedTimestamp)" -ForegroundColor Gray
                }
            }
        }
    } catch {
        Write-Host "   ❌ Failed to retrieve CloudWatch alarms: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
if (-not $Lambda -and -not $ApiGateway -and -not $RDS -and -not $All) {
    $All = $true
}

if ($All -or $Lambda) {
    Get-LambdaStatus
}

if ($All -or $ApiGateway) {
    Get-ApiGatewayStatus
}

if ($All -or $RDS) {
    Get-RDSStatus
}

if ($All) {
    Get-CloudWatchAlarms
}

Write-Host "`n📋 Usage Examples:" -ForegroundColor Cyan
Write-Host "   ./aws-monitor.ps1 -All -Detailed" -ForegroundColor White
Write-Host "   ./aws-monitor.ps1 -Lambda -Detailed" -ForegroundColor White
Write-Host "   ./aws-monitor.ps1 -RDS" -ForegroundColor White
