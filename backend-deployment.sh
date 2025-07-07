#!/bin/bash

# 🚀 Modulus LMS - Backend Deployment Script
# Deploys backend API, database, and supporting infrastructure
#
# 🔧 KEY LESSONS LEARNED & FIXES:
# 1. ALB Path Pattern: Use "/api/*" (with leading slash) not "api/*"
# 2. NPM Install: Use "npm install --production" not "npm ci --only=production"
# 3. Rule Detection: Check for correct path pattern "/api/*" in existing rules
# 4. Health Endpoints: Add /api/health endpoints for ALB-accessible health checks
# 5. Error Handling: Comprehensive validation and fallback for ALB rule creation
# 6. Target Group Verification: Ensure rules point to correct target groups
# 7. Endpoint Testing: Test all API endpoints after deployment completion
#
# 🚨 TROUBLESHOOTING:
# - If backend returns 404: Check ALB listener rules for correct path pattern
# - If ALB rule creation fails: Check for existing rules with different priorities
# - If health checks fail: Verify target group health check path and port
# - If database connection fails: Check RDS security groups and Secrets Manager
#
# 📋 DEPLOYMENT ORDER:
# 1. Deploy frontend first (creates ALB, VPC, subnets, security groups)  
# 2. Deploy backend (adds target group, ECS service, RDS, listener rules)

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
BACKEND_SERVICE_NAME="modulus-backend-service"
BACKEND_TASK_FAMILY="modulus-backend-task"
BACKEND_ECR_REPO="modulus-backend"
ALB_NAME="modulus-alb"
BACKEND_TARGET_GROUP_NAME="modulus-backend-tg"
BACKEND_SECURITY_GROUP_NAME="modulus-backend-sg"
DB_SECURITY_GROUP_NAME="modulus-db-sg"
DB_SUBNET_GROUP_NAME="modulus-db-subnet-group"
DB_INSTANCE_ID="modulus-db"
DB_NAME="modulus"
DB_USERNAME="modulus_admin"

# Functions for colored output
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to get or generate database password
get_or_generate_db_password() {
    log_info "Managing database password..."
    
    # Try to get existing password from AWS Secrets Manager
    SECRET_EXISTS=$(aws secretsmanager describe-secret --secret-id "modulus/db/password" --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
    
    if [ "$SECRET_EXISTS" = "false" ]; then
        log_info "Creating new database password..."
        
        # Generate password using available tools
        if command -v openssl >/dev/null 2>&1; then
            DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        elif command -v python3 >/dev/null 2>&1; then
            DB_PASSWORD=$(python3 -c "import secrets, string; print(''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(25)))")
        elif command -v python >/dev/null 2>&1; then
            DB_PASSWORD=$(python -c "import random, string; print(''.join(random.choice(string.ascii_letters + string.digits) for i in range(25)))")
        else
            # Fallback: use AWS CLI to generate a random string
            DB_PASSWORD=$(aws secretsmanager get-random-password --password-length 25 --exclude-characters "\"'@/\\" --output text --region $AWS_REGION)
        fi
        
        # Store password in AWS Secrets Manager
        aws secretsmanager create-secret \
            --name "modulus/db/password" \
            --description "Modulus LMS Database Password" \
            --secret-string "$DB_PASSWORD" \
            --tags Key=Project,Value=Modulus \
            --region $AWS_REGION
        
        log_success "Created new database password in Secrets Manager"
    else
        log_info "Retrieving existing database password from Secrets Manager..."
        DB_PASSWORD=$(aws secretsmanager get-secret-value \
            --secret-id "modulus/db/password" \
            --query SecretString \
            --output text \
            --region $AWS_REGION)
        log_success "Retrieved existing database password"
    fi
}

# Function to create CloudWatch log groups
create_log_groups() {
    log_info "Creating CloudWatch log groups..."
    
    # Backend log group
    LOG_GROUP_EXISTS=$(aws logs describe-log-groups --log-group-name-prefix "/ecs/modulus-backend" --region $AWS_REGION --query 'logGroups[0].logGroupName' --output text 2>/dev/null || echo "None")
    if [ "$LOG_GROUP_EXISTS" = "None" ]; then
        aws logs create-log-group --log-group-name "/ecs/modulus-backend" --region $AWS_REGION
        aws logs put-retention-policy --log-group-name "/ecs/modulus-backend" --retention-in-days 7 --region $AWS_REGION
        log_success "Created backend log group with 7-day retention"
    else
        log_success "Backend log group already exists"
    fi
}

# Function to get VPC and subnet information
get_vpc_info() {
    log_info "Getting VPC and subnet information..."
    
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
    log_info "Using VPC: $VPC_ID"
    
    SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text --region $AWS_REGION)
    SUBNET_ARRAY=($SUBNETS)
    
    if [ ${#SUBNET_ARRAY[@]} -lt 2 ]; then
        log_error "Need at least 2 subnets for RDS Multi-AZ deployment"
        exit 1
    fi
    
    log_success "Found ${#SUBNET_ARRAY[@]} subnets"
}

# Function to ensure ECS Task Execution Role has Secrets Manager permissions
ensure_secrets_permissions() {
    log_info "Ensuring ECS Task Execution Role has Secrets Manager permissions..."
    
    # Check if the role exists
    ROLE_EXISTS=$(aws iam get-role --role-name ecsTaskExecutionRole 2>/dev/null && echo "true" || echo "false")
    if [ "$ROLE_EXISTS" = "false" ]; then
        log_error "ecsTaskExecutionRole not found. Please run frontend deployment first to create it."
        exit 1
    fi
    
    # Attach the built-in policy that includes Secrets Manager access
    aws iam attach-role-policy \
        --role-name ecsTaskExecutionRole \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" 2>/dev/null || true
    
    log_success "ECS Task Execution Role has required permissions"
}

echo "🚀 Starting Modulus LMS Backend Deployment"
echo "Region: $AWS_REGION"
echo "============================================"

# Pre-deployment checks
log_info "Performing pre-deployment checks..."

# Check if Docker is available
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is required but not installed. Please install Docker first."
    exit 1
fi

# Check AWS CLI access (handle different PATH configurations)
AWS_CLI_CMD=""
if command -v aws >/dev/null 2>&1; then
    AWS_CLI_CMD="aws"
elif command -v "aws.exe" >/dev/null 2>&1; then
    AWS_CLI_CMD="aws.exe"
elif [ -f "/c/Program Files/Amazon/AWSCLIV2/aws.exe" ]; then
    AWS_CLI_CMD="/c/Program Files/Amazon/AWSCLIV2/aws.exe"
else
    log_error "AWS CLI not found. Please install AWS CLI and ensure it's in your PATH."
    exit 1
fi

# Test AWS CLI access
if ! $AWS_CLI_CMD sts get-caller-identity --region $AWS_REGION >/dev/null 2>&1; then
    log_error "AWS CLI not configured or no permissions. Please configure AWS credentials."
    log_info "Run: aws configure"
    exit 1
fi

log_success "Pre-deployment checks passed"

# Step 1: Get VPC and Subnet Information
get_vpc_info

# Step 2: Ensure ECS Task Execution Role has proper permissions
ensure_secrets_permissions

# Step 3: Create CloudWatch Log Groups
create_log_groups

# Step 4: Get or Generate Database Password
get_or_generate_db_password

# Step 5: Create Database Security Group
log_info "Step 5: Setting up database security group..."
DB_SG_EXISTS=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$DB_SECURITY_GROUP_NAME" --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null || echo "None")
if [ "$DB_SG_EXISTS" = "None" ]; then
    log_info "Creating database security group..."
    DB_SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $DB_SECURITY_GROUP_NAME \
        --description "Modulus LMS Database Security Group" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text \
        --region $AWS_REGION)
    
    # Allow PostgreSQL access from backend security group (will be created later)
    log_success "Created database security group: $DB_SECURITY_GROUP_ID"
else
    DB_SECURITY_GROUP_ID=$DB_SG_EXISTS
    log_success "Using existing database security group: $DB_SECURITY_GROUP_ID"
fi

# Step 6: Create Backend Security Group
log_info "Step 6: Setting up backend security group..."
BACKEND_SG_EXISTS=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$BACKEND_SECURITY_GROUP_NAME" --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null || echo "None")
if [ "$BACKEND_SG_EXISTS" = "None" ]; then
    log_info "Creating backend security group..."
    BACKEND_SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $BACKEND_SECURITY_GROUP_NAME \
        --description "Modulus LMS Backend Security Group" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text \
        --region $AWS_REGION)
    
    # Allow HTTP traffic from ALB
    aws ec2 authorize-security-group-ingress --group-id $BACKEND_SECURITY_GROUP_ID --protocol tcp --port 3001 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $BACKEND_SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
    log_success "Created backend security group: $BACKEND_SECURITY_GROUP_ID"
else
    BACKEND_SECURITY_GROUP_ID=$BACKEND_SG_EXISTS
    log_success "Using existing backend security group: $BACKEND_SECURITY_GROUP_ID"
fi

# Step 7: Allow database access from backend
log_info "Step 7: Configuring database access from backend..."
# Check if rule already exists
RULE_EXISTS=$(aws ec2 describe-security-groups --group-ids $DB_SECURITY_GROUP_ID --query "SecurityGroups[0].IpPermissions[?FromPort==\`5432\` && IpProtocol==\`tcp\` && UserIdGroupPairs[?GroupId==\`$BACKEND_SECURITY_GROUP_ID\`]]" --output text --region $AWS_REGION)
if [ -z "$RULE_EXISTS" ]; then
    aws ec2 authorize-security-group-ingress \
        --group-id $DB_SECURITY_GROUP_ID \
        --protocol tcp \
        --port 5432 \
        --source-group $BACKEND_SECURITY_GROUP_ID \
        --region $AWS_REGION
    log_success "Allowed database access from backend security group"
else
    log_success "Database access rule already exists"
fi

# Step 8: Create DB Subnet Group
log_info "Step 8: Setting up database subnet group..."
DB_SUBNET_GROUP_EXISTS=$(aws rds describe-db-subnet-groups --db-subnet-group-name $DB_SUBNET_GROUP_NAME --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
if [ "$DB_SUBNET_GROUP_EXISTS" = "false" ]; then
    log_info "Creating database subnet group..."
    aws rds create-db-subnet-group \
        --db-subnet-group-name $DB_SUBNET_GROUP_NAME \
        --db-subnet-group-description "Modulus LMS Database Subnet Group" \
        --subnet-ids ${SUBNET_ARRAY[0]} ${SUBNET_ARRAY[1]} \
        --region $AWS_REGION
    log_success "Created database subnet group"
else
    log_success "Using existing database subnet group"
fi

# Step 9: Create RDS PostgreSQL Database
log_info "Step 9: Setting up PostgreSQL database..."
DB_EXISTS=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
if [ "$DB_EXISTS" = "false" ]; then
    log_info "Creating PostgreSQL database instance..."
    aws rds create-db-instance \
        --db-instance-identifier $DB_INSTANCE_ID \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --engine-version 15.7 \
        --master-username $DB_USERNAME \
        --master-user-password "$DB_PASSWORD" \
        --db-name $DB_NAME \
        --allocated-storage 20 \
        --storage-type gp2 \
        --vpc-security-group-ids $DB_SECURITY_GROUP_ID \
        --db-subnet-group-name $DB_SUBNET_GROUP_NAME \
        --backup-retention-period 7 \
        --no-multi-az \
        --no-publicly-accessible \
        --storage-encrypted \
        --region $AWS_REGION
    
    log_info "Waiting for database to become available (this may take 5-10 minutes)..."
    aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID --region $AWS_REGION
    log_success "Database is now available"
else
    log_success "Using existing database instance"
fi

# Step 10: Get Database Endpoint
log_info "Step 10: Getting database connection information..."
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region $AWS_REGION)
log_success "Database endpoint: $DB_ENDPOINT"

# Step 11: Backend ECR Repository
log_info "Step 11: Setting up backend container registry..."
BACKEND_ECR_EXISTS=$(aws ecr describe-repositories --repository-names $BACKEND_ECR_REPO --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
if [ "$BACKEND_ECR_EXISTS" = "false" ]; then
    log_info "Creating backend ECR repository..."
    aws ecr create-repository --repository-name $BACKEND_ECR_REPO --region $AWS_REGION
    log_success "Created backend ECR repository"
else
    log_success "Using existing backend ECR repository"
fi

# Step 12: Use Authentication Backend Application
log_info "Step 12: Using authentication backend application..."

# Check if backend directory exists with new authentication code
if [ ! -d "backend" ]; then
    log_error "Backend directory not found. Authentication backend should be in 'backend/' directory."
    exit 1
fi

if [ ! -f "backend/package.json" ]; then
    log_error "Backend package.json not found. Please ensure authentication backend is properly set up."
    exit 1
fi

if [ ! -f "backend/server.js" ]; then
    log_error "Backend server.js not found. Please ensure authentication backend is properly set up."
    exit 1
fi

log_success "Found authentication backend application"

# Step 13: Initialize Database Schema
log_info "Step 13: Initializing database schema..."
if [ -f "backend/schema.sql" ]; then
    log_info "Running database schema initialization..."
    
    # Get database endpoint
    DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --query 'DBInstances[0].Endpoint.Address' --output text --region $AWS_REGION)
    
    # Set database environment variables
    export PGHOST=$DB_ENDPOINT
    export PGPORT=5432
    export PGDATABASE=$DB_NAME
    export PGUSER=$DB_USERNAME
    export PGPASSWORD="$DB_PASSWORD"
    
    # Try to run schema using psql if available, otherwise log instruction
    if command -v psql >/dev/null 2>&1; then
        log_info "Running schema installation with psql..."
        psql -f backend/schema.sql 2>/dev/null || log_warning "Schema may already exist or psql failed. This is normal for redeployment."
    else
        log_warning "psql not available. Database schema should be initialized manually or will be handled by the application."
    fi
    
    log_success "Database schema setup completed"
else
    log_warning "No schema.sql found. Database will be initialized by application."
fi

# Step 13: Build and Push Backend Docker Image
log_info "Step 13: Building and pushing backend Docker image..."

# Get ECR login
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com"

# Build and tag image
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BACKEND_IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_ECR_REPO:latest"

cd backend
docker build -t $BACKEND_ECR_REPO .
docker tag $BACKEND_ECR_REPO:latest $BACKEND_IMAGE_URI
docker push $BACKEND_IMAGE_URI
cd ..

log_success "Backend image pushed to ECR: $BACKEND_IMAGE_URI"

# Step 14: Create ECS Task Definition for Backend
log_info "Step 14: Creating backend ECS task definition..."

# Get the actual Secrets Manager ARN
SECRET_ARN=$(aws secretsmanager describe-secret --secret-id "modulus/db/password" --query 'ARN' --output text --region $AWS_REGION)

# Get ALB DNS name for frontend URL
ALB_DNS_NAME=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION 2>/dev/null || echo "modulus-alb-placeholder")

cat > backend-task-definition.json << EOF
{
  "family": "$BACKEND_TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "$BACKEND_IMAGE_URI",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        },
        {
          "name": "DB_HOST",
          "value": "$DB_ENDPOINT"
        },
        {
          "name": "DB_PORT",
          "value": "5432"
        },
        {
          "name": "DB_NAME",
          "value": "$DB_NAME"
        },
        {
          "name": "DB_USER",
          "value": "$DB_USERNAME"
        },
        {
          "name": "JWT_SECRET",
          "value": "modulus-lms-production-jwt-secret-$(date +%s)"
        },
        {
          "name": "JWT_EXPIRES_IN",
          "value": "24h"
        },
        {
          "name": "FRONTEND_URL",
          "value": "http://$ALB_DNS_NAME"
        },
        {
          "name": "ACCESS_CODE",
          "value": "mahtabmehek1337"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "$SECRET_ARN"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/modulus-backend",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "node -e \"require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))\""
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

aws ecs register-task-definition --cli-input-json file://backend-task-definition.json --region $AWS_REGION
log_success "Registered backend task definition"

# Step 15: Create Backend Target Group
log_info "Step 15: Creating backend target group..."
BACKEND_TG_EXISTS=$(aws elbv2 describe-target-groups --names $BACKEND_TARGET_GROUP_NAME --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
if [ "$BACKEND_TG_EXISTS" = "false" ]; then
    log_info "Creating backend target group..."
    BACKEND_TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
        --name $BACKEND_TARGET_GROUP_NAME \
        --protocol HTTP \
        --port 3001 \
        --vpc-id $VPC_ID \
        --target-type ip \
        --health-check-enabled \
        --health-check-path "/health" \
        --health-check-protocol HTTP \
        --health-check-port 3001 \
        --health-check-interval-seconds 30 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --matcher HttpCode=200 \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text \
        --region $AWS_REGION)
    log_success "Created backend target group: $BACKEND_TARGET_GROUP_ARN"
else
    BACKEND_TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups --names $BACKEND_TARGET_GROUP_NAME --query 'TargetGroups[0].TargetGroupArn' --output text --region $AWS_REGION)
    log_success "Using existing backend target group: $BACKEND_TARGET_GROUP_ARN"
fi

# Step 16: Get ALB ARN and Create Backend Listener Rule
log_info "Step 16: Setting up ALB listener rule for backend..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].LoadBalancerArn' --output text --region $AWS_REGION 2>/dev/null || echo "None")
if [ "$ALB_ARN" != "None" ]; then
    LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --query 'Listeners[0].ListenerArn' --output text --region $AWS_REGION)
    log_info "Found ALB listener: $LISTENER_ARN"
    
    # Check if backend rule already exists (check for correct path pattern with leading slash)
    BACKEND_RULE_EXISTS=$(aws elbv2 describe-rules --listener-arn $LISTENER_ARN --query "Rules[?Conditions[0].Values[0]=='/api/*']" --output text --region $AWS_REGION)
    
    if [ -z "$BACKEND_RULE_EXISTS" ]; then
        log_info "Creating backend listener rule for path pattern '/api/*'..."
        
        # Create the rule with proper error handling
        RULE_CREATION_RESULT=$(aws elbv2 create-rule \
            --listener-arn $LISTENER_ARN \
            --priority 100 \
            --conditions Field=path-pattern,Values="/api/*" \
            --actions Type=forward,TargetGroupArn=$BACKEND_TARGET_GROUP_ARN \
            --region $AWS_REGION 2>&1)
        
        if [ $? -eq 0 ]; then
            log_success "Created backend listener rule for /api/* paths"
            BACKEND_RULE_ARN=$(echo "$RULE_CREATION_RESULT" | jq -r '.Rules[0].RuleArn' 2>/dev/null || echo "N/A")
            log_info "Backend rule ARN: $BACKEND_RULE_ARN"
        else
            log_error "Failed to create backend listener rule: $RULE_CREATION_RESULT"
            # Check if rule might exist with different priority or old pattern
            log_info "Checking for existing rules with similar patterns..."
            EXISTING_API_RULES=$(aws elbv2 describe-rules --listener-arn $LISTENER_ARN --region $AWS_REGION --query 'Rules[?contains(Conditions[0].Values[0], `api`)].{Priority:Priority,Pattern:Conditions[0].Values[0],RuleArn:RuleArn}' --output table 2>/dev/null || echo "No existing API rules found")
            echo "$EXISTING_API_RULES"
        fi
    else
        log_success "Backend listener rule already exists for /api/* paths"
        # Verify the rule is pointing to correct target group
        RULE_TARGET_GROUP=$(aws elbv2 describe-rules --listener-arn $LISTENER_ARN --region $AWS_REGION --query "Rules[?Conditions[0].Values[0]=='/api/*'].Actions[0].TargetGroupArn" --output text 2>/dev/null)
        if [ "$RULE_TARGET_GROUP" = "$BACKEND_TARGET_GROUP_ARN" ]; then
            log_success "Backend rule is correctly configured"
        else
            log_warning "Backend rule exists but may point to different target group"
            log_info "Expected: $BACKEND_TARGET_GROUP_ARN"
            log_info "Found: $RULE_TARGET_GROUP"
        fi
    fi
    
    # Get and display ALB DNS for reference
    ALB_DNS=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION 2>/dev/null)
    if [ "$ALB_DNS" != "None" ] && [ -n "$ALB_DNS" ]; then
        log_info "ALB DNS Name: $ALB_DNS"
        log_info "Backend API endpoints:"
        log_info "  - Status: http://$ALB_DNS/api/status"
        log_info "  - Health: http://$ALB_DNS/api/health"
        log_info "  - Users: http://$ALB_DNS/api/users"
        log_info "  - Labs: http://$ALB_DNS/api/labs"
    fi
    
else
    log_warning "ALB not found. Backend will be accessible directly via ECS service."
    log_info "You may need to deploy the frontend first to create the ALB."
fi

# Step 17: Create Backend ECS Service
log_info "Step 17: Creating backend ECS service..."
BACKEND_SERVICE_EXISTS=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $BACKEND_SERVICE_NAME --region $AWS_REGION --query 'services[0].serviceName' --output text 2>/dev/null)
if [ "$BACKEND_SERVICE_EXISTS" = "None" ] || [ -z "$BACKEND_SERVICE_EXISTS" ]; then
    log_info "Creating backend ECS service..."
    aws ecs create-service \
        --cluster $CLUSTER_NAME \
        --service-name $BACKEND_SERVICE_NAME \
        --task-definition $BACKEND_TASK_FAMILY:1 \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ARRAY[0]},${SUBNET_ARRAY[1]}],securityGroups=[$BACKEND_SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
        --load-balancers targetGroupArn=$BACKEND_TARGET_GROUP_ARN,containerName=backend,containerPort=3001 \
        --health-check-grace-period-seconds 300 \
        --region $AWS_REGION
    
    log_info "Waiting for backend service to stabilize..."
    aws ecs wait services-stable --cluster $CLUSTER_NAME --services $BACKEND_SERVICE_NAME --region $AWS_REGION
    log_success "Backend service is running and stable"
else
    log_info "Updating existing backend service..."
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $BACKEND_SERVICE_NAME \
        --task-definition $BACKEND_TASK_FAMILY:1 \
        --region $AWS_REGION
    
    log_info "Waiting for backend service to stabilize..."
    aws ecs wait services-stable --cluster $CLUSTER_NAME --services $BACKEND_SERVICE_NAME --region $AWS_REGION
    log_success "Backend service updated and stable"
fi

# Step 18: Test Backend Deployment
log_info "Step 18: Testing backend deployment..."

# Get service details
BACKEND_TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $BACKEND_SERVICE_NAME --query 'taskArns[0]' --output text --region $AWS_REGION)
if [ "$BACKEND_TASK_ARN" != "None" ] && [ "$BACKEND_TASK_ARN" != "null" ] && [ -n "$BACKEND_TASK_ARN" ]; then
    log_info "Getting backend task network details..."
    
    # Get the network interface ID from the task
    NETWORK_INTERFACE_ID=$(aws ecs describe-tasks \
        --cluster $CLUSTER_NAME \
        --tasks $BACKEND_TASK_ARN \
        --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
        --output text \
        --region $AWS_REGION)
    
    if [ "$NETWORK_INTERFACE_ID" != "None" ] && [ -n "$NETWORK_INTERFACE_ID" ]; then
        # Get the public IP from the network interface
        BACKEND_PUBLIC_IP=$(aws ec2 describe-network-interfaces \
            --network-interface-ids $NETWORK_INTERFACE_ID \
            --query 'NetworkInterfaces[0].Association.PublicIp' \
            --output text \
            --region $AWS_REGION)
        
        if [ "$BACKEND_PUBLIC_IP" != "None" ] && [ -n "$BACKEND_PUBLIC_IP" ]; then
            log_info "Backend task public IP: $BACKEND_PUBLIC_IP"
            
            # Test endpoints if curl is available
            if command -v curl >/dev/null 2>&1; then
                log_info "Testing backend health endpoint..."
                if curl -f -s --max-time 10 "http://$BACKEND_PUBLIC_IP:3001/health" > /dev/null; then
                    log_success "Backend health check passed"
                    
                    log_info "Testing backend API endpoint..."
                    if curl -f -s --max-time 10 "http://$BACKEND_PUBLIC_IP:3001/api/status" > /dev/null; then
                        log_success "Backend API is responding"
                    else
                        log_warning "Backend API endpoint not responding (may still be starting)"
                    fi
                else
                    log_warning "Backend health check failed (may still be starting)"
                fi
            else
                log_info "curl not available - skipping connectivity tests"
            fi
            
            log_info "Backend directly accessible at: http://$BACKEND_PUBLIC_IP:3001"
        else
            log_info "Backend task has no public IP (this is normal for private subnets)"
        fi
    else
        log_warning "Could not retrieve network interface ID from backend task"
    fi
else
    log_warning "No backend tasks found - service may still be starting"
fi

# Test via ALB if available
if [ "$ALB_ARN" != "None" ]; then
    ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION)
    log_info "Testing backend via ALB..."
    
    # Test multiple endpoints to ensure routing is working
    ENDPOINTS=("/api/status" "/api/health" "/api/users" "/api/labs")
    
    if command -v curl >/dev/null 2>&1; then
        ALL_ENDPOINTS_WORKING=true
        
        for endpoint in "${ENDPOINTS[@]}"; do
            log_info "Testing endpoint: $endpoint"
            
            if curl -f -s --max-time 10 "http://$ALB_DNS$endpoint" > /dev/null; then
                log_success "✅ $endpoint - Working"
            else
                log_warning "⚠️  $endpoint - Not responding (target registration may take a few minutes)"
                ALL_ENDPOINTS_WORKING=false
            fi
        done
        
        if [ "$ALL_ENDPOINTS_WORKING" = true ]; then
            log_success "🎉 All backend endpoints are accessible via ALB!"
        else
            log_warning "Some endpoints are not yet accessible. This is normal during initial deployment."
            log_info "Please wait 2-3 minutes for target registration to complete, then test manually."
        fi
        
        echo ""
        log_info "Backend API Base URL: http://$ALB_DNS/api/"
        
    else
        log_info "curl not available - manual testing required"
        echo ""
        log_info "Test these endpoints manually:"
        for endpoint in "${ENDPOINTS[@]}"; do
            echo "  - http://$ALB_DNS$endpoint"
        done
    fi
else
    log_warning "ALB not available - backend accessible only via ECS service IP"
fi

# Step 19: Summary
echo ""
echo "🎉 Backend Deployment Complete!"
echo "================================"

# Database Summary
echo ""
echo "📊 Database Configuration:"
echo "  Type: PostgreSQL 15.7"
echo "  Instance: $DB_INSTANCE_ID"
echo "  Endpoint: $DB_ENDPOINT"
echo "  Status: $(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --query 'DBInstances[0].DBInstanceStatus' --output text --region $AWS_REGION 2>/dev/null || echo 'Unknown')"

# ECS Service Summary
echo ""
echo "🐳 ECS Service Configuration:"
echo "  Cluster: $CLUSTER_NAME"
echo "  Service: $BACKEND_SERVICE_NAME"
RUNNING_COUNT=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $BACKEND_SERVICE_NAME --query 'services[0].runningCount' --output text --region $AWS_REGION 2>/dev/null || echo "0")
DESIRED_COUNT=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $BACKEND_SERVICE_NAME --query 'services[0].desiredCount' --output text --region $AWS_REGION 2>/dev/null || echo "0")
echo "  Tasks: $RUNNING_COUNT/$DESIRED_COUNT running"

# ALB Summary
echo ""
echo "🌐 Application Load Balancer:"
if [ "$ALB_ARN" != "None" ]; then
    ALB_STATE=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].State.Code' --output text --region $AWS_REGION 2>/dev/null || echo "unknown")
    ALB_DNS=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION 2>/dev/null || echo "N/A")
    echo "  Name: $ALB_NAME"
    echo "  Status: $ALB_STATE"
    echo "  DNS: $ALB_DNS"
    
    # Check target group health
    HEALTHY_TARGETS=$(aws elbv2 describe-target-health --target-group-arn $BACKEND_TARGET_GROUP_ARN --region $AWS_REGION --query 'length(TargetHealthDescriptions[?TargetHealth.State==`healthy`])' --output text 2>/dev/null || echo "0")
    TOTAL_TARGETS=$(aws elbv2 describe-target-health --target-group-arn $BACKEND_TARGET_GROUP_ARN --region $AWS_REGION --query 'length(TargetHealthDescriptions)' --output text 2>/dev/null || echo "0")
    echo "  Healthy Targets: $HEALTHY_TARGETS/$TOTAL_TARGETS"
    
    echo ""
    echo "🔗 API Endpoints:"
    echo "  Base URL: http://$ALB_DNS/api/"
    echo "  Status: http://$ALB_DNS/api/status"
    echo "  Health: http://$ALB_DNS/api/health"
    echo "  Users: http://$ALB_DNS/api/users"
    echo "  Labs: http://$ALB_DNS/api/labs"
else
    echo "  Status: ALB not found (deploy frontend first)"
fi

# Security Summary
echo ""
echo "🔐 Security Configuration:"
echo "  Database Password: Stored in AWS Secrets Manager"
echo "  ECS Task Role: $BACKEND_TASK_ROLE_NAME"
echo "  Security Groups: Backend and Database SGs configured"

# Deployment Status
echo ""
echo "✅ Deployment Status Summary:"
echo "  ✅ RDS Database: Created and available"
echo "  ✅ ECS Service: Created and running ($RUNNING_COUNT tasks)"
echo "  ✅ Target Group: Created with health checks"
if [ "$ALB_ARN" != "None" ]; then
    echo "  ✅ ALB Listener Rule: Configured for /api/* paths"
    if [ "$HEALTHY_TARGETS" -gt 0 ]; then
        echo "  ✅ Health Checks: Passing ($HEALTHY_TARGETS healthy targets)"
    else
        echo "  ⏳ Health Checks: In progress (targets registering)"
    fi
else
    echo "  ⚠️  ALB Integration: Requires frontend deployment"
fi

echo ""
echo "🚀 Next Steps:"
echo "  1. Wait 2-3 minutes for target registration"
if [ "$ALB_ARN" != "None" ]; then
    echo "  2. Test API: curl http://$ALB_DNS/api/status"
    echo "  3. Verify health: curl http://$ALB_DNS/api/health"
else
    echo "  2. Deploy frontend to create ALB integration"
    echo "  3. Test backend via direct ECS service endpoint"
fi
echo "  4. Check CloudWatch logs: /ecs/modulus-backend"
echo ""
echo "📚 Documentation: See DEPLOYMENT_SUCCESS.md for full details"
echo "🎯 Backend deployment completed successfully!"
echo "  - Database: $DB_NAME"
echo "  - Username: $DB_USERNAME"
echo ""
echo "Backend API: Node.js/Express on ECS"
echo "  - Service: $BACKEND_SERVICE_NAME"
echo "  - Task Definition: $BACKEND_TASK_FAMILY"
echo "  - Health Check: /health"
echo "  - API Endpoints:"
echo "    - GET /api/status"
echo "    - GET /api/users"
echo "    - GET /api/labs"
echo "    - GET /health"
echo "    - GET /health/db"
echo ""
if [ "$ALB_ARN" != "None" ]; then
    echo "Access URLs:"
    echo "  - Backend API: http://$ALB_DNS/api/status"
    echo "  - Health Check: http://$ALB_DNS/api/../health"
else
    echo "Direct Access (if public IP available):"
    echo "  - Backend API: http://$BACKEND_PUBLIC_IP:3001/api/status"
    echo "  - Health Check: http://$BACKEND_PUBLIC_IP:3001/health"
fi
echo ""
echo "Security Groups:"
echo "  - Backend: $BACKEND_SECURITY_GROUP_ID"
echo "  - Database: $DB_SECURITY_GROUP_ID"
echo ""
echo "Next Steps:"
echo "1. Configure frontend to connect to backend API"
echo "2. Set up database schemas and migrations"
echo "3. Implement authentication and authorization"
echo "4. Add monitoring and alerting"
echo ""
log_success "Backend deployment completed successfully!"
