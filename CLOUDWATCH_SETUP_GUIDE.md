# Manual CloudWatch Dashboard Setup Guide

## 📊 CloudWatch Dashboard Creation

Since the automated script had issues, here's how to manually create your CloudWatch dashboard:

### 1. Open AWS CloudWatch Console
- Go to: https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2
- Click "Dashboards" in the left menu
- Click "Create dashboard"
- Name it: "Modulus-LMS-Dashboard"

### 2. Add Log Widgets

#### Widget 1: Amplify Build Errors
- Add widget → Log table
- Log groups: `/aws/amplify/modulus`
- Query:
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

#### Widget 2: Lambda Function Logs
- Add widget → Log table
- Log groups: `/aws/lambda/modulus-api`
- Query:
```
fields @timestamp, @message, @requestId
| filter @type = "REPORT"
| sort @timestamp desc
| limit 50
```

#### Widget 3: Aurora Database Errors
- Add widget → Log table
- Log groups: `/aws/rds/cluster/modulus-aurora/error`
- Query:
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 50
```

#### Widget 4: Cognito Authentication Logs
- Add widget → Log table
- Log groups: `/aws/cognito/userpool/eu-west-2_4vo3VDZa5`
- Query:
```
fields @timestamp, @message
| filter @message like /SignIn/ or @message like /SignUp/
| sort @timestamp desc
| limit 100
```

### 3. Add Metric Widgets

#### Widget 5: Cognito Metrics
- Add widget → Line chart
- Metrics:
  - AWS/Cognito → SignInSuccesses → UserPool: eu-west-2_4vo3VDZa5
  - AWS/Cognito → SignInThrottles → UserPool: eu-west-2_4vo3VDZa5
  - AWS/Cognito → SignUpSuccesses → UserPool: eu-west-2_4vo3VDZa5

#### Widget 6: Lambda Metrics
- Add widget → Line chart
- Metrics:
  - AWS/Lambda → Duration → FunctionName: modulus-api
  - AWS/Lambda → Errors → FunctionName: modulus-api
  - AWS/Lambda → Invocations → FunctionName: modulus-api

#### Widget 7: Aurora Metrics
- Add widget → Line chart
- Metrics:
  - AWS/RDS → DatabaseConnections → DBClusterIdentifier: modulus-aurora
  - AWS/RDS → CPUUtilization → DBClusterIdentifier: modulus-aurora
  - AWS/RDS → FreeableMemory → DBClusterIdentifier: modulus-aurora

### 4. Save Dashboard
- Click "Save dashboard"
- Your dashboard is now ready!

## 🚨 CloudWatch Alarms Setup

### Create SNS Topic First
```bash
aws sns create-topic --name modulus-alerts --region eu-west-2
aws sns subscribe --topic-arn arn:aws:sns:eu-west-2:YOUR_ACCOUNT_ID:modulus-alerts --protocol email --notification-endpoint your-email@example.com
```

### Key Alarms to Create:
1. **Lambda High Error Rate** (>5% errors)
2. **Aurora High Connections** (>80% capacity)
3. **Cognito Failed Sign-ins** (>10 failures in 5 minutes)
4. **Amplify Build Failures** (any build failure)

## 📋 What Each Widget Shows:

### Log Widgets:
- **Real-time error tracking** across all services
- **Build status monitoring** for Amplify deployments
- **Authentication activity** from Cognito
- **Database error monitoring** from Aurora

### Metric Widgets:
- **Performance trends** over time
- **Resource utilization** monitoring
- **Error rates** and **success rates**
- **Capacity planning** data

## 💡 Benefits:
- ✅ Centralized monitoring for all AWS services
- ✅ Real-time error detection and alerting
- ✅ Performance optimization insights
- ✅ Proactive issue identification
- ✅ Historical trend analysis

## 🔧 Next Steps:
1. Create the dashboard manually using the guide above
2. Set up SNS topic for email notifications
3. Configure CloudWatch alarms for critical metrics
4. Test alert notifications
5. Review and adjust thresholds based on your usage patterns
