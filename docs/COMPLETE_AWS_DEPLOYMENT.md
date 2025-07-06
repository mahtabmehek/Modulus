# 🚀 Complete AWS Deployment Guide for Modulus LMS

Deploy your complete Modulus LMS with database, virtual labs, and CI/CD pipeline on AWS.

## 🎯 What We'll Deploy

- **Frontend**: Next.js app on ECS/Fargate
- **Database**: PostgreSQL on RDS
- **Virtual Labs**: Kubernetes cluster for isolated environments
- **Storage**: S3 for static assets and lab resources
- **CI/CD**: GitHub Actions → ECR → ECS
- **Security**: VPC, Security Groups, IAM roles
- **Monitoring**: CloudWatch, ALB health checks

## 📋 Prerequisites

### Install Required Tools
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Docker
# Follow Docker installation for your OS

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

### AWS Account Setup
```bash
# Configure AWS CLI with your credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (e.g., us-west-2), Output format (json)

# Verify setup
aws sts get-caller-identity
```

## 🏗️ Step 1: Create Infrastructure

### 1.1 Create VPC and Networking

Create the network foundation:

```bash
# Set variables
export AWS_REGION=us-west-2
export CLUSTER_NAME=modulus-cluster
export VPC_NAME=modulus-vpc

# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=modulus-vpc}]' \
  --query 'Vpc.VpcId' --output text)

echo "VPC ID: $VPC_ID"

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=modulus-igw}]' \
  --query 'InternetGateway.InternetGatewayId' --output text)

# Attach IGW to VPC
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Create Subnets (Public)
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

# Create Subnets (Private)
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

echo "Subnets created:"
echo "Public 1: $PUBLIC_SUBNET_1"
echo "Public 2: $PUBLIC_SUBNET_2"
echo "Private 1: $PRIVATE_SUBNET_1"
echo "Private 2: $PRIVATE_SUBNET_2"
```

### 1.2 Create Security Groups

```bash
# Web tier security group
WEB_SG=$(aws ec2 create-security-group \
  --group-name modulus-web-sg \
  --description "Security group for Modulus web tier" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

# Allow HTTP/HTTPS from anywhere
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

# Database security group
DB_SG=$(aws ec2 create-security-group \
  --group-name modulus-db-sg \
  --description "Security group for Modulus database" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

# Allow PostgreSQL from web tier
aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG \
  --protocol tcp \
  --port 5432 \
  --source-group $WEB_SG

echo "Security Groups created:"
echo "Web SG: $WEB_SG"
echo "DB SG: $DB_SG"
```

## 🗄️ Step 2: Create Database

### 2.1 Create RDS Subnet Group

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name modulus-db-subnet-group \
  --db-subnet-group-description "Subnet group for Modulus database" \
  --subnet-ids $PRIVATE_SUBNET_1 $PRIVATE_SUBNET_2 \
  --tags Key=Name,Value=modulus-db-subnet-group
```

### 2.2 Create PostgreSQL Database

```bash
# Generate a secure password
DB_PASSWORD=$(openssl rand -base64 32)
echo "Database password: $DB_PASSWORD"
echo "SAVE THIS PASSWORD - you'll need it for the application!"

# Create RDS instance
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
  --storage-encrypted \
  --tags Key=Name,Value=modulus-database

echo "Database creation started. This will take 10-15 minutes..."

# Wait for database to be available
aws rds wait db-instance-available --db-instance-identifier modulus-db

# Get database endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier modulus-db \
  --query 'DBInstances[0].Endpoint.Address' --output text)

echo "Database endpoint: $DB_ENDPOINT"
```

## 📦 Step 3: Create S3 Buckets

```bash
# Create unique suffix for bucket names
BUCKET_SUFFIX=$(date +%s)

# Static assets bucket
STATIC_BUCKET="modulus-static-${BUCKET_SUFFIX}"
aws s3 mb s3://$STATIC_BUCKET --region $AWS_REGION

# User uploads bucket
UPLOADS_BUCKET="modulus-uploads-${BUCKET_SUFFIX}"
aws s3 mb s3://$UPLOADS_BUCKET --region $AWS_REGION

# Lab resources bucket
LAB_BUCKET="modulus-labs-${BUCKET_SUFFIX}"
aws s3 mb s3://$LAB_BUCKET --region $AWS_REGION

# Configure bucket policies for web access
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

echo "S3 Buckets created:"
echo "Static: $STATIC_BUCKET"
echo "Uploads: $UPLOADS_BUCKET"
echo "Labs: $LAB_BUCKET"
```

## 🐳 Step 4: Setup Container Infrastructure

### 4.1 Create ECR Repositories

```bash
# Create ECR repository for the main app
aws ecr create-repository \
  --repository-name modulus-app \
  --region $AWS_REGION

# Get ECR login token
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

ECR_REPO=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/modulus-app

echo "ECR Repository: $ECR_REPO"
```

### 4.2 Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name modulus-cluster \
  --capacity-providers FARGATE \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --tags key=Name,value=modulus-cluster

echo "ECS Cluster created: modulus-cluster"
```

### 4.3 Create Application Load Balancer

```bash
# Create Application Load Balancer
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name modulus-alb \
  --subnets $PUBLIC_SUBNET_1 $PUBLIC_SUBNET_2 \
  --security-groups $WEB_SG \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Create target group
TG_ARN=$(aws elbv2 create-target-group \
  --name modulus-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path / \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' --output text)

echo "Load Balancer DNS: $ALB_DNS"
```

## 🚀 Step 5: Deploy Application

### 5.1 Create Dockerfile

Create this in your project root:

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 5.2 Build and Push Docker Image

```bash
# Build Docker image
docker build -t modulus-app .

# Tag for ECR
docker tag modulus-app:latest $ECR_REPO:latest

# Push to ECR
docker push $ECR_REPO:latest

echo "Docker image pushed to ECR"
```

### 5.3 Create ECS Task Definition

```bash
# Create task execution role
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

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create task definition
cat > task-definition.json << EOF
{
  "family": "modulus-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "modulus-app",
      "image": "$ECR_REPO:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://modulusadmin:$DB_PASSWORD@$DB_ENDPOINT:5432/postgres"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "value": "$(openssl rand -base64 32)"
        },
        {
          "name": "AWS_REGION",
          "value": "$AWS_REGION"
        },
        {
          "name": "S3_BUCKET_STATIC",
          "value": "$STATIC_BUCKET"
        },
        {
          "name": "S3_BUCKET_UPLOADS",
          "value": "$UPLOADS_BUCKET"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/modulus-task",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/modulus-task

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### 5.4 Create ECS Service

```bash
# Create ECS service
aws ecs create-service \
  --cluster modulus-cluster \
  --service-name modulus-service \
  --task-definition modulus-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNET_1,$PRIVATE_SUBNET_2],securityGroups=[$WEB_SG],assignPublicIp=DISABLED}" \
  --load-balancers targetGroupArn=$TG_ARN,containerName=modulus-app,containerPort=3000

echo "ECS Service created. Waiting for tasks to start..."

# Wait for service to be stable
aws ecs wait services-stable --cluster modulus-cluster --services modulus-service

echo "✅ Application deployed successfully!"
echo "🌐 Access your app at: http://$ALB_DNS"
```

## 🧪 Step 6: Setup Virtual Labs (Kubernetes)

### 6.1 Create EKS Cluster for Labs

```bash
# Create EKS cluster for isolated lab environments
eksctl create cluster \
  --name modulus-labs-cluster \
  --version 1.28 \
  --region $AWS_REGION \
  --nodegroup-name lab-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 10 \
  --vpc-private-subnets $PRIVATE_SUBNET_1,$PRIVATE_SUBNET_2 \
  --vpc-public-subnets $PUBLIC_SUBNET_1,$PUBLIC_SUBNET_2 \
  --managed

echo "EKS cluster for labs created successfully!"
```

### 6.2 Deploy Lab Infrastructure

```bash
# Create namespace for labs
kubectl create namespace modulus-labs

# Create lab deployment template
cat > lab-deployment-template.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: \${LAB_NAME}
  namespace: modulus-labs
spec:
  replicas: 1
  selector:
    matchLabels:
      app: \${LAB_NAME}
  template:
    metadata:
      labels:
        app: \${LAB_NAME}
    spec:
      containers:
      - name: lab-environment
        image: ubuntu:20.04
        command: ["/bin/bash"]
        args: ["-c", "while true; do sleep 30; done;"]
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        securityContext:
          runAsNonRoot: false
          allowPrivilegeEscalation: true
---
apiVersion: v1
kind: Service
metadata:
  name: \${LAB_NAME}-service
  namespace: modulus-labs
spec:
  selector:
    app: \${LAB_NAME}
  ports:
    - protocol: TCP
      port: 22
      targetPort: 22
  type: ClusterIP
EOF

echo "Lab infrastructure template created"
```

## 🔄 Step 7: Setup CI/CD Pipeline

### 7.1 Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

env:
  AWS_REGION: us-west-2
  ECR_REPOSITORY: modulus-app
  ECS_SERVICE: modulus-service
  ECS_CLUSTER: modulus-cluster
  ECS_TASK_DEFINITION: task-definition.json

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    environment: production

    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: \${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build, tag, and push image to Amazon ECR
      id: build-image
      env:
        ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: \${{ github.sha }}
      run: |
        docker build -t \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG .
        docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG
        echo "image=\$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG" >> \$GITHUB_OUTPUT

    - name: Fill in the new image ID in the Amazon ECS task definition
      id: task-def
      uses: aws-actions/amazon-ecs-render-task-definition@v1
      with:
        task-definition: \${{ env.ECS_TASK_DEFINITION }}
        container-name: modulus-app
        image: \${{ steps.build-image.outputs.image }}

    - name: Deploy Amazon ECS task definition
      uses: aws-actions/amazon-ecs-deploy-task-definition@v1
      with:
        task-definition: \${{ steps.task-def.outputs.task-definition }}
        service: \${{ env.ECS_SERVICE }}
        cluster: \${{ env.ECS_CLUSTER }}
        wait-for-service-stability: true
```

### 7.2 Add GitHub Secrets

In your GitHub repository settings, add these secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## 📊 Step 8: Setup Monitoring

### 8.1 Create CloudWatch Dashboard

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "Modulus-LMS-Dashboard" \
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "modulus-service"],
            [".", "MemoryUtilization", ".", "."]
          ],
          "period": 300,
          "stat": "Average",
          "region": "us-west-2",
          "title": "ECS Service Metrics"
        }
      },
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "modulus-db"],
            [".", "DatabaseConnections", ".", "."]
          ],
          "period": 300,
          "stat": "Average",
          "region": "us-west-2",
          "title": "Database Metrics"
        }
      }
    ]
  }'

echo "CloudWatch dashboard created"
```

## 🎉 Deployment Complete!

### 📝 Summary of What Was Deployed:

1. **✅ VPC Infrastructure**: Private/public subnets, security groups
2. **✅ Database**: PostgreSQL RDS with backups and encryption
3. **✅ Storage**: S3 buckets for static assets, uploads, and lab resources
4. **✅ Application**: ECS Fargate service with load balancer
5. **✅ Virtual Labs**: EKS cluster for isolated lab environments
6. **✅ CI/CD**: GitHub Actions pipeline for automated deployments
7. **✅ Monitoring**: CloudWatch dashboards and logging

### 🔗 Access Your Application:

- **Main App**: `http://$ALB_DNS`
- **AWS Console**: Monitor resources in AWS Console
- **Logs**: Check CloudWatch logs for debugging

### 🔧 Next Steps:

1. **Domain Setup**: Configure Route 53 for custom domain
2. **SSL Certificate**: Add ACM certificate to load balancer
3. **Database Migration**: Run initial database schema setup
4. **Lab Images**: Create custom Docker images for specific labs
5. **Scaling**: Configure auto-scaling policies

### 💰 Cost Estimate:

- **RDS (t3.micro)**: ~$15-20/month
- **ECS Fargate**: ~$30-50/month
- **EKS**: ~$75/month + nodes
- **Load Balancer**: ~$20/month
- **S3**: Pay per usage (~$5-15/month)
- **Total**: ~$145-180/month

### 🛠️ Troubleshooting:

If deployment fails:
1. Check CloudWatch logs: `/ecs/modulus-task`
2. Verify security group rules
3. Check database connectivity
4. Validate environment variables

**Your Modulus LMS is now live on AWS! 🚀**
