#!/bin/bash

# Simple Modulus LMS Deployment (Default VPC)
# Uses existing AWS infrastructure to avoid limits

set -e
echo "🚀 Starting Simple Modulus LMS Deployment..."

# Configuration
AWS_REGION="eu-west-2"
CLUSTER_NAME="modulus-simple"
DB_NAME="modulussimpledb"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $ACCOUNT_ID"

echo "🔍 Step 1: Using Default Infrastructure..."

# Use default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
echo "📋 Using default VPC: $VPC_ID"

# Get default subnets (at least 2 for ALB)
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0:2].SubnetId' --output text)
SUBNET1_ID=$(echo $SUBNETS | cut -d' ' -f1)
SUBNET2_ID=$(echo $SUBNETS | cut -d' ' -f2)
echo "📋 Using subnets: $SUBNET1_ID, $SUBNET2_ID"

echo "🔒 Step 2: Creating Security Groups..."

# Check if security group exists
WEB_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=modulus-simple-sg" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "None")

if [ "$WEB_SG" = "None" ]; then
    WEB_SG=$(aws ec2 create-security-group --group-name modulus-simple-sg --description "Modulus Simple Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text)
    aws ec2 authorize-security-group-ingress --group-id $WEB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $WEB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $WEB_SG --protocol tcp --port 3000 --cidr 0.0.0.0/0
fi

echo "📦 Step 3: Creating Container Repository..."
aws ecr create-repository --repository-name modulus-simple 2>/dev/null || echo "Repository exists"

echo "🏗️ Step 4: Creating ECS Infrastructure..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME 2>/dev/null || echo "Cluster exists"
aws logs create-log-group --log-group-name "/ecs/modulus-simple" 2>/dev/null || echo "Log group exists"

echo "⚖️ Step 5: Creating Load Balancer..."

# Check if ALB exists
ALB_ARN=$(aws elbv2 describe-load-balancers --names modulus-simple-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "None")

if [ "$ALB_ARN" = "None" ]; then
    ALB_ARN=$(aws elbv2 create-load-balancer \
      --name modulus-simple-alb \
      --subnets $SUBNET1_ID $SUBNET2_ID \
      --security-groups $WEB_SG \
      --query 'LoadBalancers[0].LoadBalancerArn' \
      --output text)
fi

# Target Group
TG_ARN=$(aws elbv2 describe-target-groups --names modulus-simple-tg --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "None")

if [ "$TG_ARN" = "None" ]; then
    TG_ARN=$(aws elbv2 create-target-group \
      --name modulus-simple-tg \
      --protocol HTTP \
      --port 3000 \
      --vpc-id $VPC_ID \
      --target-type ip \
      --health-check-path / \
      --query 'TargetGroups[0].TargetGroupArn' \
      --output text)
fi

# Listener
aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --query 'Listeners[0].ListenerArn' --output text 2>/dev/null || \
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

echo "📋 Step 6: Creating Task Definition..."

cat > simple-task.json << EOF
{
  "family": "modulus-simple-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "modulus-simple",
      "image": "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/modulus-simple:latest",
      "essential": true,
      "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "AWS_REGION", "value": "$AWS_REGION"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/modulus-simple",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

aws ecs register-task-definition --cli-input-json file://simple-task.json

echo "🚀 Step 7: Creating Service..."

# Check if service exists
SERVICE_STATUS=$(aws ecs describe-services --cluster $CLUSTER_NAME --services modulus-simple-service --query 'services[0].status' --output text 2>/dev/null || echo "None")

if [ "$SERVICE_STATUS" = "None" ]; then
    aws ecs create-service \
      --cluster $CLUSTER_NAME \
      --service-name modulus-simple-service \
      --task-definition modulus-simple-task \
      --desired-count 1 \
      --launch-type FARGATE \
      --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$WEB_SG],assignPublicIp=ENABLED}" \
      --load-balancers targetGroupArn=$TG_ARN,containerName=modulus-simple,containerPort=3000
fi

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text)

echo ""
echo "✅ Simple Deployment Complete!"
echo "🌐 Access your app at: http://$ALB_DNS"
echo ""
echo "📋 Resources Created:"
echo "  - ECS Cluster: $CLUSTER_NAME"
echo "  - Load Balancer: $ALB_DNS"
echo "  - Security Group: $WEB_SG"
echo ""

# Cleanup
rm -f simple-task.json

echo "🎉 Modulus LMS deployed successfully!"
