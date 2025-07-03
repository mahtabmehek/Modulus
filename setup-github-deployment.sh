#!/bin/bash

# Quick AWS Setup for GitHub Actions Deployment
# This script creates the necessary AWS resources for automatic deployment

set -e

echo "🚀 Setting up AWS for GitHub Actions deployment..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install it first: https://aws.amazon.com/cli/"
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $AWS_ACCOUNT_ID"

# Set variables
REGION="us-east-1"
ECR_REPO="modulus-lms"
CLUSTER_NAME="modulus-free-cluster"
SERVICE_NAME="modulus-free-service"

echo "🌍 Region: $REGION"

# Create ECR repository
echo "📦 Creating ECR repository..."
aws ecr create-repository \
    --repository-name $ECR_REPO \
    --region $REGION \
    --image-scanning-configuration scanOnPush=true || echo "Repository might already exist"

# Create ECS cluster
echo "🏗️ Creating ECS cluster..."
aws ecs create-cluster \
    --cluster-name $CLUSTER_NAME \
    --capacity-providers FARGATE \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
    --region $REGION || echo "Cluster might already exist"

# Create CloudWatch log group
echo "📊 Creating CloudWatch log group..."
aws logs create-log-group \
    --log-group-name "/ecs/modulus-free" \
    --region $REGION || echo "Log group might already exist"

# Create IAM roles if they don't exist
echo "🔐 Setting up IAM roles..."

# Task execution role
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file://trust-policy.json || echo "Role might already exist"

aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy || echo "Policy might already be attached"

# Clean up
rm -f trust-policy.json

# Update task definition with account ID
echo "📝 Updating task definition..."
sed "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" free-tier-task-definition.json > free-tier-task-definition-updated.json
mv free-tier-task-definition-updated.json free-tier-task-definition.json

echo "✅ AWS setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Add these secrets to your GitHub repository:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo ""
echo "2. Push your code to trigger deployment:"
echo "   git add ."
echo "   git commit -m 'Add deployment config'"
echo "   git push origin main"
echo ""
echo "3. Monitor deployment in GitHub Actions tab"
echo ""
echo "💰 Estimated monthly cost: $5-15 (mostly free for first 12 months)"
