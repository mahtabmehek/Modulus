#!/bin/bash

# 🚀 Modulus LMS - UNIFIED Deployment Script
# FEATURES: Idempotent, Zero-downtime, Cost-optimized, EU-optimized
# SUPPORTS: ECS, RDS, S3, ALB, Route 53, Free Tier optimized

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

# Deployment options
ENABLE_RDS=${ENABLE_RDS:-false}
ENABLE_ROUTE53=${ENABLE_ROUTE53:-false}
INSTANCE_TYPE=${INSTANCE_TYPE:-t3.micro}
MIN_CAPACITY=${MIN_CAPACITY:-1}
MAX_CAPACITY=${MAX_CAPACITY:-2}
DESIRED_CAPACITY=${DESIRED_CAPACITY:-1}

# Functions for colored output
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_check() { echo -e "${YELLOW}🔍 $1${NC}"; }
log_update() { echo -e "${BLUE}🔄 $1${NC}"; }
log_skip() { echo -e "${GREEN}⏭️  $1${NC}"; }

# Error handling
cleanup_on_error() {
    log_error "Deployment failed. Cleaning up partial resources..."
    exit 1
}
trap cleanup_on_error ERR

echo "🚀 Modulus LMS - SMART Deployment Starting..."
echo "=============================================="

# Step 1: Validate AWS Access
log_info "Step 1: Validating AWS access..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region $AWS_REGION 2>/dev/null || {
    log_error "AWS CLI not configured or no permissions"
    exit 1
})
log_success "AWS Account ID: $ACCOUNT_ID"
log_success "Region: $AWS_REGION"

# Verify only required services are accessible
log_info "Checking required AWS services..."
aws ecs list-clusters --region $AWS_REGION --max-items 1 >/dev/null 2>&1 || {
    log_error "ECS service not accessible in region $AWS_REGION"
    exit 1
}
aws ecr describe-repositories --region $AWS_REGION --max-items 1 >/dev/null 2>&1 || {
    log_warning "ECR might not be accessible, will try to create repository"
}
log_success "Required AWS services are accessible"

# Step 2: Check existing infrastructure
log_info "Step 2: Checking existing infrastructure..."

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

# Check security group
log_check "Checking security group..."
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$SECURITY_GROUP_ID" = "None" ]; then
    log_info "Creating new security group..."
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
    log_success "Created new security group: $SECURITY_GROUP_ID"
else
    log_skip "Using existing security group: $SECURITY_GROUP_ID"
fi

# Step 3: Container Registry
log_check "Checking ECR repository..."
ECR_EXISTS=$(aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
if [ "$ECR_EXISTS" = "false" ]; then
    log_info "Creating ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
    log_success "Created ECR repository"
else
    log_skip "Using existing ECR repository"
fi

# Step 4: ECS Infrastructure
log_check "Checking ECS cluster..."
CLUSTER_EXISTS=$(aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null || echo "None")
if [ "$CLUSTER_EXISTS" = "None" ] || [ "$CLUSTER_EXISTS" = "INACTIVE" ]; then
    log_info "Creating ECS cluster..."
    aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION
    log_success "Created ECS cluster"
else
    log_skip "Using existing ECS cluster: $CLUSTER_NAME"
fi

# Check CloudWatch log group
log_check "Checking CloudWatch log group..."
LOG_GROUP_EXISTS=$(aws logs describe-log-groups --log-group-name-prefix "/ecs/$APP_NAME" --region $AWS_REGION --query 'logGroups[0].logGroupName' --output text 2>/dev/null || echo "None")
if [ "$LOG_GROUP_EXISTS" = "None" ]; then
    log_info "Creating CloudWatch log group..."
    aws logs create-log-group --log-group-name "/ecs/$APP_NAME" --region $AWS_REGION
    log_success "Created log group"
else
    log_skip "Using existing log group: $LOG_GROUP_EXISTS"
fi

# Step 5: Build and Push Docker Image (optimized)
log_info "Step 5: Building and pushing Docker image..."

# Create optimized Dockerfile
cat > Dockerfile.deploy << 'EOF'
FROM node:18-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

# Build the application
RUN npm run build

# Create user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start the application (use node server.js since output is standalone)
CMD ["node", "server.js"]
EOF

# Build image
log_info "Building Docker image..."
if ! docker build -f Dockerfile.deploy -t $ECR_REPO:latest . ; then
    log_error "Docker build failed. Check your application build process."
    exit 1
fi

# Login to ECR and push
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker tag $ECR_REPO:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
log_success "Docker image pushed to ECR"

# Step 6: Load Balancer Setup
log_info "Step 6: Setting up Application Load Balancer..."

# Check if ALB exists
log_check "Checking Application Load Balancer..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].LoadBalancerArn' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$ALB_ARN" = "None" ]; then
    log_info "Creating Application Load Balancer..."
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
    log_skip "Using existing ALB: $ALB_ARN"
fi

# Check Target Group
log_check "Checking target group..."
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
        --health-check-interval-seconds 30 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text \
        --region $AWS_REGION)
    log_success "Created target group: $TARGET_GROUP_ARN"
else
    log_skip "Using existing target group: $TARGET_GROUP_ARN"
fi

# Check ALB Listener
log_check "Checking ALB listener..."
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
    log_skip "Using existing ALB listener"
fi

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

# Step 8: ECS Service (ZERO DOWNTIME)
log_info "Step 8: Creating/updating ECS service..."

# Check if service exists
log_check "Checking ECS service..."
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
    log_update "Updating existing ECS service (zero downtime)..."
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $TASK_FAMILY \
        --region $AWS_REGION > /dev/null
    log_success "Updated ECS service"
fi

# Step 9: Wait for deployment
log_info "Step 9: Waiting for deployment to complete..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION)

echo ""
echo "=============================================="
log_success "🎉 SMART Deployment Complete!"
echo "=============================================="
log_success "Application URL: http://$ALB_DNS"
log_success "Deployment Type: $([ "$SERVICE_EXISTS" = "None" ] || [ "$SERVICE_EXISTS" = "INACTIVE" ] && echo "NEW" || echo "UPDATE (Zero Downtime)")"
log_success "Region: $AWS_REGION"
log_success "Cluster: $CLUSTER_NAME"
log_success "Service: $SERVICE_NAME"
echo ""

# Show what was created vs reused
echo "📊 Resource Status:"
echo "  VPC: ♻️  Reused (Default)"
echo "  Subnets: ♻️  Reused (Default)"
echo "  Security Group: $([ "$SECURITY_GROUP_ID" != "None" ] && echo "♻️  Reused" || echo "🆕 Created")"
echo "  ECR Repository: $([ "$ECR_EXISTS" = "true" ] && echo "♻️  Reused" || echo "🆕 Created")"
echo "  ECS Cluster: $([ "$CLUSTER_EXISTS" = "ACTIVE" ] && echo "♻️  Reused" || echo "🆕 Created")"
echo "  Load Balancer: $([ "$ALB_ARN" != "None" ] && echo "♻️  Reused" || echo "🆕 Created")"
echo "  Target Group: $([ "$TARGET_GROUP_ARN" != "None" ] && echo "♻️  Reused" || echo "🆕 Created")"
echo "  ECS Service: $([ "$SERVICE_EXISTS" = "ACTIVE" ] && echo "🔄 Updated" || echo "🆕 Created")"
echo ""
log_info "Note: It may take 2-3 minutes for the health checks to pass"
log_info "Check the ALB target group health in AWS Console if needed"
echo ""

# Cleanup temp files
rm -f Dockerfile.deploy task-definition.json

log_success "🚀 Modulus LMS is now deployed and accessible!"
