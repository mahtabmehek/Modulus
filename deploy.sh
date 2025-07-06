#!/bin/bash

# 🚀 Modulus LMS - Single Unified Deployment Script
# Handles everything: Infrastructure + Application + Monitoring
# Optimized for AWS Free Tier with error handling

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="eu-west-2"
APP_NAME="modulus"
CLUSTER_NAME="modulus-cluster"
SERVICE_NAME="modulus-service"
TASK_FAMILY="modulus-task"
ECR_REPO="modulus-lms"
ALB_NAME="modulus-alb"
TARGET_GROUP_NAME="modulus-tg"
SECURITY_GROUP_NAME="modulus-sg"

# Functions for colored output
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Error handling
cleanup_on_error() {
    log_error "Deployment failed. Cleaning up partial resources..."
    # Add cleanup commands here if needed
    exit 1
}
trap cleanup_on_error ERR

echo "🚀 Modulus LMS - Unified Deployment Starting..."
echo "=============================================="

# Step 1: Validate AWS Access
log_info "Step 1: Validating AWS access..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || {
    log_error "AWS CLI not configured or no permissions"
    echo "Please run: aws configure"
    exit 1
})
log_success "AWS Account ID: $ACCOUNT_ID"
log_success "Region: $AWS_REGION"

# Step 2: Setup Infrastructure
log_info "Step 2: Setting up AWS infrastructure..."

# Get default VPC (avoid VPC limits)
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    log_error "No default VPC found. Creating one..."
    VPC_ID=$(aws ec2 create-default-vpc --query 'Vpc.VpcId' --output text --region $AWS_REGION)
fi
log_success "Using VPC: $VPC_ID"

# Get subnets from default VPC
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0:2].SubnetId' --output text --region $AWS_REGION)
SUBNET1=$(echo $SUBNETS | cut -d' ' -f1)
SUBNET2=$(echo $SUBNETS | cut -d' ' -f2)
log_success "Using subnets: $SUBNET1, $SUBNET2"

# Create or get security group
log_info "Creating security group..."
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$SECURITY_GROUP_ID" = "None" ]; then
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $SECURITY_GROUP_NAME \
        --description "Modulus LMS Security Group" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text \
        --region $AWS_REGION)
    
    # Add rules
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $AWS_REGION
fi
log_success "Security group: $SECURITY_GROUP_ID"

# Step 3: Container Registry
log_info "Step 3: Setting up container registry..."
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION 2>/dev/null || log_warning "ECR repository already exists"
log_success "ECR repository ready"

# Step 4: Build and Push Docker Image
log_info "Step 4: Building and pushing Docker image..."

# Create optimized Dockerfile
cat > Dockerfile.deploy << 'EOF'
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --only=production

FROM base AS builder
COPY . .
RUN npm ci
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
EOF

# Build image
docker build -f Dockerfile.deploy -t $ECR_REPO:latest .

# Login to ECR and push
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker tag $ECR_REPO:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
log_success "Docker image pushed to ECR"

# Step 5: ECS Setup
log_info "Step 5: Setting up ECS cluster and services..."

# Create ECS cluster
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION 2>/dev/null || log_warning "ECS cluster already exists"

# Create CloudWatch log group
aws logs create-log-group --log-group-name "/ecs/$APP_NAME" --region $AWS_REGION 2>/dev/null || log_warning "Log group already exists"

# Step 6: Load Balancer
log_info "Step 6: Setting up Application Load Balancer..."

# Check if ALB exists, if not create it
ALB_ARN=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].LoadBalancerArn' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$ALB_ARN" = "None" ]; then
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name $ALB_NAME \
        --subnets $SUBNET1 $SUBNET2 \
        --security-groups $SECURITY_GROUP_ID \
        --scheme internet-facing \
        --type application \
        --ip-address-type ipv4 \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region $AWS_REGION)
    
    log_success "Created ALB: $ALB_ARN"
else
    log_success "Using existing ALB: $ALB_ARN"
fi

# Create target group (delete existing to avoid conflicts)
aws elbv2 delete-target-group --target-group-arn $(aws elbv2 describe-target-groups --names $TARGET_GROUP_NAME --query 'TargetGroups[0].TargetGroupArn' --output text --region $AWS_REGION 2>/dev/null || echo "none") --region $AWS_REGION 2>/dev/null || true

TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name $TARGET_GROUP_NAME \
    --protocol HTTP \
    --port 3000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path / \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text \
    --region $AWS_REGION)

log_success "Created target group: $TARGET_GROUP_ARN"

# Create listener (delete existing first)
aws elbv2 delete-listener --listener-arn $(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --query 'Listeners[0].ListenerArn' --output text --region $AWS_REGION 2>/dev/null || echo "none") --region $AWS_REGION 2>/dev/null || true

aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
    --region $AWS_REGION > /dev/null

log_success "Created ALB listener"

# Step 7: ECS Task Definition
log_info "Step 7: Creating ECS task definition..."

cat > task-definition.json << EOF
{
    "family": "$TASK_FAMILY",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
    "containerDefinitions": [
        {
            "name": "$APP_NAME",
            "image": "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest",
            "portMappings": [
                {
                    "containerPort": 3000,
                    "protocol": "tcp"
                }
            ],
            "essential": true,
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/$APP_NAME",
                    "awslogs-region": "$AWS_REGION",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "environment": [
                {
                    "name": "NODE_ENV",
                    "value": "production"
                },
                {
                    "name": "PORT",
                    "value": "3000"
                }
            ]
        }
    ]
}
EOF

aws ecs register-task-definition --cli-input-json file://task-definition.json --region $AWS_REGION > /dev/null
log_success "Task definition registered"

# Step 8: ECS Service
log_info "Step 8: Creating/updating ECS service..."

# Delete existing service if it exists
aws ecs delete-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force --region $AWS_REGION 2>/dev/null || true
sleep 10  # Wait for service deletion

aws ecs create-service \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --task-definition $TASK_FAMILY \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1,$SUBNET2],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=$APP_NAME,containerPort=3000" \
    --region $AWS_REGION > /dev/null

log_success "ECS service created"

# Step 9: Wait for deployment
log_info "Step 9: Waiting for deployment to complete..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION)

echo ""
echo "=============================================="
log_success "🎉 Deployment Complete!"
echo "=============================================="
log_success "Application URL: http://$ALB_DNS"
log_success "Region: $AWS_REGION"
log_success "Cluster: $CLUSTER_NAME"
log_success "Service: $SERVICE_NAME"
echo ""
log_info "Note: It may take 2-3 minutes for the health checks to pass"
log_info "Check the ALB target group health in AWS Console if needed"
echo ""

# Cleanup temp files
rm -f Dockerfile.deploy task-definition.json

log_success "🚀 Modulus LMS is now deployed and accessible!"
