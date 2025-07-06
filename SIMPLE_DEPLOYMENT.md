# 🚀 Modulus LMS - Simple AWS Deployment

Deploy your complete Modulus LMS with user labs in one click using GitHub Actions.

## 📋 What Gets Deployed

### ✅ Complete Infrastructure:
- **Main App**: `https://modulus.mahtabmehek.tech`
- **Labs Environment**: `https://labs.mahtabmehek.tech`
- **Database**: PostgreSQL with user data
- **Container Registry**: ECR for app images
- **Load Balancers**: Auto-scaling with SSL
- **Domain Setup**: Automatic DNS configuration

### ✅ Features Included:
- 🎓 **Full LMS Platform** - Courses, users, analytics
- 🧪 **Interactive Labs** - Kali Linux-based hacking environment
- 👥 **User Management** - Students, instructors, staff, admin
- 📊 **AWS Monitoring** - Real-time infrastructure metrics
- 🔐 **SSL Security** - Automatic HTTPS certificates
- 🌐 **Custom Domain** - Professional mahtabmehek.tech URLs

## 🎯 One-Click Deployment

### Step 1: Setup AWS Credentials (5 minutes)

1. **Create AWS User**:
   - Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
   - Create user: `modulus-github-actions`
   - Attach policy: `AdministratorAccess` (for simplicity)
   - Save Access Key ID and Secret Key

2. **Setup Route 53 Domain**:
   - Go to [Route 53 Console](https://console.aws.amazon.com/route53/)
   - Create hosted zone for `mahtabmehek.tech`
   - Update your domain nameservers to AWS nameservers

### Step 2: Configure GitHub Secrets (2 minutes)

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

### Step 3: Deploy! (1 click)

**That's it!** Push to master or click "Actions" → "Run workflow"

```bash
git add .
git commit -m "Deploy Modulus LMS"
git push origin master
```

## 📊 Deployment Progress

Watch your deployment in GitHub Actions:

1. **🏗️ Infrastructure Setup** (10-15 minutes)
   - Creates VPC, subnets, security groups
   - Sets up RDS database
   - Creates ECS cluster and services
   - Configures load balancers

2. **🚀 Application Deployment** (5-10 minutes)
   - Builds and pushes Docker images
   - Deploys main app and labs environment
   - Updates DNS records
   - Configures SSL certificates

3. **✅ Ready!** (Total: ~20 minutes)
   - Main app: `https://modulus.mahtabmehek.tech`
   - Labs: `https://labs.mahtabmehek.tech`

## 🎓 Using Your LMS

### For Students:
1. **Access**: Go to `https://modulus.mahtabmehek.tech`
2. **Sign Up**: Create student account
3. **Browse**: Explore learning paths and courses
4. **Practice**: Access labs at `https://labs.mahtabmehek.tech`

### For Instructors:
1. **Request Access**: Sign up as instructor (requires approval)
2. **Create Content**: Add courses, modules, and labs
3. **Manage Students**: Track progress and grades
4. **Monitor**: View engagement analytics

### For Admins:
1. **User Management**: Approve instructors, manage all users
2. **System Monitoring**: AWS infrastructure metrics
3. **Content Oversight**: Manage all courses and labs
4. **Analytics**: Platform-wide usage statistics

## 🧪 Lab Environment Features

Your labs environment includes:

### 🐧 **Kali Linux Tools:**
- `nmap` - Network scanning
- `burpsuite` - Web application testing
- `john` - Password cracking
- `wireshark` - Network analysis
- `metasploit` - Penetration testing
- `nikto` - Web server scanner

### 💻 **Interactive Terminal:**
- Web-based terminal access
- Full Kali Linux environment
- Pre-configured security tools
- Isolated user sessions
- Real-time command execution

### 🎯 **Sample Labs:**
- Network reconnaissance
- Web application security
- Password attacks
- Digital forensics
- Social engineering

## 💰 Cost Estimate

### AWS Free Tier (First 12 months):
- **Database**: Free (750 hours db.t3.micro)
- **Container Registry**: Free (500MB)
- **Load Balancers**: ~$16/month
- **ECS Fargate**: ~$15-25/month
- **Route 53**: $0.50/month

**Total: ~$30-40/month** during free tier
**After free tier: ~$50-70/month**

## 🔧 Management Commands

### Scale Up/Down:
```bash
# Increase capacity (more students)
aws ecs update-service --cluster modulus-cluster --service modulus-service --desired-count 4

# Scale down (save costs)
aws ecs update-service --cluster modulus-cluster --service modulus-service --desired-count 1
```

### Monitor Costs:
```bash
# Check current month charges
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost
```

### Emergency Stop:
```bash
# Stop all services (emergency cost control)
aws ecs update-service --cluster modulus-cluster --service modulus-service --desired-count 0
aws ecs update-service --cluster modulus-cluster --service modulus-labs-service --desired-count 0
```

## 🆘 Troubleshooting

### Common Issues:

1. **Deployment Fails**: Check GitHub Actions logs
2. **Domain Not Working**: Verify Route 53 nameservers
3. **SSL Certificate Pending**: Wait 10-15 minutes for validation
4. **High Costs**: Scale down services or check usage

### Support:
- Check AWS CloudWatch for service health
- Monitor GitHub Actions for deployment status
- Review ECS service logs for application errors

## 🎉 Success!

Your Modulus LMS is now live with:
- ✅ Professional cybersecurity education platform
- ✅ Interactive hacking labs environment  
- ✅ Full user management system
- ✅ AWS-powered infrastructure
- ✅ Custom domain with SSL
- ✅ Automatic scaling and monitoring

**Start teaching cybersecurity at scale!** 🚀
