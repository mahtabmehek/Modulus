# CloudWatch Alarms Configuration for Modulus LMS
# Sets up critical monitoring and alerting

$Region = "eu-west-2"

Write-Host "Setting up CloudWatch Alarms for Modulus LMS..." -ForegroundColor Green

# 1. Lambda Error Rate Alarm
Write-Host "Creating Lambda Error Rate Alarm..." -ForegroundColor Yellow
aws cloudwatch put-metric-alarm `
    --alarm-name "Modulus-Lambda-High-Error-Rate" `
    --alarm-description "Alert when Lambda error rate exceeds 5%" `
    --metric-name "Errors" `
    --namespace "AWS/Lambda" `
    --statistic "Sum" `
    --period 300 `
    --threshold 5 `
    --comparison-operator "GreaterThanThreshold" `
    --dimensions Name=FunctionName, Value=modulus-api `
    --evaluation-periods 2 `
    --alarm-actions "arn:aws:sns:${Region}:ACCOUNT_ID:modulus-alerts" `
    --region $Region

# 2. Aurora Database Connection Alarm
Write-Host "Creating Aurora Connection Alarm..." -ForegroundColor Yellow
aws cloudwatch put-metric-alarm `
    --alarm-name "Modulus-Aurora-High-Connections" `
    --alarm-description "Alert when Aurora connections exceed 80% capacity" `
    --metric-name "DatabaseConnections" `
    --namespace "AWS/RDS" `
    --statistic "Average" `
    --period 300 `
    --threshold 80 `
    --comparison-operator "GreaterThanThreshold" `
    --dimensions Name=DBClusterIdentifier, Value=modulus-aurora `
    --evaluation-periods 2 `
    --alarm-actions "arn:aws:sns:${Region}:ACCOUNT_ID:modulus-alerts" `
    --region $Region

# 3. Cognito Failed Sign-ins Alarm
Write-Host "Creating Cognito Failed Sign-ins Alarm..." -ForegroundColor Yellow
aws cloudwatch put-metric-alarm `
    --alarm-name "Modulus-Cognito-Failed-Signins" `
    --alarm-description "Alert on high number of failed sign-ins" `
    --metric-name "SignInThrottles" `
    --namespace "AWS/Cognito" `
    --statistic "Sum" `
    --period 300 `
    --threshold 10 `
    --comparison-operator "GreaterThanThreshold" `
    --dimensions Name=UserPool, Value=eu-west-2_4vo3VDZa5 `
    --evaluation-periods 1 `
    --alarm-actions "arn:aws:sns:${Region}:ACCOUNT_ID:modulus-alerts" `
    --region $Region

# 4. Amplify Build Failure Alarm
Write-Host "Creating Amplify Build Failure Alarm..." -ForegroundColor Yellow
aws logs put-metric-filter `
    --log-group-name "/aws/amplify/modulus" `
    --filter-name "BuildFailures" `
    --filter-pattern "[timestamp, request_id=\"REPORT\", status=\"FAILED\"]" `
    --metric-transformations `
    metricName=BuildFailures, metricNamespace=Modulus/Amplify, metricValue=1 `
    --region $Region

aws cloudwatch put-metric-alarm `
    --alarm-name "Modulus-Amplify-Build-Failures" `
    --alarm-description "Alert on Amplify build failures" `
    --metric-name "BuildFailures" `
    --namespace "Modulus/Amplify" `
    --statistic "Sum" `
    --period 300 `
    --threshold 1 `
    --comparison-operator "GreaterThanOrEqualToThreshold" `
    --evaluation-periods 1 `
    --alarm-actions "arn:aws:sns:${Region}:ACCOUNT_ID:modulus-alerts" `
    --region $Region

Write-Host "`n✅ CloudWatch Alarms created successfully!" -ForegroundColor Green
Write-Host "📧 Don't forget to:" -ForegroundColor Yellow
Write-Host "  1. Create SNS topic: modulus-alerts" -ForegroundColor White
Write-Host "  2. Subscribe your email to the SNS topic" -ForegroundColor White
Write-Host "  3. Replace ACCOUNT_ID in alarm actions with your AWS Account ID" -ForegroundColor White
