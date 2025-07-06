# AWS Free Tier Deployment - Ultra Simple Guide

Deploy Modulus LMS to AWS completely free for 12 months!

## 🆓 What You Get (Free Tier)
- **EC2**: t2.micro instance (750 hours/month = 24/7)
- **S3**: 5GB storage for deployments
- **Data Transfer**: 15GB/month outbound
- **Total Cost**: $0 for first 12 months ✅

## 🚀 Super Simple 3-Step Deployment

### Step 1: Setup AWS (5 minutes)
```bash
# Run the free tier setup script
bash free-tier-setup.sh
```

### Step 2: Add GitHub Secrets (2 minutes)
Go to your GitHub repo → Settings → Secrets → Add:
- `AWS_ACCESS_KEY_ID` = Your AWS access key
- `AWS_SECRET_ACCESS_KEY` = Your AWS secret key  
- `S3_BUCKET` = Bucket name from setup script

### Step 3: Deploy (30 seconds)
```bash
git push origin master
```
**That's it!** 🎉 Your app deploys automatically.

## 📱 Access Your App

After deployment completes:
- **URL**: `http://YOUR_IP:3000` (IP shown in setup script)
- **Admin Dashboard**: Login with admin credentials
- **Monitor**: Check GitHub Actions for deployment status

## 🔧 How It Works

1. **Push to GitHub** → Triggers automatic deployment
2. **Build** → Creates optimized Next.js build
3. **Upload** → Sends files to S3 (free storage)
4. **Deploy** → Downloads and runs on EC2 (free compute)
5. **Ready** → Your LMS is live!

## 💰 Cost Breakdown

| Service | Free Tier Limit | Your Usage | Cost |
|---------|----------------|------------|------|
| EC2 t2.micro | 750 hours/month | 744 hours | $0 |
| S3 Storage | 5GB | ~100MB | $0 |
| Data Transfer | 15GB/month | ~1GB | $0 |
| **Total** | | | **$0** |

## 🛠️ Troubleshooting

### Deployment Failed?
- Check GitHub Actions logs
- Verify AWS credentials in secrets
- Ensure S3 bucket name is correct

### Can't Access App?
- Wait 2-3 minutes after first deployment
- Check EC2 Security Groups allow port 3000
- Verify instance is running in AWS Console

### Need SSH Access?
```bash
ssh -i modulus-key.pem ec2-user@YOUR_IP
```

## 📊 Monitoring

- **GitHub Actions**: Deployment status and logs
- **AWS Console**: EC2 instance health and S3 usage
- **Application Logs**: SSH into instance and check `/var/log/modulus.log`

## 🔄 Updates

Just push to GitHub master branch - everything updates automatically!

## ⚡ Quick Commands

```bash
# Check deployment status
git push origin master && echo "Deploying..."

# Get your app URL
aws ec2 describe-instances --filters "Name=tag:Name,Values=modulus-app" --query 'Reservations[0].Instances[0].PublicIpAddress'

# SSH into server  
ssh -i modulus-key.pem ec2-user@$(aws ec2 describe-instances --filters "Name=tag:Name,Values=modulus-app" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
```

---

🎯 **Result**: Professional LMS running on AWS, completely free, with automatic deployments!
