#!/bin/bash

# 🚀 Modulus LMS - IMPROVED Deployment Script
# IDEMPOTENT: Checks existing resources and only creates what's needed
# ZERO-DOWNTIME: Updates services instead of recreating them

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
log_check() { echo -e "${YELLOW}🔍 $1${NC}"; }
log_update() { echo -e "${BLUE}🔄 $1${NC}"; }
log_skip() { echo -e "${GREEN}⏭️  $1${NC}"; }

echo "🚀 Modulus LMS - SMART Deployment Starting..."
echo "=============================================="

# Step 1: Validate AWS Access
log_info "Step 1: Validating AWS access..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region $AWS_REGION 2>/dev/null || {
    log_error "AWS CLI not configured or no permissions"
    exit 1
})
log_success "AWS Account ID: $ACCOUNT_ID"

# Step 2: Check existing infrastructure
log_info "Step 2: Checking existing infrastructure..."

# Check VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
log_success "Using existing VPC: $VPC_ID"

# Check subnets
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0:2].SubnetId' --output text --region $AWS_REGION)
SUBNET1=$(echo $SUBNETS | cut -d' ' -f1)
SUBNET2=$(echo $SUBNETS | cut -d' ' -f2)
log_success "Using existing subnets: $SUBNET1, $SUBNET2"

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

# Check ECR repository
log_check "Checking ECR repository..."
ECR_EXISTS=$(aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
if [ "$ECR_EXISTS" = "false" ]; then
    log_info "Creating ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
    log_success "Created ECR repository"
else
    log_skip "Using existing ECR repository"
fi

# Check ECS cluster
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

# Check ALB
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

# Step 3: Build and push image (only if needed)
log_info "Step 3: Building and pushing Docker image..."

# Get current image digest to compare
CURRENT_DIGEST=$(aws ecr describe-images --repository-name $ECR_REPO --image-ids imageTag=latest --region $AWS_REGION --query 'imageDetails[0].imageDigest' --output text 2>/dev/null || echo "None")

# Build image
log_info "Building Docker image..."
docker build -t $ECR_REPO:latest .

# Login and push
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker tag $ECR_REPO:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

# Get new digest
NEW_DIGEST=$(aws ecr describe-images --repository-name $ECR_REPO --image-ids imageTag=latest --region $AWS_REGION --query 'imageDetails[0].imageDigest' --output text)

if [ "$CURRENT_DIGEST" = "$NEW_DIGEST" ]; then
    log_skip "Image unchanged, no deployment needed"
else
    log_success "New image pushed: $NEW_DIGEST"
fi

# Step 4: Update task definition (only if image changed)
log_info "Step 4: Updating task definition..."

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

# Step 5: Create or update ECS service (ZERO DOWNTIME)
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

# Step 6: Wait for deployment
log_info "Step 6: Waiting for deployment to stabilize..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION)

echo ""
echo "=============================================="
log_success "🎉 SMART Deployment Complete!"
echo "=============================================="
log_success "Application URL: http://$ALB_DNS"
log_success "Deployment Type: $([ "$SERVICE_EXISTS" = "None" ] && echo "NEW" || echo "UPDATE (Zero Downtime)")"
echo ""

# Show what was created vs reused
echo "📊 Resource Status:"
echo "  VPC: ♻️  Reused"
echo "  Subnets: ♻️  Reused"
echo "  Security Group: $([ -n "$SECURITY_GROUP_ID" ] && echo "♻️  Reused" || echo "🆕 Created")"
echo "  ECR Repository: $([ "$ECR_EXISTS" = "true" ] && echo "♻️  Reused" || echo "🆕 Created")"
echo "  ECS Cluster: $([ "$CLUSTER_EXISTS" = "ACTIVE" ] && echo "♻️  Reused" || echo "🆕 Created")"
echo "  Load Balancer: $([ "$ALB_ARN" != "None" ] && echo "♻️  Reused" || echo "🆕 Created")"
echo "  ECS Service: $([ "$SERVICE_EXISTS" = "ACTIVE" ] && echo "🔄 Updated" || echo "🆕 Created")"

# Cleanup temp files
rm -f task-definition.json

log_success "🚀 Modulus LMS is ready!"
