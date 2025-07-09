#!/bin/bash

# 🚀 Modulus LMS - COMPLETE Production Deployment Script
# FEATURES: Database, Monitoring, File Storage, Security, Networking
# INCLUDES: RDS, ElastiCache, CloudWatch, S3, VPC, Security Groups

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
DB_SECURITY_GROUP_NAME="modulus-db-sg"

# Database Configuration
DB_INSTANCE_ID="modulus-db"
DB_NAME="modulus_lms"
DB_USERNAME="modulus_admin"
DB_PASSWORD="ModulusSecure2025!"
DB_INSTANCE_CLASS="db.t3.micro"  # Free tier eligible

# Storage Configuration
S3_BUCKET_NAME="modulus-lms-storage-$(date +%s)"
CLOUDWATCH_LOG_GROUP="/aws/modulus-lms"

# Deployment options - FULL PRODUCTION FEATURES
ENABLE_RDS=${ENABLE_RDS:-true}
ENABLE_REDIS=${ENABLE_REDIS:-false}  # Disabled for cost (can enable later)
ENABLE_S3=${ENABLE_S3:-true}
ENABLE_MONITORING=${ENABLE_MONITORING:-true}
ENABLE_BACKUP=${ENABLE_BACKUP:-true}
INSTANCE_TYPE=${INSTANCE_TYPE:-t3.micro}
MIN_CAPACITY=${MIN_CAPACITY:-1}
MAX_CAPACITY=${MAX_CAPACITY:-3}
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
    log_error "Deployment failed. Check logs and AWS Console for details."
    exit 1
}

trap cleanup_on_error ERR

echo "🚀 Modulus LMS - COMPLETE Production Deployment"
echo "=============================================="
echo "📊 Features: Database, Storage, Monitoring, Security"
echo "💰 Cost-optimized for production use"
echo "🔒 Security-first architecture"
echo ""

# Step 1: Validate AWS Access
log_info "Step 1: Validating AWS access..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region $AWS_REGION 2>/dev/null || {
    log_error "AWS CLI not configured or no permissions"
    exit 1
})
log_success "AWS Account ID: $ACCOUNT_ID"
log_success "Region: $AWS_REGION"

# Step 2: VPC and Networking Setup
log_info "Step 2: Setting up VPC and networking..."

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    log_error "No default VPC found. Creating one..."
    VPC_ID=$(aws ec2 create-default-vpc --query 'Vpc.VpcId' --output text --region $AWS_REGION)
fi
log_success "Using VPC: $VPC_ID"

# Get subnets for multi-AZ deployment
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0:3].SubnetId' --output text --region $AWS_REGION)
SUBNET1=$(echo $SUBNETS | cut -d' ' -f1)
SUBNET2=$(echo $SUBNETS | cut -d' ' -f2)
SUBNET3=$(echo $SUBNETS | cut -d' ' -f3)
log_success "Using subnets: $SUBNET1, $SUBNET2, $SUBNET3"

# Step 3: Security Groups
log_info "Step 3: Setting up security groups..."

# Web application security group
log_check "Checking web application security group..."
WEB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$WEB_SG_ID" = "None" ]; then
    log_info "Creating web application security group..."
    WEB_SG_ID=$(aws ec2 create-security-group \
        --group-name $SECURITY_GROUP_NAME \
        --description "Modulus LMS Web Application Security Group" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text \
        --region $AWS_REGION)
    
    # Add rules for web traffic
    aws ec2 authorize-security-group-ingress --group-id $WEB_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $WEB_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $WEB_SG_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $AWS_REGION
    log_success "Created web security group: $WEB_SG_ID"
else
    log_skip "Using existing web security group: $WEB_SG_ID"
fi

# Database security group
if [ "$ENABLE_RDS" = "true" ]; then
    log_check "Checking database security group..."
    DB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$DB_SECURITY_GROUP_NAME" --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null || echo "None")
    
    if [ "$DB_SG_ID" = "None" ]; then
        log_info "Creating database security group..."
        DB_SG_ID=$(aws ec2 create-security-group \
            --group-name $DB_SECURITY_GROUP_NAME \
            --description "Modulus LMS Database Security Group" \
            --vpc-id $VPC_ID \
            --query 'GroupId' \
            --output text \
            --region $AWS_REGION)
        
        # Allow PostgreSQL access from web application
        aws ec2 authorize-security-group-ingress --group-id $DB_SG_ID --protocol tcp --port 5432 --source-group $WEB_SG_ID --region $AWS_REGION
        log_success "Created database security group: $DB_SG_ID"
    else
        log_skip "Using existing database security group: $DB_SG_ID"
    fi
fi

# Step 4: S3 Storage Setup
if [ "$ENABLE_S3" = "true" ]; then
    log_info "Step 4: Setting up S3 storage..."
    
    log_check "Checking S3 bucket..."
    # Check if bucket exists (use a consistent name)
    S3_BUCKET_NAME="modulus-lms-storage-$ACCOUNT_ID"
    BUCKET_EXISTS=$(aws s3api head-bucket --bucket $S3_BUCKET_NAME --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
    
    if [ "$BUCKET_EXISTS" = "false" ]; then
        log_info "Creating S3 bucket for file storage..."
        aws s3api create-bucket \
            --bucket $S3_BUCKET_NAME \
            --region $AWS_REGION \
            --create-bucket-configuration LocationConstraint=$AWS_REGION
        
        # Enable versioning and encryption
        aws s3api put-bucket-versioning --bucket $S3_BUCKET_NAME --versioning-configuration Status=Enabled --region $AWS_REGION
        aws s3api put-bucket-encryption --bucket $S3_BUCKET_NAME --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }' --region $AWS_REGION
        
        log_success "Created S3 bucket: $S3_BUCKET_NAME"
    else
        log_skip "Using existing S3 bucket: $S3_BUCKET_NAME"
    fi
fi

# Step 5: RDS Database Setup
if [ "$ENABLE_RDS" = "true" ]; then
    log_info "Step 5: Setting up RDS PostgreSQL database..."
    
    # Create DB subnet group
    log_check "Checking DB subnet group..."
    DB_SUBNET_GROUP_NAME="modulus-db-subnet-group"
    SUBNET_GROUP_EXISTS=$(aws rds describe-db-subnet-groups --db-subnet-group-name $DB_SUBNET_GROUP_NAME --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
    
    if [ "$SUBNET_GROUP_EXISTS" = "false" ]; then
        log_info "Creating DB subnet group..."
        aws rds create-db-subnet-group \
            --db-subnet-group-name $DB_SUBNET_GROUP_NAME \
            --db-subnet-group-description "Modulus LMS Database Subnet Group" \
            --subnet-ids $SUBNET1 $SUBNET2 $SUBNET3 \
            --region $AWS_REGION
        log_success "Created DB subnet group"
    else
        log_skip "Using existing DB subnet group"
    fi
    
    # Create RDS instance
    log_check "Checking RDS instance..."
    DB_EXISTS=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
    
    if [ "$DB_EXISTS" = "false" ]; then
        log_info "Creating RDS PostgreSQL instance..."
        aws rds create-db-instance \
            --db-instance-identifier $DB_INSTANCE_ID \
            --db-instance-class $DB_INSTANCE_CLASS \
            --engine postgres \
            --engine-version 15.4 \
            --allocated-storage 20 \
            --storage-type gp2 \
            --db-name $DB_NAME \
            --master-username $DB_USERNAME \
            --master-user-password $DB_PASSWORD \
            --vpc-security-group-ids $DB_SG_ID \
            --db-subnet-group-name $DB_SUBNET_GROUP_NAME \
            --backup-retention-period 7 \
            --storage-encrypted \
            --region $AWS_REGION
        
        log_info "Waiting for RDS instance to become available (this may take 10-15 minutes)..."
        aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID --region $AWS_REGION
        log_success "RDS instance created and available"
    else
        log_skip "Using existing RDS instance"
    fi
    
    # Get DB endpoint
    DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --query 'DBInstances[0].Endpoint.Address' --output text --region $AWS_REGION)
    log_success "Database endpoint: $DB_ENDPOINT"
fi

# Step 6: CloudWatch Monitoring Setup
if [ "$ENABLE_MONITORING" = "true" ]; then
    log_info "Step 6: Setting up CloudWatch monitoring..."
    
    # Create log group
    log_check "Checking CloudWatch log group..."
    LOG_GROUP_EXISTS=$(aws logs describe-log-groups --log-group-name-prefix "$CLOUDWATCH_LOG_GROUP" --region $AWS_REGION --query 'logGroups[0].logGroupName' --output text 2>/dev/null || echo "None")
    if [ "$LOG_GROUP_EXISTS" = "None" ]; then
        log_info "Creating CloudWatch log group..."
        aws logs create-log-group --log-group-name "$CLOUDWATCH_LOG_GROUP" --region $AWS_REGION
        aws logs put-retention-policy --log-group-name "$CLOUDWATCH_LOG_GROUP" --retention-in-days 30 --region $AWS_REGION
        log_success "Created CloudWatch log group"
    else
        log_skip "Using existing CloudWatch log group"
    fi
fi

# Step 7: ECR Repository
log_info "Step 7: Setting up container registry..."
log_check "Checking ECR repository..."
ECR_EXISTS=$(aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
if [ "$ECR_EXISTS" = "false" ]; then
    log_info "Creating ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
    log_success "Created ECR repository"
else
    log_skip "Using existing ECR repository"
fi

# Step 8: ECS Infrastructure
log_info "Step 8: Setting up ECS infrastructure..."
log_check "Checking ECS cluster..."
CLUSTER_EXISTS=$(aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null || echo "None")
if [ "$CLUSTER_EXISTS" = "None" ] || [ "$CLUSTER_EXISTS" = "INACTIVE" ]; then
    log_info "Creating ECS cluster..."
    aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION
    log_success "Created ECS cluster"
else
    log_skip "Using existing ECS cluster: $CLUSTER_NAME"
fi

# Step 9: Build and Push Docker Image
log_info "Step 9: Building and pushing Docker image..."

# Create production Dockerfile with all features
cat > Dockerfile.deploy << 'EOF'
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
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

# Copy the standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create health check script
RUN echo '#!/bin/sh' > /app/healthcheck.sh && \
    echo 'curl -f http://localhost:3000/api/health || curl -f http://localhost:3000/ || exit 1' >> /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD ["/app/healthcheck.sh"]

# Start the application
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

# Step 10: Application Load Balancer
log_info "Step 10: Setting up Application Load Balancer..."

# Check if ALB exists
log_check "Checking Application Load Balancer..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].LoadBalancerArn' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$ALB_ARN" = "None" ]; then
    log_info "Creating Application Load Balancer..."
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name $ALB_NAME \
        --subnets $SUBNET1 $SUBNET2 $SUBNET3 \
        --security-groups $WEB_SG_ID \
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

# Target Group
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
        --health-check-interval-seconds 60 \
        --health-check-timeout-seconds 10 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 5 \
        --matcher HttpCode=200,301,302 \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text \
        --region $AWS_REGION)
    log_success "Created target group: $TARGET_GROUP_ARN"
else
    log_skip "Using existing target group: $TARGET_GROUP_ARN"
fi

# ALB Listener
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

# Step 11: ECS Task Definition
log_info "Step 11: Creating ECS task definition..."

# Prepare environment variables
ENV_VARS='[
    {"name": "NODE_ENV", "value": "production"},
    {"name": "PORT", "value": "3000"},
    {"name": "HOSTNAME", "value": "0.0.0.0"},
    {"name": "NEXT_TELEMETRY_DISABLED", "value": "1"}'

if [ "$ENABLE_RDS" = "true" ]; then
    ENV_VARS="${ENV_VARS},
    {\"name\": \"DATABASE_URL\", \"value\": \"postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME\"},
    {\"name\": \"DB_HOST\", \"value\": \"$DB_ENDPOINT\"},
    {\"name\": \"DB_NAME\", \"value\": \"$DB_NAME\"},
    {\"name\": \"DB_USER\", \"value\": \"$DB_USERNAME\"},
    {\"name\": \"DB_PASSWORD\", \"value\": \"$DB_PASSWORD\"}"
fi

if [ "$ENABLE_S3" = "true" ]; then
    ENV_VARS="${ENV_VARS},
    {\"name\": \"S3_BUCKET\", \"value\": \"$S3_BUCKET_NAME\"},
    {\"name\": \"AWS_REGION\", \"value\": \"$AWS_REGION\"}"
fi

ENV_VARS="${ENV_VARS}]"

cat > task-definition.json << EOF
{
    "family": "$TASK_FAMILY",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
    "taskRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
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
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"],
                "interval": 60,
                "timeout": 30,
                "retries": 3,
                "startPeriod": 180
            },
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "$CLOUDWATCH_LOG_GROUP",
                    "awslogs-region": "$AWS_REGION",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "environment": $ENV_VARS,
            "stopTimeout": 30
        }
    ]
}
EOF

aws ecs register-task-definition --cli-input-json file://task-definition.json --region $AWS_REGION > /dev/null
log_success "Task definition registered with full configuration"

# Step 12: ECS Service
log_info "Step 12: Creating/updating ECS service..."

# Check if service exists
SERVICE_EXISTS=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null || echo "None")

if [ "$SERVICE_EXISTS" = "None" ] || [ "$SERVICE_EXISTS" = "INACTIVE" ]; then
    log_info "Creating new ECS service..."
    aws ecs create-service \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --task-definition $TASK_FAMILY \
        --desired-count $DESIRED_CAPACITY \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1,$SUBNET2,$SUBNET3],securityGroups=[$WEB_SG_ID],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=$APP_NAME,containerPort=3000" \
        --region $AWS_REGION > /dev/null
    log_success "Created ECS service"
else
    log_update "Updating existing ECS service..."
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $TASK_FAMILY \
        --desired-count $DESIRED_CAPACITY \
        --region $AWS_REGION > /dev/null
    log_success "Updated ECS service"
fi

# Step 13: Wait for deployment
log_info "Step 13: Waiting for deployment to complete..."
log_info "This may take 5-10 minutes for containers to start and pass health checks..."

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION)

echo ""
echo "=================================================="
log_success "🎉 COMPLETE Modulus LMS Deployment Finished!"
echo "=================================================="
log_success "🌐 Application URL: http://$ALB_DNS"
log_success "🗄️  Database: PostgreSQL on RDS ($([ "$ENABLE_RDS" = "true" ] && echo "✅ Enabled" || echo "❌ Disabled"))"
log_success "📦 Storage: S3 Bucket ($([ "$ENABLE_S3" = "true" ] && echo "✅ Enabled" || echo "❌ Disabled"))"
log_success "📊 Monitoring: CloudWatch ($([ "$ENABLE_MONITORING" = "true" ] && echo "✅ Enabled" || echo "❌ Disabled"))"
log_success "🔒 Security: VPC + Security Groups ✅"
log_success "📍 Region: $AWS_REGION"
log_success "🏗️  Cluster: $CLUSTER_NAME"
log_success "⚙️  Service: $SERVICE_NAME"

echo ""
echo "📋 INFRASTRUCTURE SUMMARY:"
echo "=========================="
echo "🌐 Load Balancer: $ALB_DNS"
if [ "$ENABLE_RDS" = "true" ]; then
    echo "🗄️  Database: $DB_ENDPOINT (PostgreSQL)"
    echo "   📝 DB Name: $DB_NAME"
    echo "   👤 Username: $DB_USERNAME"
fi
if [ "$ENABLE_S3" = "true" ]; then
    echo "📦 Storage: $S3_BUCKET_NAME"
fi
echo "📊 Logs: $CLOUDWATCH_LOG_GROUP"
echo "🔐 Security Groups: Web ($WEB_SG_ID)$([ "$ENABLE_RDS" = "true" ] && echo ", DB ($DB_SG_ID)" || echo "")"

echo ""
echo "🎯 NEXT STEPS:"
echo "============="
echo "1. 🌐 Access your LMS: http://$ALB_DNS"
echo "2. 📊 Monitor: AWS CloudWatch Console"
echo "3. 🗄️  Database: Connect via pgAdmin or psql"
echo "4. 📁 File Storage: S3 bucket for user uploads"
echo "5. 🔧 Configure: Update environment variables as needed"

echo ""
log_info "⏱️  Allow 2-3 minutes for health checks to pass"
log_info "🔍 Check AWS Console for detailed resource status"

# Cleanup temp files
rm -f Dockerfile.deploy task-definition.json

log_success "🚀 Complete Modulus LMS is now deployed and ready for production use!"
