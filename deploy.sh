#!/bin/bash

# 🚀 Modulus LMS - Ultra Simple Frontend Deployment
# Focus: Basic Next.js app on ECS with ALB

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
    log_error "Deployment failed. Check the logs above."
    exit 1
}
trap cleanup_on_error ERR

echo "🚀 Modulus LMS - Ultra Simple Frontend Deployment"
echo "================================================="
echo "🔄 Deployment started: $(date)"

# Step 1: Validate AWS Access
log_info "Step 1: Validating AWS access..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region $AWS_REGION 2>/dev/null || {
    log_error "AWS CLI not configured or no permissions"
    exit 1
})
log_success "AWS Account ID: $ACCOUNT_ID"
log_success "Region: $AWS_REGION"

# Step 2: Create or validate ecsTaskExecutionRole
log_info "Step 2: Setting up IAM role for ECS..."
ROLE_EXISTS=$(aws iam get-role --role-name ecsTaskExecutionRole 2>/dev/null && echo "true" || echo "false")
if [ "$ROLE_EXISTS" = "false" ]; then
    log_info "Creating ecsTaskExecutionRole..."
    
    # Create trust policy
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

    aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://trust-policy.json
    aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    
    rm trust-policy.json
    log_success "Created ecsTaskExecutionRole"
else
    log_success "Using existing ecsTaskExecutionRole"
fi

# Step 3: Get VPC and Subnets
log_info "Step 3: Setting up network infrastructure..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    log_error "No default VPC found. Creating one..."
    VPC_ID=$(aws ec2 create-default-vpc --query 'Vpc.VpcId' --output text --region $AWS_REGION)
fi
log_success "Using VPC: $VPC_ID"

SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0:2].SubnetId' --output text --region $AWS_REGION)
SUBNET1=$(echo $SUBNETS | cut -d' ' -f1)
SUBNET2=$(echo $SUBNETS | cut -d' ' -f2)
log_success "Using subnets: $SUBNET1, $SUBNET2"

# Step 4: Security Group
log_info "Step 4: Setting up security group..."
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$SECURITY_GROUP_ID" = "None" ]; then
    log_info "Creating security group..."
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $SECURITY_GROUP_NAME \
        --description "Modulus LMS Security Group" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text \
        --region $AWS_REGION)
    
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $AWS_REGION
    log_success "Created security group: $SECURITY_GROUP_ID"
else
    log_success "Using existing security group: $SECURITY_GROUP_ID"
fi

# Step 5: ECR Repository
log_info "Step 5: Setting up container registry..."
ECR_EXISTS=$(aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
if [ "$ECR_EXISTS" = "false" ]; then
    log_info "Creating ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
    log_success "Created ECR repository"
else
    log_success "Using existing ECR repository"
fi

# Step 6: Build and Push Docker Image
log_info "Step 6: Building and pushing Docker image..."

# Create optimized Dockerfile for Next.js
cat > Dockerfile.simple << 'EOF'
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Install curl for health checks
RUN apk add --no-cache curl

# Create user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "server.js"]
EOF

# Build and push image
log_info "Building Docker image..."
docker build -f Dockerfile.simple -t $ECR_REPO:latest .

log_info "Logging into ECR and pushing image..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker tag $ECR_REPO:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
log_success "Docker image pushed to ECR"

# Clean up Dockerfile
rm Dockerfile.simple

# Step 7: ECS Cluster
log_info "Step 7: Setting up ECS cluster..."
CLUSTER_EXISTS=$(aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null || echo "None")
if [ "$CLUSTER_EXISTS" = "None" ] || [ "$CLUSTER_EXISTS" = "INACTIVE" ]; then
    log_info "Creating ECS cluster..."
    aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION
    log_success "Created ECS cluster"
else
    log_success "Using existing ECS cluster"
fi

# Step 8: CloudWatch Log Group
log_info "Step 8: Setting up logging..."
LOG_GROUP_EXISTS=$(aws logs describe-log-groups --log-group-name-prefix "/ecs/$APP_NAME" --region $AWS_REGION --query 'logGroups[0].logGroupName' --output text 2>/dev/null || echo "None")
if [ "$LOG_GROUP_EXISTS" = "None" ]; then
    log_info "Creating CloudWatch log group..."
    aws logs create-log-group --log-group-name "/ecs/$APP_NAME" --region $AWS_REGION
    log_success "Created log group"
else
    log_success "Using existing log group"
fi

# Step 9: Application Load Balancer
log_info "Step 9: Setting up load balancer..."

ALB_ARN=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].LoadBalancerArn' --output text --region $AWS_REGION 2>/dev/null || echo "None")
if [ "$ALB_ARN" = "None" ]; then
    log_info "Creating Application Load Balancer..."
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name $ALB_NAME \
        --subnets $SUBNET1 $SUBNET2 \
        --security-groups $SECURITY_GROUP_ID \
        --scheme internet-facing \
        --type application \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region $AWS_REGION)
    log_success "Created ALB: $ALB_ARN"
else
    log_success "Using existing ALB: $ALB_ARN"
fi

# Target Group
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups --names $TARGET_GROUP_NAME --query 'TargetGroups[0].TargetGroupArn' --output text --region $AWS_REGION 2>/dev/null || echo "None")
if [ "$TARGET_GROUP_ARN" = "None" ]; then
    log_info "Creating target group..."
    TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
        --name $TARGET_GROUP_NAME \
        --protocol HTTP \
        --port 3000 \
        --vpc-id $VPC_ID \
        --target-type ip \
        --health-check-path / \
        --health-check-interval-seconds 60 \
        --health-check-timeout-seconds 10 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 5 \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text \
        --region $AWS_REGION)
    log_success "Created target group: $TARGET_GROUP_ARN"
else
    log_success "Using existing target group: $TARGET_GROUP_ARN"
fi

# ALB Listener
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --query 'Listeners[0].ListenerArn' --output text --region $AWS_REGION 2>/dev/null || echo "None")
if [ "$LISTENER_ARN" = "None" ]; then
    log_info "Creating ALB listener..."
    aws elbv2 create-listener \
        --load-balancer-arn $ALB_ARN \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
        --region $AWS_REGION > /dev/null
    log_success "Created ALB listener"
else
    log_success "Using existing ALB listener"
fi

# Step 10: ECS Task Definition
log_info "Step 10: Creating ECS task definition..."

cat > task-definition-simple.json << EOF
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
                },
                {
                    "name": "HOSTNAME",
                    "value": "0.0.0.0"
                },
                {
                    "name": "NEXT_TELEMETRY_DISABLED",
                    "value": "1"
                }
            ]
        }
    ]
}
EOF

aws ecs register-task-definition --cli-input-json file://task-definition-simple.json --region $AWS_REGION > /dev/null
log_success "Task definition registered"

# Clean up task definition file
rm task-definition-simple.json

# Step 11: ECS Service
log_info "Step 11: Creating/updating ECS service..."

SERVICE_EXISTS=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null || echo "None")

if [ "$SERVICE_EXISTS" = "None" ] || [ "$SERVICE_EXISTS" = "INACTIVE" ]; then
    log_info "Creating new ECS service..."
    aws ecs create-service \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --task-definition $TASK_FAMILY \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1,$SUBNET2],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=$APP_NAME,containerPort=3000" \
        --region $AWS_REGION > /dev/null
    log_success "Created ECS service"
else
    log_info "Updating existing ECS service..."
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $TASK_FAMILY \
        --region $AWS_REGION > /dev/null
    log_success "Updated ECS service"
fi

# Step 12: Wait for deployment
log_info "Step 12: Waiting for deployment to complete..."
log_info "This may take 5-10 minutes for the first deployment..."

max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    
    running_count=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].runningCount' --output text 2>/dev/null || echo "0")
    desired_count=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].desiredCount' --output text 2>/dev/null || echo "1")
    
    log_info "Deployment check $attempt/$max_attempts - Running: $running_count/$desired_count"
    
    if [ "$running_count" = "$desired_count" ] && [ "$running_count" != "0" ]; then
        log_success "Deployment completed successfully!"
        break
    else
        if [ $attempt -lt $max_attempts ]; then
            log_info "Waiting 30 seconds..."
            sleep 30
        fi
    fi
done

# Get final URL
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION)

echo ""
echo "================================================="
log_success "🎉 Modulus LMS Frontend Deployment Complete!"
echo "================================================="
log_success "Application URL: http://$ALB_DNS"
log_success "Region: $AWS_REGION"
log_success "ECS Cluster: $CLUSTER_NAME"
log_success "ECS Service: $SERVICE_NAME"
echo ""
log_info "📋 Health Check Notes:"
log_info "• It may take 2-5 minutes for health checks to pass"
log_info "• If the app doesn't load immediately, wait a few minutes"
log_info "• Check ECS service events if issues persist"
echo ""
log_success "🚀 Simple frontend deployment completed!"
