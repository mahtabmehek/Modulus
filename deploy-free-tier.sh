#!/bin/bash

# Modulus LMS FREE TIER AWS Deployment Script
# This script deploys only free tier eligible services to minimize costs

set -e

echo "🆓 Starting Modulus LMS FREE TIER AWS Deployment..."
echo "💰 Target cost: $0-15/month (mostly free for first 12 months)"

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
export AWS_REGION=${AWS_REGION:-us-east-1}  # us-east-1 has the most free tier benefits
export CLUSTER_NAME=modulus-free-cluster
export VPC_NAME=modulus-free-vpc

echo "📍 Deploying to region: $AWS_REGION (best for free tier)"

# Get default VPC (free)
echo "🏗️  Using default VPC (free tier)..."
DEFAULT_VPC=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)

if [ "$DEFAULT_VPC" = "None" ] || [ "$DEFAULT_VPC" = "" ]; then
    echo "❌ No default VPC found. Creating one..."
    aws ec2 create-default-vpc
    DEFAULT_VPC=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
fi

echo "✅ Using VPC: $DEFAULT_VPC"

# Get default subnets (free)
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC" --query 'Subnets[*].SubnetId' --output text)
SUBNET_ARRAY=($SUBNETS)
PUBLIC_SUBNET_1=${SUBNET_ARRAY[0]}
PUBLIC_SUBNET_2=${SUBNET_ARRAY[1]:-$PUBLIC_SUBNET_1}

echo "✅ Using subnets: $PUBLIC_SUBNET_1, $PUBLIC_SUBNET_2"

# Create security groups (free)
echo "🔒 Creating security groups (free)..."
WEB_SG=$(aws ec2 create-security-group \
  --group-name modulus-free-web-sg \
  --description "Free tier security group for Modulus web" \
  --vpc-id $DEFAULT_VPC \
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
  --group-name modulus-free-db-sg \
  --description "Free tier security group for Modulus database" \
  --vpc-id $DEFAULT_VPC \
  --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG \
  --protocol tcp \
  --port 5432 \
  --source-group $WEB_SG

echo "✅ Security groups created"

# Create RDS database (FREE TIER - 750 hours/month)
echo "🗄️  Creating FREE TIER database..."
DB_PASSWORD=$(openssl rand -base64 16)  # Shorter password for demo

# Create default DB subnet group if it doesn't exist
aws rds create-db-subnet-group \
  --db-subnet-group-name modulus-free-db-subnet \
  --db-subnet-group-description "Free tier subnet group" \
  --subnet-ids $PUBLIC_SUBNET_1 $PUBLIC_SUBNET_2 \
  --tags Key=Name,Value=modulus-free-db-subnet 2>/dev/null || true

aws rds create-db-instance \
  --db-instance-identifier modulus-free-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 13.13 \
  --master-username modulusadmin \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids $DB_SG \
  --db-subnet-group-name modulus-free-db-subnet \
  --backup-retention-period 1 \
  --no-multi-az \
  --no-storage-encrypted \
  --tags Key=Name,Value=modulus-free-database

echo "🔄 FREE TIER database creation started..."

# Create S3 buckets (FREE - 5GB storage)
echo "📦 Creating FREE TIER S3 buckets..."
BUCKET_SUFFIX=$(date +%s)
STATIC_BUCKET="modulus-free-static-${BUCKET_SUFFIX}"
UPLOADS_BUCKET="modulus-free-uploads-${BUCKET_SUFFIX}"

aws s3 mb s3://$STATIC_BUCKET --region $AWS_REGION
aws s3 mb s3://$UPLOADS_BUCKET --region $AWS_REGION

# Configure public read for static bucket
cat > static-bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$STATIC_BUCKET/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket $STATIC_BUCKET --policy file://static-bucket-policy.json
rm static-bucket-policy.json

echo "✅ FREE TIER S3 buckets created"

# Create ECR repository (FREE - 500MB)
echo "🐳 Creating FREE TIER ECR repository..."
aws ecr create-repository \
  --repository-name modulus-free-app \
  --region $AWS_REGION

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/modulus-free-app"

echo "✅ ECR repository created: $ECR_REPO"

# Skip Load Balancer for now (costs $16/month - not free)
# We'll use ECS service with direct public IP instead

# Create ECS cluster (FREE)
echo "⚙️  Creating FREE TIER ECS cluster..."
aws ecs create-cluster \
  --cluster-name modulus-free-cluster \
  --capacity-providers FARGATE \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --tags key=Name,value=modulus-free-cluster

echo "✅ ECS cluster created"

# Wait for database to be ready
echo "⏳ Waiting for database to be available..."
aws rds wait db-instance-available --db-instance-identifier modulus-free-db

DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier modulus-free-db \
  --query 'DBInstances[0].Endpoint.Address' --output text)

echo "✅ Database is ready: $DB_ENDPOINT"

# Create IAM role for ECS task execution (free)
echo "🔐 Creating IAM roles..."

# Check if role already exists
if ! aws iam get-role --role-name ecsTaskExecutionRole >/dev/null 2>&1; then
    aws iam create-role \
      --role-name ecsTaskExecutionRole \
      --assume-role-policy-document '{
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
      }'

    aws iam attach-role-policy \
      --role-name ecsTaskExecutionRole \
      --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
fi

echo "✅ IAM roles configured"

# Save FREE TIER configuration
cat > free-tier-config.env << EOF
# Modulus LMS FREE TIER Deployment Configuration
# Generated on $(date)
# 💰 Estimated cost: $0-15/month (mostly free for 12 months)

# AWS Infrastructure
AWS_REGION=$AWS_REGION
VPC_ID=$DEFAULT_VPC
PUBLIC_SUBNET_1=$PUBLIC_SUBNET_1
PUBLIC_SUBNET_2=$PUBLIC_SUBNET_2
WEB_SG=$WEB_SG
DB_SG=$DB_SG

# Database (FREE TIER - 750 hours/month)
DB_ENDPOINT=$DB_ENDPOINT
DB_PASSWORD=$DB_PASSWORD

# S3 Buckets (FREE TIER - 5GB storage)
STATIC_BUCKET=$STATIC_BUCKET
UPLOADS_BUCKET=$UPLOADS_BUCKET

# Container Infrastructure (FREE TIER)
ECR_REPO=$ECR_REPO
ACCOUNT_ID=$ACCOUNT_ID

# Database URL for application
DATABASE_URL=postgresql://modulusadmin:$DB_PASSWORD@$DB_ENDPOINT:5432/postgres

# Free Tier Limitations
# - RDS: 750 hours/month (covers 1 db.t3.micro instance)
# - ECS: No charges for the service itself
# - S3: 5GB free storage + 20,000 GET requests
# - ECR: 500MB free storage
# - CloudWatch: Basic monitoring included
EOF

echo ""
echo "🎉 FREE TIER infrastructure deployment completed!"
echo ""
echo "💰 Cost Breakdown:"
echo "   RDS (db.t3.micro): FREE for 12 months (750 hours/month)"
echo "   ECS Fargate: ~$8-12/month (0.25 vCPU, 0.5GB RAM)"
echo "   S3: FREE for 5GB storage"
echo "   ECR: FREE for 500MB"
echo "   Data Transfer: FREE for 15GB/month outbound"
echo "   CloudWatch: FREE basic monitoring"
echo "   Route 53: $0.50/month for hosted zone (optional)"
echo ""
echo "📊 Total Monthly Cost: ~$8-15/month"
echo ""
echo "📄 Configuration saved to: free-tier-config.env"
echo ""
echo "🔐 IMPORTANT: Database password saved in free-tier-config.env"
echo "   Keep this file secure and don't commit it to version control!"
echo ""
echo "🚀 Next steps:"
echo "   1. Build and push your Docker image to ECR"
echo "   2. Create ECS task definition and service"
echo "   3. Configure your application environment variables"
echo ""
echo "🎓 Perfect for: Testing, development, small classes (1-50 students)"
echo ""
echo "📖 See FREE_TIER_DEPLOYMENT.md for next steps"
echo ""
echo "⚠️  Note: No load balancer included to save costs."
echo "   Your app will be accessible via ECS public IP."
echo "   Add ALB later when you need custom domain/SSL."
EOF
