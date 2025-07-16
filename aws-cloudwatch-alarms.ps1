# Setup CloudWatch Alarms for Modulus LMS
# This creates AWS CloudWatch alarms that automatically alert on issues

param(
    [string]$EmailAddress = "",
    [switch]$CreateAlarms,
    [switch]$ListAlarms,
    [switch]$DeleteAlarms
)

Write-Host "CloudWatch Alarms Setup for Modulus LMS" -ForegroundColor Cyan

if ($ListAlarms) {
    Write-Host "`nExisting CloudWatch Alarms:" -ForegroundColor Yellow
    try {
        $alarms = aws cloudwatch describe-alarms --output json | ConvertFrom-Json
        $modulusAlarms = $alarms.MetricAlarms | Where-Object { $_.AlarmName -like "*modulus*" -or $_.AlarmName -like "*lms*" }
        
        if ($modulusAlarms.Count -eq 0) {
            Write-Host "  No Modulus-related alarms found" -ForegroundColor Gray
        } else {
            foreach ($alarm in $modulusAlarms) {
                $status = switch ($alarm.StateValue) {
                    "OK" { "✅" }
                    "ALARM" { "🚨" }
                    "INSUFFICIENT_DATA" { "⚠️" }
                    default { "❓" }
                }
                Write-Host "  $status $($alarm.AlarmName) - $($alarm.StateValue)" -ForegroundColor White
                Write-Host "     $($alarm.AlarmDescription)" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "  Failed to retrieve alarms: $($_.Exception.Message)" -ForegroundColor Red
    }
    return
}

if ($DeleteAlarms) {
    Write-Host "`nDeleting Modulus CloudWatch Alarms..." -ForegroundColor Yellow
    try {
        $alarms = aws cloudwatch describe-alarms --output json | ConvertFrom-Json
        $modulusAlarms = $alarms.MetricAlarms | Where-Object { $_.AlarmName -like "*modulus*" }
        
        foreach ($alarm in $modulusAlarms) {
            aws cloudwatch delete-alarms --alarm-names $alarm.AlarmName
            Write-Host "  ✅ Deleted: $($alarm.AlarmName)" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Failed to delete alarms: $($_.Exception.Message)" -ForegroundColor Red
    }
    return
}

if ($CreateAlarms) {
    if (-not $EmailAddress) {
        Write-Host "❌ Email address required for alarm notifications" -ForegroundColor Red
        Write-Host "Usage: .\aws-cloudwatch-alarms.ps1 -CreateAlarms -EmailAddress 'your@email.com'" -ForegroundColor Yellow
        return
    }
    
    Write-Host "`nCreating CloudWatch Alarms for Modulus LMS..." -ForegroundColor Yellow
    
    # Step 1: Create SNS Topic for notifications
    Write-Host "Creating SNS topic for notifications..." -ForegroundColor Cyan
    try {
        $topicResult = aws sns create-topic --name "modulus-lms-alerts" --output json | ConvertFrom-Json
        $topicArn = $topicResult.TopicArn
        Write-Host "  ✅ SNS Topic created: $topicArn" -ForegroundColor Green
        
        # Subscribe email to topic
        aws sns subscribe --topic-arn $topicArn --protocol email --notification-endpoint $EmailAddress
        Write-Host "  ✅ Email subscription created (check your email to confirm)" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to create SNS topic: $($_.Exception.Message)" -ForegroundColor Red
        return
    }
    
    # Step 2: Create Lambda Error Alarm
    Write-Host "Creating Lambda error rate alarm..." -ForegroundColor Cyan
    try {
        $alarmCmd = @"
aws cloudwatch put-metric-alarm \
    --alarm-name "modulus-lambda-errors" \
    --alarm-description "Alert when Lambda function has errors" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --dimensions Name=FunctionName,Value=modulus-backend \
    --evaluation-periods 1 \
    --alarm-actions $topicArn \
    --treat-missing-data notBreaching
"@
        Invoke-Expression $alarmCmd
        Write-Host "  ✅ Lambda error alarm created" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ Lambda error alarm might already exist" -ForegroundColor Yellow
    }
    
    # Step 3: Create API Gateway 5xx Error Alarm
    Write-Host "Creating API Gateway error alarm..." -ForegroundColor Cyan
    try {
        $alarmCmd = @"
aws cloudwatch put-metric-alarm \
    --alarm-name "modulus-api-5xx-errors" \
    --alarm-description "Alert when API Gateway has 5xx errors" \
    --metric-name 5XXError \
    --namespace AWS/ApiGateway \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ApiName,Value=modulus-api \
    --evaluation-periods 1 \
    --alarm-actions $topicArn \
    --treat-missing-data notBreaching
"@
        Invoke-Expression $alarmCmd
        Write-Host "  ✅ API Gateway 5xx error alarm created" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ API Gateway error alarm might already exist" -ForegroundColor Yellow
    }
    
    # Step 4: Create RDS Connection Alarm
    Write-Host "Creating RDS connection alarm..." -ForegroundColor Cyan
    try {
        $alarmCmd = @"
aws cloudwatch put-metric-alarm \
    --alarm-name "modulus-rds-connections" \
    --alarm-description "Alert when RDS connection count is high" \
    --metric-name DatabaseConnections \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=DBClusterIdentifier,Value=modulus-aurora-cluster \
    --evaluation-periods 2 \
    --alarm-actions $topicArn \
    --treat-missing-data notBreaching
"@
        Invoke-Expression $alarmCmd
        Write-Host "  ✅ RDS connection alarm created" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ RDS connection alarm might already exist" -ForegroundColor Yellow
    }
    
    Write-Host "`n🎉 CloudWatch Alarms Setup Complete!" -ForegroundColor Green
    Write-Host "`n📧 Check your email ($EmailAddress) to confirm the SNS subscription" -ForegroundColor Yellow
    Write-Host "`n📋 Created Alarms:" -ForegroundColor Cyan
    Write-Host "  • modulus-lambda-errors - Alerts on Lambda function errors" -ForegroundColor White
    Write-Host "  • modulus-api-5xx-errors - Alerts on API Gateway 5xx errors" -ForegroundColor White
    Write-Host "  • modulus-rds-connections - Alerts on high RDS connection count" -ForegroundColor White
    
    return
}

# Default help message
Write-Host "`nUsage:" -ForegroundColor Yellow
Write-Host "  .\aws-cloudwatch-alarms.ps1 -CreateAlarms -EmailAddress 'your@email.com'" -ForegroundColor White
Write-Host "  .\aws-cloudwatch-alarms.ps1 -ListAlarms" -ForegroundColor White
Write-Host "  .\aws-cloudwatch-alarms.ps1 -DeleteAlarms" -ForegroundColor White
Write-Host ""
Write-Host "This will create AWS CloudWatch alarms that automatically:" -ForegroundColor Cyan
Write-Host "• Monitor Lambda function errors" -ForegroundColor White
Write-Host "• Monitor API Gateway 5xx errors" -ForegroundColor White
Write-Host "• Monitor RDS connection counts" -ForegroundColor White
Write-Host "• Send email notifications when thresholds are exceeded" -ForegroundColor White
