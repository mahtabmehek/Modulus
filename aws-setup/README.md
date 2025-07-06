# AWS Deployment Setup Scripts

This directory contains scripts to set up AWS infrastructure for Modulus LMS deployment.

## Quick Setup

1. **Configure AWS CLI**:
   ```bash
   aws configure
   ```

2. **Run the appropriate setup script**:
   ```bash
   # For ECS deployment
   ./setup-ecs.sh
   
   # For Elastic Beanstalk deployment
   ./setup-beanstalk.sh
   
   # For EC2 deployment
   ./setup-ec2.sh
   ```

3. **Set up GitHub Secrets** (required for GitHub Actions):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET` (for EC2 deployment)
   - `EC2_INSTANCE_TAG` (for EC2 deployment)

## Deployment Options

### 1. ECS (Recommended for Production)
- **File**: `.github/workflows/deploy-aws-ecs.yml`
- **Setup**: `./aws-setup/setup-ecs.sh`
- **Features**: Auto-scaling, load balancing, zero-downtime deployments

### 2. Elastic Beanstalk (Easiest)
- **File**: `.github/workflows/deploy-aws-beanstalk.yml`
- **Setup**: `./aws-setup/setup-beanstalk.sh`
- **Features**: Managed platform, easy configuration

### 3. EC2 (Custom Control)
- **File**: `.github/workflows/deploy-aws-ec2.yml`
- **Setup**: `./aws-setup/setup-ec2.sh`
- **Features**: Full control, custom configuration

## GitHub Actions Workflow

1. **Push to master branch** triggers deployment
2. **Build** the Next.js application
3. **Deploy** to your chosen AWS service
4. **Monitor** deployment status in GitHub Actions

## Cost Estimation

- **ECS**: ~$20-50/month (Fargate + ALB)
- **Elastic Beanstalk**: ~$15-30/month (t3.micro + ALB)
- **EC2**: ~$10-25/month (t3.micro + storage)

*Costs may vary based on usage and AWS region.*
