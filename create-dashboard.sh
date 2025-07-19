#!/bin/bash
# CloudWatch Dashboard Setup using AWS CLI
# This script creates a comprehensive monitoring dashboard for Modulus LMS

DASHBOARD_NAME="Modulus-LMS-Dashboard"
REGION="eu-west-2"

echo "Creating CloudWatch Dashboard: $DASHBOARD_NAME"

# Create the dashboard using AWS CLI
aws cloudwatch put-dashboard \
    --dashboard-name "$DASHBOARD_NAME" \
    --dashboard-body '{
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
    }' \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo "✅ Dashboard created successfully!"
    echo "📊 Dashboard URL: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$DASHBOARD_NAME"
    echo ""
    echo "📋 Dashboard includes:"
    echo "  🔴 Amplify build errors and logs"
    echo "  ⚡ Lambda function performance and errors"
    echo "  🗄️ Aurora database metrics and errors"
    echo "  🔐 Cognito authentication metrics"
    echo "  📈 Real-time performance monitoring"
else
    echo "❌ Failed to create dashboard"
    echo "💡 Make sure AWS CLI is configured and you have CloudWatch permissions"
fi
