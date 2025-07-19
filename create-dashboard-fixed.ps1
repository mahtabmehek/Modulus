# CloudWatch Dashboard Creation using AWS CLI (PowerShell)
# Creates a comprehensive monitoring dashboard for Modulus LMS

$DashboardName = "Modulus-LMS-Dashboard"
$Region = "eu-west-2"

Write-Host "Creating CloudWatch Dashboard: $DashboardName" -ForegroundColor Green

# Dashboard configuration as properly escaped JSON
$DashboardBody = @'
{
    "widgets": [
        {
            "type": "log",
            "x": 0,
            "y": 0,
            "width": 24,
            "height": 6,
            "properties": {
                "query": "SOURCE \"/aws/amplify/modulus\" | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 100",
                "region": "eu-west-2",
                "title": "Amplify Build Errors",
                "view": "table"
            }
        },
        {
            "type": "log",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "query": "SOURCE \"/aws/lambda/modulus-api\" | fields @timestamp, @message, @requestId | filter @type = \"REPORT\" | sort @timestamp desc | limit 50",
                "region": "eu-west-2",
                "title": "Lambda Function Reports",
                "view": "table"
            }
        },
        {
            "type": "log",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "query": "SOURCE \"/aws/rds/cluster/modulus-aurora/error\" | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 50",
                "region": "eu-west-2",
                "title": "Aurora Database Errors",
                "view": "table"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 12,
            "width": 8,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/Cognito", "SignInSuccesses", "UserPool", "eu-west-2_4vo3VDZa5" ],
                    [ ".", "SignInThrottles", ".", "." ],
                    [ ".", "SignUpSuccesses", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "eu-west-2",
                "title": "Cognito Authentication Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 8,
            "y": 12,
            "width": 8,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/Lambda", "Duration", "FunctionName", "modulus-api" ],
                    [ ".", "Errors", ".", "." ],
                    [ ".", "Invocations", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "eu-west-2",
                "title": "Lambda Performance Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 16,
            "y": 12,
            "width": 8,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", "modulus-aurora" ],
                    [ ".", "CPUUtilization", ".", "." ],
                    [ ".", "FreeableMemory", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "eu-west-2",
                "title": "Aurora Database Metrics",
                "period": 300
            }
        }
    ]
}
'@

try {
    # Execute AWS CLI command to create dashboard
    $result = aws cloudwatch put-dashboard --dashboard-name $DashboardName --dashboard-body $DashboardBody --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dashboard created successfully!" -ForegroundColor Green
        Write-Host "Dashboard URL: https://$Region.console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=$DashboardName" -ForegroundColor Cyan
        
        Write-Host "`nDashboard includes:" -ForegroundColor Yellow
        Write-Host "  Amplify build errors and logs" -ForegroundColor White
        Write-Host "  Lambda function performance and errors" -ForegroundColor White
        Write-Host "  Aurora database metrics and errors" -ForegroundColor White
        Write-Host "  Cognito authentication metrics" -ForegroundColor White
        Write-Host "  Real-time performance monitoring" -ForegroundColor White
        
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "  1. Open the dashboard URL above" -ForegroundColor White
        Write-Host "  2. Set up CloudWatch alarms for critical metrics" -ForegroundColor White
        Write-Host "  3. Configure notification channels (SNS/Email)" -ForegroundColor White
    }
    else {
        Write-Host "Failed to create dashboard" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        Write-Host "Make sure AWS CLI is configured and you have CloudWatch permissions" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error creating dashboard: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check your AWS credentials and permissions" -ForegroundColor Yellow
}
