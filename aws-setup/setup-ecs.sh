#!/bin/bash

# Modulus LMS - ECS Setup Script
echo "🚀 Setting up AWS ECS for Modulus LMS..."

# Variables
CLUSTER_NAME="modulus-cluster"
SERVICE_NAME="modulus-service"
TASK_FAMILY="modulus-task"
ECR_REPO="modulus-lms"
REGION="us-east-1"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $ACCOUNT_ID"

# Create ECR Repository
echo "📦 Creating ECR repository..."
aws ecr create-repository --repository-name $ECR_REPO --region $REGION 2>/dev/null || echo "ECR repository already exists"

# Create ECS Cluster
echo "🏗️ Creating ECS cluster..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $REGION

# Create CloudWatch Log Group
echo "📊 Creating CloudWatch log group..."
aws logs create-log-group --log-group-name "/ecs/modulus-app" --region $REGION 2>/dev/null || echo "Log group already exists"

# Create IAM roles
echo "🔐 Creating IAM roles..."

# ECS Task Execution Role
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

aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://trust-policy.json 2>/dev/null || echo "Role already exists"
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# ECS Task Role (for application to access AWS services)
aws iam create-role --role-name ecsTaskRole --assume-role-policy-document file://trust-policy.json 2>/dev/null || echo "Role already exists"

# Create task role policy for AWS SDK access
cat > task-role-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "eks:DescribeCluster",
        "eks:ListClusters",
        "rds:DescribeDBInstances",
        "s3:GetObject",
        "s3:ListBucket",
        "ec2:DescribeInstances",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeTargetGroups"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy --role-name ecsTaskRole --policy-name ModulusAWSAccess --policy-document file://task-role-policy.json

# Create VPC and subnets (if needed)
echo "🌐 Setting up VPC..."
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text --region $REGION 2>/dev/null || aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $REGION)
echo "VPC ID: $VPC_ID"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text --region $REGION)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Create subnets
SUBNET1_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone ${REGION}a --query 'Subnet.SubnetId' --output text)
SUBNET2_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone ${REGION}b --query 'Subnet.SubnetId' --output text)

# Create route table
ROUTE_TABLE_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $ROUTE_TABLE_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID

# Associate subnets with route table
aws ec2 associate-route-table --subnet-id $SUBNET1_ID --route-table-id $ROUTE_TABLE_ID
aws ec2 associate-route-table --subnet-id $SUBNET2_ID --route-table-id $ROUTE_TABLE_ID

# Create Security Group
SECURITY_GROUP_ID=$(aws ec2 create-security-group --group-name modulus-sg --description "Modulus LMS Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

# Create Application Load Balancer
echo "⚖️ Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name modulus-alb \
  --subnets $SUBNET1_ID $SUBNET2_ID \
  --security-groups $SECURITY_GROUP_ID \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Create Target Group
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
  --name modulus-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path / \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Create ALB Listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN

# Update task definition with correct account ID
sed -i "s/ACCOUNT_ID/$ACCOUNT_ID/g" ecs-task-definition.json

# Register task definition
echo "📋 Registering ECS task definition..."
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json --region $REGION

# Create ECS Service
echo "🏃 Creating ECS service..."
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --task-definition $TASK_FAMILY \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=$TARGET_GROUP_ARN,containerName=modulus-app,containerPort=3000 \
  --region $REGION

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text)

# Cleanup temporary files
rm -f trust-policy.json task-role-policy.json

echo "✅ ECS setup complete!"
echo ""
echo "📋 Summary:"
echo "  - ECS Cluster: $CLUSTER_NAME"
echo "  - ECR Repository: $ECR_REPO"
echo "  - ALB DNS: http://$ALB_DNS"
echo ""
echo "🔧 Next steps:"
echo "1. Set up GitHub secrets:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "2. Push to master branch to trigger deployment"
echo "3. Monitor deployment in GitHub Actions"
echo ""
echo "🌐 Your app will be available at: http://$ALB_DNS"
