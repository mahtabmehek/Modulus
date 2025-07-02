#!/bin/bash

# Modulus LMS AWS Deployment Script
# This script automates the entire AWS infrastructure setup

set -e

echo "🚀 Starting Modulus LMS AWS Deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Set variables
export AWS_REGION=${AWS_REGION:-us-west-2}
export CLUSTER_NAME=modulus-cluster
export VPC_NAME=modulus-vpc

echo "📍 Deploying to region: $AWS_REGION"

# Create VPC
echo "🏗️  Creating VPC and networking..."
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=modulus-vpc}]' \
  --query 'Vpc.VpcId' --output text)

echo "✅ VPC created: $VPC_ID"

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=modulus-igw}]' \
  --query 'InternetGateway.InternetGatewayId' --output text)

aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Create subnets
echo "🌐 Creating subnets..."
PUBLIC_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ${AWS_REGION}a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=modulus-public-1}]' \
  --query 'Subnet.SubnetId' --output text)

PUBLIC_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ${AWS_REGION}b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=modulus-public-2}]' \
  --query 'Subnet.SubnetId' --output text)

PRIVATE_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.10.0/24 \
  --availability-zone ${AWS_REGION}a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=modulus-private-1}]' \
  --query 'Subnet.SubnetId' --output text)

PRIVATE_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.20.0/24 \
  --availability-zone ${AWS_REGION}b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=modulus-private-2}]' \
  --query 'Subnet.SubnetId' --output text)

echo "✅ Subnets created"

# Create security groups
echo "🔒 Creating security groups..."
WEB_SG=$(aws ec2 create-security-group \
  --group-name modulus-web-sg \
  --description "Security group for Modulus web tier" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress \
  --group-id $WEB_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $WEB_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $WEB_SG \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0

DB_SG=$(aws ec2 create-security-group \
  --group-name modulus-db-sg \
  --description "Security group for Modulus database" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG \
  --protocol tcp \
  --port 5432 \
  --source-group $WEB_SG

echo "✅ Security groups created"

# Create database
echo "🗄️  Creating database..."
DB_PASSWORD=$(openssl rand -base64 32)

aws rds create-db-subnet-group \
  --db-subnet-group-name modulus-db-subnet-group \
  --db-subnet-group-description "Subnet group for Modulus database" \
  --subnet-ids $PRIVATE_SUBNET_1 $PRIVATE_SUBNET_2

aws rds create-db-instance \
  --db-instance-identifier modulus-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.9 \
  --master-username modulusadmin \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids $DB_SG \
  --db-subnet-group-name modulus-db-subnet-group \
  --backup-retention-period 7 \
  --storage-encrypted

echo "🔄 Database creation started (this will take 10-15 minutes)..."

# Create S3 buckets
echo "📦 Creating S3 buckets..."
BUCKET_SUFFIX=$(date +%s)
STATIC_BUCKET="modulus-static-${BUCKET_SUFFIX}"
UPLOADS_BUCKET="modulus-uploads-${BUCKET_SUFFIX}"
LAB_BUCKET="modulus-labs-${BUCKET_SUFFIX}"

aws s3 mb s3://$STATIC_BUCKET --region $AWS_REGION
aws s3 mb s3://$UPLOADS_BUCKET --region $AWS_REGION
aws s3 mb s3://$LAB_BUCKET --region $AWS_REGION

echo "✅ S3 buckets created"

# Create ECR repository
echo "🐳 Creating ECR repository..."
aws ecr create-repository \
  --repository-name modulus-app \
  --region $AWS_REGION

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/modulus-app"

echo "✅ ECR repository created: $ECR_REPO"

# Create ECS cluster
echo "⚙️  Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name modulus-cluster \
  --capacity-providers FARGATE \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1

echo "✅ ECS cluster created"

# Create Application Load Balancer
echo "⚖️  Creating load balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name modulus-alb \
  --subnets $PUBLIC_SUBNET_1 $PUBLIC_SUBNET_2 \
  --security-groups $WEB_SG \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

TG_ARN=$(aws elbv2 create-target-group \
  --name modulus-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path / \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' --output text)

echo "✅ Load balancer created: $ALB_DNS"

# Wait for database to be ready
echo "⏳ Waiting for database to be available..."
aws rds wait db-instance-available --db-instance-identifier modulus-db

DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier modulus-db \
  --query 'DBInstances[0].Endpoint.Address' --output text)

echo "✅ Database is ready: $DB_ENDPOINT"

# Save configuration
cat > deployment-config.env << EOF
# Modulus LMS Deployment Configuration
# Generated on $(date)

# AWS Infrastructure
AWS_REGION=$AWS_REGION
VPC_ID=$VPC_ID
PUBLIC_SUBNET_1=$PUBLIC_SUBNET_1
PUBLIC_SUBNET_2=$PUBLIC_SUBNET_2
PRIVATE_SUBNET_1=$PRIVATE_SUBNET_1
PRIVATE_SUBNET_2=$PRIVATE_SUBNET_2
WEB_SG=$WEB_SG
DB_SG=$DB_SG

# Database
DB_ENDPOINT=$DB_ENDPOINT
DB_PASSWORD=$DB_PASSWORD

# S3 Buckets
STATIC_BUCKET=$STATIC_BUCKET
UPLOADS_BUCKET=$UPLOADS_BUCKET
LAB_BUCKET=$LAB_BUCKET

# Container Infrastructure
ECR_REPO=$ECR_REPO
ALB_DNS=$ALB_DNS
ALB_ARN=$ALB_ARN
TG_ARN=$TG_ARN

# Database URL for application
DATABASE_URL=postgresql://modulusadmin:$DB_PASSWORD@$DB_ENDPOINT:5432/postgres
EOF

echo ""
echo "🎉 Infrastructure deployment completed!"
echo ""
echo "📋 Summary:"
echo "   VPC: $VPC_ID"
echo "   Database: $DB_ENDPOINT"
echo "   Load Balancer: $ALB_DNS"
echo "   ECR Repository: $ECR_REPO"
echo ""
echo "📄 Configuration saved to: deployment-config.env"
echo ""
echo "🔐 IMPORTANT: Database password saved in deployment-config.env"
echo "   Keep this file secure and don't commit it to version control!"
echo ""
echo "🚀 Next steps:"
echo "   1. Build and push your Docker image to ECR"
echo "   2. Create ECS task definition and service"
echo "   3. Configure your application with the environment variables"
echo ""
echo "📖 See COMPLETE_AWS_DEPLOYMENT.md for detailed next steps"
