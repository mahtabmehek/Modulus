# AWS Resource Cleanup Script
# This script will delete all AWS resources for the Modulus project

$Region = "eu-west-2"

Write-Host "🗑️ Starting AWS Resource Cleanup for Modulus..." -ForegroundColor Red

# 1. Delete CloudWatch Dashboard
Write-Host "Deleting CloudWatch Dashboard..." -ForegroundColor Yellow
aws cloudwatch delete-dashboards --dashboard-names "Modulus-LMS-Dashboard" --region $Region

# 2. Delete RDS Aurora Cluster
Write-Host "Deleting RDS Aurora Cluster..." -ForegroundColor Yellow
aws rds delete-db-cluster --db-cluster-identifier modulus-aurora --skip-final-snapshot --region $Region

# 3. Delete Cognito User Pool
Write-Host "Deleting Cognito User Pool..." -ForegroundColor Yellow
aws cognito-idp delete-user-pool --user-pool-id eu-west-2_4vo3VDZa5 --region $Region

# 4. Delete Lambda Functions
Write-Host "Deleting Lambda Functions..." -ForegroundColor Yellow
aws lambda delete-function --function-name modulus-api --region $Region

# 5. Delete Amplify App
Write-Host "Deleting Amplify App..." -ForegroundColor Yellow
$amplifyApps = aws amplify list-apps --region $Region --query "apps[?name=='modulus'].appId" --output text
if ($amplifyApps) {
    aws amplify delete-app --app-id $amplifyApps --region $Region
}

# 6. Delete S3 Buckets
Write-Host "Deleting S3 Buckets..." -ForegroundColor Yellow
$buckets = aws s3api list-buckets --query "Buckets[?contains(Name, 'modulus')].Name" --output text
foreach ($bucket in $buckets) {
    if ($bucket) {
        aws s3 rb s3://$bucket --force
    }
}

# 7. Delete IAM Roles and Policies
Write-Host "Deleting IAM Resources..." -ForegroundColor Yellow
aws iam delete-role-policy --role-name modulus-lambda-role --policy-name modulus-lambda-policy
aws iam delete-role --role-name modulus-lambda-role

# 8. Delete CloudWatch Log Groups
Write-Host "Deleting CloudWatch Log Groups..." -ForegroundColor Yellow
aws logs delete-log-group --log-group-name "/aws/lambda/modulus-api" --region $Region
aws logs delete-log-group --log-group-name "/aws/amplify/modulus" --region $Region

Write-Host "✅ AWS Resource Cleanup Complete!" -ForegroundColor Green
Write-Host "💰 This will save you approximately $20-45/month" -ForegroundColor Cyan
