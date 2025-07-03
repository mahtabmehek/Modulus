# 🚀 Automatic GitHub to AWS Deployment Guide

## Overview
This guide shows you how to set up automatic deployment from GitHub to AWS when you push code to your repository.

## 🎯 Deployment Options

### Option 1: AWS ECS (Recommended for Production)
- **Cost**: $5-15/month with free tier
- **Features**: Full containerized deployment, auto-scaling
- **Best for**: Production apps with custom infrastructure needs

### Option 2: Vercel (Easiest & Free)
- **Cost**: Free for personal projects
- **Features**: Automatic deployments, global CDN, built-in CI/CD
- **Best for**: Frontend apps, quick prototypes

### Option 3: AWS Amplify
- **Cost**: Pay-per-use (very cheap for small apps)
- **Features**: Full-stack deployment, authentication, database
- **Best for**: Full-stack apps with AWS integration

## 🔧 Setup Instructions

### For AWS ECS Deployment:

#### 1. Create AWS Resources
Run the setup script:
```bash
chmod +x deploy-free-tier.sh
./deploy-free-tier.sh
```

#### 2. Set up GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_ACCOUNT_ID`: Your 12-digit AWS account ID

#### 3. Update Task Definition
Edit `free-tier-task-definition.json`:
- Replace `YOUR_ACCOUNT_ID` with your actual AWS account ID
- Update the image URI with your ECR repository

#### 4. Push to GitHub
```bash
git add .
git commit -m "Add GitHub Actions deployment"
git push origin main
```

### For Vercel Deployment:

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Connect to Vercel
```bash
vercel login
vercel
```

#### 3. Set up GitHub Secrets
- `VERCEL_TOKEN`: Get from https://vercel.com/account/tokens
- `VERCEL_ORG_ID`: Found in your Vercel team settings
- `VERCEL_PROJECT_ID`: Found in your project settings

#### 4. Enable Auto-deploy
Push to GitHub and Vercel will automatically deploy!

## 🎛️ Environment Variables

Add these to your deployment platform:

### Required
- `NODE_ENV=production`
- `PORT=3000`

### Optional (for full functionality)
- `DATABASE_URL`: If using a database
- `JWT_SECRET`: For authentication
- `REDIS_URL`: For session management

## 🚀 Deployment Process

### Automatic Triggers
- ✅ Push to `main` branch → Auto-deploy to production
- ✅ Push to `staging` branch → Auto-deploy to staging
- ✅ Manual deployment via GitHub Actions

### Deployment Steps
1. **Code checkout** from GitHub
2. **Build application** (npm run build)
3. **Run tests** (if available)
4. **Build Docker image** (for AWS)
5. **Push to container registry**
6. **Deploy to infrastructure**
7. **Health checks** and verification

## 📊 Monitoring

### GitHub Actions
- View deployment status in GitHub Actions tab
- Get detailed logs for each deployment step
- Rollback capabilities

### AWS CloudWatch
- Monitor application logs
- Set up alerts for errors
- Performance metrics

### Vercel Dashboard
- Real-time deployment logs
- Performance analytics
- Error tracking

## 🔧 Troubleshooting

### Common Issues

#### AWS Deployment Fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify ECR repository exists
aws ecr describe-repositories --repository-names modulus-lms

# Check ECS cluster status
aws ecs describe-clusters --clusters modulus-free-cluster
```

#### Build Fails
```bash
# Test build locally
npm run build

# Check for missing dependencies
npm install

# Verify Node.js version
node --version
```

#### Permission Issues
- Ensure IAM user has required permissions
- Check GitHub secrets are correctly set
- Verify task execution role exists

## 💰 Cost Optimization

### Free Tier Resources
- **ECS**: 1 million requests/month free
- **ECR**: 500MB storage free
- **ALB**: 750 hours/month free
- **CloudWatch**: 10 metrics, 1GB logs free

### Cost Monitoring
- Set up AWS billing alerts
- Use AWS Cost Explorer
- Monitor resource usage regularly

## 🎯 Next Steps

1. **Set up monitoring** with CloudWatch/Vercel Analytics
2. **Configure custom domain** 
3. **Set up staging environment**
4. **Add database** (RDS free tier or external)
5. **Implement CI/CD improvements**

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Review AWS CloudWatch logs
3. Verify all secrets are correctly set
4. Ensure AWS resources are properly configured

---

Choose your preferred deployment method and follow the setup instructions above! 🚀
