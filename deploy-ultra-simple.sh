#!/bin/bash

# Ultra-Simple AWS Deployment - Minimal Resources
# Designed to avoid common AWS deployment errors

set -e
echo "🚀 Starting Ultra-Simple Modulus Deployment..."

# Configuration
AWS_REGION="eu-west-2"
APP_NAME="modulus-ultra-simple"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    echo "❌ Error: AWS CLI not configured or no permissions"
    echo "Please run: aws configure"
    exit 1
fi

echo "📋 AWS Account ID: $ACCOUNT_ID"
echo "📍 Region: $AWS_REGION"

# Step 1: Create ECR Repository (if needed)
echo "📦 Step 1: Setting up container repository..."
aws ecr describe-repositories --repository-names $APP_NAME --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $APP_NAME --region $AWS_REGION

# Step 2: Build and push Docker image
echo "🐳 Step 2: Building Docker image..."
cat > Dockerfile.simple << EOF
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Build and tag image
docker build -f Dockerfile.simple -t $APP_NAME .
docker tag $APP_NAME:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME:latest

# Login to ECR and push
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME:latest

# Step 3: Create ECS Task Definition
echo "📋 Step 3: Creating task definition..."
cat > ultra-simple-task.json << EOF
{
  "family": "$APP_NAME-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "$APP_NAME",
      "image": "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME:latest",
      "essential": true,
      "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "AWS_REGION", "value": "$AWS_REGION"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/$APP_NAME",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://ultra-simple-task.json --region $AWS_REGION

# Step 4: Create or update ECS service (minimal setup)
echo "🚀 Step 4: Deploying service..."

# Use default VPC and subnets
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0:2].SubnetId' --output text --region $AWS_REGION)
SUBNET1=$(echo $SUBNETS | cut -d' ' -f1)
SUBNET2=$(echo $SUBNETS | cut -d' ' -f2)

# Create security group (if doesn't exist)
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$APP_NAME-sg" --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$SG_ID" = "None" ]; then
    SG_ID=$(aws ec2 create-security-group --group-name $APP_NAME-sg --description "Ultra simple security group" --vpc-id $VPC_ID --query 'GroupId' --output text --region $AWS_REGION)
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
fi

# Create ECS cluster (if doesn't exist)
aws ecs describe-clusters --clusters $APP_NAME --region $AWS_REGION 2>/dev/null || \
aws ecs create-cluster --cluster-name $APP_NAME --region $AWS_REGION

# Create or update service
SERVICE_EXISTS=$(aws ecs describe-services --cluster $APP_NAME --services $APP_NAME-service --query 'services[0].serviceName' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$SERVICE_EXISTS" = "None" ]; then
    # Create new service
    aws ecs create-service \
        --cluster $APP_NAME \
        --service-name $APP_NAME-service \
        --task-definition $APP_NAME-task \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1,$SUBNET2],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
        --region $AWS_REGION
else
    # Update existing service
    aws ecs update-service \
        --cluster $APP_NAME \
        --service $APP_NAME-service \
        --task-definition $APP_NAME-task \
        --region $AWS_REGION
fi

# Wait for service to stabilize
echo "⏳ Waiting for service to start..."
aws ecs wait services-stable --cluster $APP_NAME --services $APP_NAME-service --region $AWS_REGION

# Get public IP
echo "🔍 Finding public IP..."
TASK_ARN=$(aws ecs list-tasks --cluster $APP_NAME --service-name $APP_NAME-service --query 'taskArns[0]' --output text --region $AWS_REGION)
ENI_ID=$(aws ecs describe-tasks --cluster $APP_NAME --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text --region $AWS_REGION)
PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region $AWS_REGION)

echo ""
echo "✅ Deployment Complete!"
echo "🌐 Access your app at: http://$PUBLIC_IP:3000"
echo "📍 Region: $AWS_REGION (London)"
echo "🔧 Cluster: $APP_NAME"
echo ""

# Cleanup temp files
rm -f Dockerfile.simple ultra-simple-task.json

echo "🎉 Modulus LMS is now live!"
