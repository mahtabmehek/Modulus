# 🆓 FREE TIER AWS Deployment Guide for Modulus LMS

Deploy your Modulus LMS using only AWS Free Tier services to minimize costs.

## 💰 **Free Tier Cost Breakdown**

### **What's FREE for 12 Months:**
- ✅ **RDS PostgreSQL**: db.t3.micro (750 hours/month) - **$0**
- ✅ **S3 Storage**: 5GB + 20,000 GET requests - **$0**
- ✅ **ECR**: 500MB container storage - **$0**
- ✅ **CloudWatch**: Basic monitoring - **$0**
- ✅ **Data Transfer**: 15GB outbound/month - **$0**

### **What You Pay For:**
- 💵 **ECS Fargate**: ~$8-12/month (minimal container)
- 💵 **Route 53**: $0.50/month (optional - for custom domain)

### **🎯 Total Monthly Cost: $8-15/month**

## 🚀 **Quick Deploy (Free Tier)**

### **Option 1: One-Command Deploy**
```bash
# Make script executable and run
chmod +x deploy-free-tier.sh
./deploy-free-tier.sh
```

### **Option 2: Manual Step-by-Step**

#### **1. Setup AWS CLI**
```bash
# Install AWS CLI (if not installed)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure with your credentials
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)
```

#### **2. Deploy Infrastructure**
```bash
# Set region (us-east-1 has most free tier benefits)
export AWS_REGION=us-east-1

# Run the free tier deployment
./deploy-free-tier.sh
```

#### **3. Build and Deploy Application**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push Docker image
docker build -t modulus-free-app .
docker tag modulus-free-app:latest <ecr-repo-url>:latest
docker push <ecr-repo-url>:latest
```

#### **4. Create ECS Task Definition**
```bash
# Load configuration
source free-tier-config.env

# Create task definition
cat > free-tier-task-def.json << EOF
{
  "family": "modulus-free-task",
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
          "value": "$DATABASE_URL"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "value": "free-tier-secret-key-$(date +%s)"
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
          "awslogs-group": "/ecs/modulus-free-task",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Create log group
aws logs create-log-group --log-group-name /ecs/modulus-free-task

# Register task definition
aws ecs register-task-definition --cli-input-json file://free-tier-task-def.json
```

#### **5. Create ECS Service**
```bash
# Create service with public IP (no load balancer to save cost)
aws ecs create-service \
  --cluster modulus-free-cluster \
  --service-name modulus-free-service \
  --task-definition modulus-free-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$PUBLIC_SUBNET_1],securityGroups=[$WEB_SG],assignPublicIp=ENABLED}"

# Wait for service to be stable
aws ecs wait services-stable --cluster modulus-free-cluster --services modulus-free-service

# Get public IP
TASK_ARN=$(aws ecs list-tasks --cluster modulus-free-cluster --service-name modulus-free-service --query 'taskArns[0]' --output text)
PUBLIC_IP=$(aws ecs describe-tasks --cluster modulus-free-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

echo "🌐 Your app is available at: http://$PUBLIC_IP:3000"
```

## 📊 **Free Tier Limits & Monitoring**

### **Stay Within Free Tier:**
```bash
# Monitor RDS usage (must stay under 750 hours/month)
aws rds describe-db-instances --db-instance-identifier modulus-free-db

# Monitor S3 usage (must stay under 5GB)
aws s3 ls s3://$STATIC_BUCKET --summarize --human-readable --recursive

# Monitor ECR usage (must stay under 500MB)
aws ecr describe-repositories --repository-names modulus-free-app
```

### **Set Up Billing Alerts:**
```bash
# Create billing alarm (optional but recommended)
aws cloudwatch put-metric-alarm \
  --alarm-name "ModulusFreeTierBudget" \
  --alarm-description "Alert when estimated charges exceed $20" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD \
  --evaluation-periods 1
```

## 🎓 **What This Free Tier Setup Includes:**

### ✅ **Perfect For:**
- Development and testing
- Small classes (1-50 students)
- Proof of concept
- Learning AWS
- Portfolio projects

### ⚠️ **Limitations:**
- No load balancer (direct IP access)
- Single ECS task (no auto-scaling)
- No virtual labs (EKS costs extra)
- Limited to 750 DB hours/month
- 5GB S3 storage limit

### 🚀 **Easy Upgrades When Ready:**
- Add Application Load Balancer (+$16/month)
- Enable auto-scaling
- Add EKS for virtual labs (+$73/month)
- Upgrade RDS instance size
- Add CDN (CloudFront)

## 📈 **Scaling Path:**

### **Phase 1: Free Tier (0-50 users)**
- Cost: $8-15/month
- Features: Basic LMS, database, file storage

### **Phase 2: Small Production (50-200 users)**
- Cost: $50-80/month
- Add: Load balancer, auto-scaling, custom domain

### **Phase 3: Full Production (200+ users)**
- Cost: $150-300/month
- Add: Virtual labs, CDN, monitoring, backups

## 🔧 **Free Tier Management Commands:**

### **Check Costs:**
```bash
# View current month's costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost

# View free tier usage
aws support describe-trusted-advisor-checks \
  --language en --query 'checks[?name==`Service Limits`]'
```

### **Scale Down for Even Lower Costs:**
```bash
# Stop ECS service (keeps infrastructure, stops compute costs)
aws ecs update-service \
  --cluster modulus-free-cluster \
  --service modulus-free-service \
  --desired-count 0

# Restart when needed
aws ecs update-service \
  --cluster modulus-free-cluster \
  --service modulus-free-service \
  --desired-count 1
```

### **Cleanup When Done:**
```bash
# Delete everything to stop all charges
aws ecs delete-service --cluster modulus-free-cluster --service modulus-free-service --force
aws ecs delete-cluster --cluster modulus-free-cluster
aws rds delete-db-instance --db-instance-identifier modulus-free-db --skip-final-snapshot
aws s3 rb s3://$STATIC_BUCKET --force
aws s3 rb s3://$UPLOADS_BUCKET --force
aws ecr delete-repository --repository-name modulus-free-app --force
```

## 🎯 **Summary**

Your Modulus LMS can run on AWS for just **$8-15/month** using the free tier!

- ✅ **12 months free database**
- ✅ **5GB free storage**
- ✅ **Free container registry**
- ✅ **Minimal compute costs**
- ✅ **Perfect for getting started**

This gives you a full-featured LMS to test, develop, and prove your concept before scaling up to production levels.

**Ready to deploy? Run: `./deploy-free-tier.sh`** 🚀
