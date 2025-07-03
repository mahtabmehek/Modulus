# 🚀 AWS Setup Guide for Modulus LMS

## ✅ **Installation Complete!**

- **AWS CLI**: v2.27.48 ✅
- **Docker**: v28.0.1 ✅

## 🔑 **Next Steps: Configure AWS Credentials**

### **Step 1: Create AWS Account**
1. Go to https://aws.amazon.com/
2. Click "Create AWS Account"
3. Complete signup (credit card required but free tier won't charge)

### **Step 2: Create IAM User for Deployment**
1. Log into AWS Console
2. Go to **IAM** service
3. Click **Users** → **Create User**
4. Username: `modulus-deploy`
5. Select: **Programmatic access**
6. Attach policies:
   - `AmazonECS_FullAccess`
   - `AmazonRDS_FullAccess`
   - `AmazonS3_FullAccess`
   - `AmazonEC2_FullAccess`
   - `IAMFullAccess`
   - `AmazonECRFullAccess`
7. **Download credentials CSV**

### **Step 3: Configure AWS CLI**
Run this command and enter your credentials:

```powershell
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: From your downloaded CSV
- **AWS Secret Access Key**: From your downloaded CSV  
- **Default region**: `us-east-1` (best for free tier)
- **Default output format**: `json`

### **Step 4: Test Connection**
```powershell
# Test AWS connection
aws sts get-caller-identity

# Should return your account info
```

### **Step 5: Deploy Modulus LMS**
Once configured, deploy with one command:

```powershell
# Make script executable and run
./deploy-free-tier.sh
```

## 💰 **Free Tier Deployment**

Your setup will cost **$8-15/month** with these free tier benefits:
- ✅ **Database**: FREE for 12 months (RDS PostgreSQL)
- ✅ **Storage**: FREE 5GB (S3)
- ✅ **Container Registry**: FREE 500MB (ECR)
- ✅ **Monitoring**: FREE basic (CloudWatch)

## 🆘 **Troubleshooting**

### **If AWS CLI not found:**
```powershell
# Add to current session
$env:PATH += ";C:\Program Files\Amazon\AWSCLIV2"

# Or restart PowerShell/VS Code
```

### **If Docker not working:**
- Make sure Docker Desktop is running
- Check: `docker --version`

### **If AWS configure fails:**
- Make sure you downloaded the CSV with credentials
- Double-check Access Key ID and Secret Key
- Ensure no extra spaces when copying

## 🚀 **Ready to Deploy!**

Once you run `aws configure` with your credentials, you can deploy your Modulus LMS to AWS in under 10 minutes!

**Next command to run:**
```powershell
aws configure
```
