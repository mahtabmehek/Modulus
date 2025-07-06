# 🚀 Modulus LMS - Deployment Guide

## Single Script Deployment

This project now uses **ONE UNIFIED SCRIPT** for all deployment tasks to avoid confusion and conflicts.

### 📋 Prerequisites

1. **AWS Account** with Free Tier access
2. **GitHub Secrets** configured:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### 🚀 Automatic Deployment

Simply push to the `master` branch and GitHub Actions will automatically:

1. ✅ Validate AWS access
2. 🏗️ Create infrastructure (VPC, Security Groups, ALB)
3. 📦 Build Docker image and push to ECR
4. 🚀 Deploy to ECS Fargate
5. ⚖️ Configure load balancer and health checks
6. 📊 Provide deployment summary

### 🎯 Single Script: `deploy.sh`

The unified deployment script handles everything:

- **Infrastructure**: VPC, Security Groups, ALB, Target Groups
- **Containers**: ECR repository, Docker build/push
- **Services**: ECS cluster, task definition, service
- **Monitoring**: CloudWatch logs, health checks
- **Cleanup**: Removes conflicts, handles errors

### 📊 What Gets Created

| Resource | Name | Purpose |
|----------|------|---------|
| ECS Cluster | `modulus-cluster` | Container orchestration |
| ECS Service | `modulus-service` | App service management |
| Load Balancer | `modulus-alb` | Traffic distribution |
| Target Group | `modulus-tg` | Health check endpoints |
| ECR Repository | `modulus-lms` | Container image storage |
| Security Group | `modulus-sg` | Network access control |

### 🔗 Access Your App

After deployment (2-3 minutes):

1. Go to **AWS Console** → **EC2** → **Load Balancers**
2. Find `modulus-alb`
3. Copy the **DNS name**
4. Access your app at: `http://[ALB-DNS-NAME]`

### 🛠️ Manual Deployment

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 🗑️ Cleanup Resources

```bash
# Delete ECS service
aws ecs delete-service --cluster modulus-cluster --service modulus-service --force --region eu-west-2

# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn [ALB-ARN] --region eu-west-2

# Delete cluster
aws ecs delete-cluster --cluster modulus-cluster --region eu-west-2
```

### 🔧 Troubleshooting

1. **Check GitHub Actions** for build errors
2. **AWS Console** → **CloudWatch** → **Log Groups** → `/ecs/modulus`
3. **ALB Target Groups** → Check health status
4. Run `./monitor-deployment.sh` for status check

### 💰 Cost Optimization

- Uses **AWS Free Tier** resources
- **Fargate**: 256 CPU, 512 MB memory
- **ALB**: Minimal usage within free limits
- **ECR**: 500 MB storage free

---

**Modulus by mahtabmehek** - Cybersecurity Education Platform
