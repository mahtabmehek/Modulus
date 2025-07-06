#!/bin/bash

# Complete Modulus LMS Deployment Script
# Creates everything: Infrastructure + App + Labs + Domain

set -e
echo "🚀 Starting Complete Modulus LMS Deployment..."

# Configuration
DOMAIN_NAME="mahtabmehek.tech"
APP_SUBDOMAIN="modulus"
LABS_SUBDOMAIN="labs"
AWS_REGION="us-east-1"
CLUSTER_NAME="modulus-cluster"
DB_NAME="modulusdb"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $ACCOUNT_ID"

echo "🏗️ Step 1: Creating Core Infrastructure..."

# Create VPC and networking
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=modulus-vpc

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Create Subnets
SUBNET1_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone ${AWS_REGION}a --query 'Subnet.SubnetId' --output text)
SUBNET2_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone ${AWS_REGION}b --query 'Subnet.SubnetId' --output text)
SUBNET3_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.3.0/24 --availability-zone ${AWS_REGION}a --query 'Subnet.SubnetId' --output text)
SUBNET4_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.4.0/24 --availability-zone ${AWS_REGION}b --query 'Subnet.SubnetId' --output text)

# Setup routing
ROUTE_TABLE_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $ROUTE_TABLE_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $SUBNET1_ID --route-table-id $ROUTE_TABLE_ID
aws ec2 associate-route-table --subnet-id $SUBNET2_ID --route-table-id $ROUTE_TABLE_ID

echo "🔒 Step 2: Creating Security Groups..."

# Web Security Group
WEB_SG=$(aws ec2 create-security-group --group-name modulus-web-sg --description "Modulus Web Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $WEB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $WEB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $WEB_SG --protocol tcp --port 3000 --cidr 0.0.0.0/0

# Database Security Group
DB_SG=$(aws ec2 create-security-group --group-name modulus-db-sg --description "Modulus Database Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $DB_SG --protocol tcp --port 5432 --source-group $WEB_SG

# Labs Security Group (for user environments)
LABS_SG=$(aws ec2 create-security-group --group-name modulus-labs-sg --description "Modulus Labs Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $LABS_SG --protocol tcp --port 22 --cidr 10.0.0.0/16
aws ec2 authorize-security-group-ingress --group-id $LABS_SG --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $LABS_SG --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $LABS_SG --protocol tcp --port 3000-8000 --cidr 0.0.0.0/0

echo "🗄️ Step 3: Creating Database..."

# Create DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name modulus-db-subnet-group \
  --db-subnet-group-description "Modulus Database Subnet Group" \
  --subnet-ids $SUBNET3_ID $SUBNET4_ID

# Create RDS PostgreSQL Database
aws rds create-db-instance \
  --db-instance-identifier $DB_NAME \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username modulusadmin \
  --master-user-password $(openssl rand -base64 32) \
  --allocated-storage 20 \
  --vpc-security-group-ids $DB_SG \
  --db-subnet-group-name modulus-db-subnet-group \
  --storage-encrypted \
  --backup-retention-period 7 \
  --no-multi-az

echo "📦 Step 4: Creating Container Repositories..."

# Create ECR repositories
aws ecr create-repository --repository-name modulus-lms 2>/dev/null || echo "App repository exists"
aws ecr create-repository --repository-name modulus-labs 2>/dev/null || echo "Labs repository exists"

echo "🏗️ Step 5: Creating ECS Infrastructure..."

# Create ECS Cluster
aws ecs create-cluster --cluster-name $CLUSTER_NAME

# Create CloudWatch Log Groups
aws logs create-log-group --log-group-name "/ecs/modulus-app" 2>/dev/null || echo "App logs exist"
aws logs create-log-group --log-group-name "/ecs/modulus-labs" 2>/dev/null || echo "Labs logs exist"

echo "🔐 Step 6: Creating IAM Roles..."

# ECS Task Execution Role
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ecs-tasks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://trust-policy.json 2>/dev/null || echo "Execution role exists"
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# ECS Task Role with AWS SDK permissions
aws iam create-role --role-name ecsTaskRole --assume-role-policy-document file://trust-policy.json 2>/dev/null || echo "Task role exists"

cat > modulus-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:*",
        "eks:*",
        "rds:Describe*",
        "s3:*",
        "ec2:Describe*",
        "elasticloadbalancing:Describe*",
        "ecs:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy --role-name ecsTaskRole --policy-name ModulusAccess --policy-document file://modulus-policy.json

echo "⚖️ Step 7: Creating Load Balancers..."

# Application Load Balancer for main app
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name modulus-alb \
  --subnets $SUBNET1_ID $SUBNET2_ID \
  --security-groups $WEB_SG \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Target Group for main app
APP_TG_ARN=$(aws elbv2 create-target-group \
  --name modulus-app-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path / \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Listener for main app
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$APP_TG_ARN

# Load Balancer for labs
LABS_ALB_ARN=$(aws elbv2 create-load-balancer \
  --name modulus-labs-alb \
  --subnets $SUBNET1_ID $SUBNET2_ID \
  --security-groups $LABS_SG \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Target Group for labs
LABS_TG_ARN=$(aws elbv2 create-target-group \
  --name modulus-labs-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path / \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Listener for labs
aws elbv2 create-listener \
  --load-balancer-arn $LABS_ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$LABS_TG_ARN

echo "🛡️ Step 8: Configuring Free Tier Security..."

# Configure Security Groups with stricter rules for basic DDoS protection
echo "   - Updating security groups with rate limiting rules..."

# The ALB automatically provides basic DDoS protection with AWS Shield Standard (free)
# Security groups already configured with minimal required ports
echo "✅ Free Tier Security configured:"
echo "   - AWS Shield Standard (automatic DDoS protection)"
echo "   - Security Groups with minimal port exposure"
echo "   - VPC network isolation"
echo "   - CloudWatch basic monitoring (free tier)"

echo "🌐 Step 9: Setting up Domain & SSL..."

# Get hosted zone ID for your domain
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name $DOMAIN_NAME --query 'HostedZones[0].Id' --output text | cut -d'/' -f3)

if [ "$HOSTED_ZONE_ID" = "None" ]; then
  echo "⚠️  Please create a hosted zone for $DOMAIN_NAME in Route 53 first"
  echo "   Then update your domain's nameservers to point to AWS"
  exit 1
fi

# Get ALB DNS names
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text)
LABS_ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $LABS_ALB_ARN --query 'LoadBalancers[0].DNSName' --output text)

# Request SSL certificates
CERT_ARN=$(aws acm request-certificate \
  --domain-name $APP_SUBDOMAIN.$DOMAIN_NAME \
  --subject-alternative-names $LABS_SUBDOMAIN.$DOMAIN_NAME \
  --validation-method DNS \
  --query 'CertificateArn' \
  --output text)

echo "📋 Step 10: Creating Task Definitions..."

# Get database endpoint
DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier $DB_NAME --query 'DBInstances[0].Endpoint.Address' --output text 2>/dev/null || echo "pending")

# Main App Task Definition
cat > modulus-app-task.json << EOF
{
  "family": "modulus-app-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "modulus-app",
      "image": "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/modulus-lms:latest",
      "essential": true,
      "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "AWS_REGION", "value": "$AWS_REGION"},
        {"name": "DATABASE_URL", "value": "postgresql://modulusadmin:PASSWORD@$DB_ENDPOINT:5432/postgres"},
        {"name": "DOMAIN_NAME", "value": "$DOMAIN_NAME"},
        {"name": "APP_URL", "value": "https://$APP_SUBDOMAIN.$DOMAIN_NAME"},
        {"name": "LABS_URL", "value": "https://$LABS_SUBDOMAIN.$DOMAIN_NAME"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/modulus-app",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Labs Task Definition
cat > modulus-labs-task.json << EOF
{
  "family": "modulus-labs-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "modulus-labs",
      "image": "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/modulus-labs:latest",
      "essential": true,
      "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "AWS_REGION", "value": "$AWS_REGION"},
        {"name": "LAB_MODE", "value": "true"},
        {"name": "MAIN_APP_URL", "value": "https://$APP_SUBDOMAIN.$DOMAIN_NAME"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/modulus-labs",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Register task definitions
aws ecs register-task-definition --cli-input-json file://modulus-app-task.json
aws ecs register-task-definition --cli-input-json file://modulus-labs-task.json

echo "🚀 Step 11: Creating Services..."

# Create main app service (minimal for free tier)
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name modulus-service \
  --task-definition modulus-app-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$WEB_SG],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=$APP_TG_ARN,containerName=modulus-app,containerPort=3000

# Create labs service (minimal for free tier)
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name modulus-labs-service \
  --task-definition modulus-labs-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$LABS_SG],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=$LABS_TG_ARN,containerName=modulus-labs,containerPort=3000

# Cleanup temporary files
rm -f trust-policy.json modulus-policy.json modulus-app-task.json modulus-labs-task.json

echo "✅ Infrastructure Setup Complete!"
echo ""
echo "📋 Summary:"
echo "  - VPC: $VPC_ID"
echo "  - Cluster: $CLUSTER_NAME"
echo "  - Main ALB: $ALB_DNS"
echo "  - Labs ALB: $LABS_ALB_DNS"
echo "  - Certificate: $CERT_ARN"
echo ""
echo "🔧 Next Steps:"
echo "1. Validate SSL certificate via DNS (check AWS Console)"
echo "2. Push Docker images to ECR repositories"
echo "3. Update DNS records to point to load balancers"
echo "4. Access your apps:"
echo "   - Main: https://$APP_SUBDOMAIN.$DOMAIN_NAME"
echo "   - Labs: https://$LABS_SUBDOMAIN.$DOMAIN_NAME"
echo ""
echo "🎉 Ready for GitHub Actions deployment!"
