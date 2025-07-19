# CloudWatch Dashboard Setup Script
# Creates a comprehensive monitoring dashboard for Modulus LMS

$DashboardName = "Modulus-LMS-Dashboard"
$Region = "eu-west-2"

# Read the dashboard configuration
$DashboardBody = Get-Content -Path "cloudwatch-dashboard.json" -Raw

Write-Host "Creating CloudWatch Dashboard: $DashboardName" -ForegroundColor Green

try {
    # Create the CloudWatch dashboard
    aws cloudwatch put-dashboard `
        --dashboard-name $DashboardName `
        --dashboard-body $DashboardBody `
        --region $Region

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dashboard created successfully!" -ForegroundColor Green
        Write-Host "Dashboard URL: https://$Region.console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=$DashboardName" -ForegroundColor Cyan
        
        Write-Host "Dashboard includes:" -ForegroundColor Yellow
        Write-Host "  Amplify build errors and logs" -ForegroundColor White
        Write-Host "  Lambda function performance and errors" -ForegroundColor White
        Write-Host "  Aurora database metrics and errors" -ForegroundColor White
        Write-Host "  Cognito authentication metrics and logs" -ForegroundColor White
        Write-Host "  Real-time performance monitoring" -ForegroundColor White
        
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Open the dashboard URL above" -ForegroundColor White
        Write-Host "  2. Set up CloudWatch alarms for critical metrics" -ForegroundColor White
        Write-Host "  3. Configure notification channels (SNS/Email)" -ForegroundColor White
    }
    else {
        Write-Host "Failed to create dashboard" -ForegroundColor Red
        Write-Host "Make sure AWS CLI is configured and you have CloudWatch permissions" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error creating dashboard: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check your AWS credentials and permissions" -ForegroundColor Yellow
}

Write-Host "Dashboard Features:" -ForegroundColor Cyan
Write-Host "  Real-time log monitoring with CloudWatch Insights" -ForegroundColor White
Write-Host "  Performance metrics for all AWS services" -ForegroundColor White
Write-Host "  Error tracking and alerting capabilities" -ForegroundColor White
Write-Host "  Advanced log filtering and search" -ForegroundColor White
