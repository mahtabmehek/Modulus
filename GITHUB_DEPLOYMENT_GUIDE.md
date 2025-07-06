# Modulus LMS - AWS Deployment Guide

## Quick GitHub Deployment Options

You have 3 easy deployment options through GitHub:

### Option 1: Vercel (Recommended - Easiest)

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. **Import Project**: Connect your Modulus repository
3. **Deploy**: Vercel will automatically deploy on every push to master

**GitHub Secrets needed**: None (Vercel handles everything)

### Option 2: AWS Elastic Beanstalk (Medium)

1. **Run AWS Setup Script**:
   ```bash
   chmod +x setup-aws.sh
   ./setup-aws.sh
   ```

2. **Add GitHub Secrets** (Settings → Secrets and variables → Actions):
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key  
   - `S3_BUCKET_NAME`: From setup script output

3. **Deploy**: Push to master branch triggers deployment

### Option 3: AWS ECS with ECR (Advanced)

1. **Setup AWS Resources** manually or use CloudFormation
2. **Add GitHub Secrets**:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - Configure ECR repository

3. **Use**: `.github/workflows/deploy-aws.yml`

## Detailed Steps for Each Option

### Vercel Deployment (5 minutes)

```bash
# 1. Install Vercel CLI (optional)
npm i -g vercel

# 2. Login and deploy
vercel login
vercel --prod

# Or just use the web interface:
# - Go to vercel.com
# - Click "Import Project"  
# - Connect GitHub and select Modulus repo
# - Deploy automatically
```

**Pros**: Free, automatic HTTPS, global CDN, zero configuration
**Cons**: Frontend only (no backend APIs), usage limits

### AWS Elastic Beanstalk (15 minutes)

```bash
# 1. Configure AWS CLI
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Output (json)

# 2. Run setup script  
./setup-aws.sh

# 3. Add GitHub secrets (from script output)

# 4. Push to trigger deployment
git push origin master
```

**Pros**: Full AWS integration, scalable, supports backend
**Cons**: Costs money, more complex setup

### Manual AWS Setup Commands

If you prefer manual setup:

```bash
# Create S3 bucket
aws s3 mb s3://modulus-lms-deployments-$(aws sts get-caller-identity --query Account --output text)

# Create EB application
aws elasticbeanstalk create-application --application-name modulus-lms

# Create environment  
aws elasticbeanstalk create-environment \
  --application-name modulus-lms \
  --environment-name modulus-lms-prod \
  --solution-stack-name "64bit Amazon Linux 2 v5.8.0 running Node.js 18"
```

## Required GitHub Secrets

### For AWS Deployment:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `S3_BUCKET_NAME`

### For Vercel:
- `VERCEL_TOKEN` (optional)
- `VERCEL_ORG_ID` (optional)  
- `VERCEL_PROJECT_ID` (optional)

## Environment Variables

Create `.env.production` for production settings:

```env
NODE_ENV=production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Monitoring Deployment

1. **GitHub Actions**: Check Actions tab for deployment status
2. **AWS Console**: Monitor Elastic Beanstalk environment health
3. **Vercel Dashboard**: View deployments and analytics

## Troubleshooting

### Common Issues:
- **GitHub Actions failing**: Check secrets are correctly set
- **AWS permissions**: Ensure IAM user has ElasticBeanstalk permissions
- **Build failures**: Check `package.json` scripts work locally

### Logs:
- **GitHub Actions**: Click on failed action for detailed logs
- **AWS EB**: View logs in Elastic Beanstalk console
- **Vercel**: Check function logs in dashboard

## Cost Estimates

- **Vercel**: Free for hobby projects
- **AWS EB**: ~$15-30/month for t3.micro instance
- **AWS ECS**: ~$20-50/month depending on usage

## Recommendation

**Start with Vercel** for quick deployment and testing, then migrate to AWS when you need:
- Backend APIs
- Database integration  
- Custom infrastructure
- Enterprise features
