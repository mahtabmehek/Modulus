# Modulus LMS - Hybrid VNC Desktop Deployment Guide

## Overview
This guide explains how to deploy the hybrid VNC desktop system that provides persistent Kali Linux environments for students.

## Architecture
- **Frontend**: React components for desktop session management
- **Backend**: Express.js API with Docker integration
- **Storage**: AWS S3 for user data persistence (hybrid approach)
- **Compute**: EC2 instances running Docker containers
- **Database**: PostgreSQL for session tracking

## Deployment Steps

### 1. Prerequisites

#### EC2 Instance Setup
```bash
# Launch EC2 instance (c5.2xlarge or larger recommended)
# Amazon Linux 2 or Ubuntu 20.04+
# Security Group: Allow ports 22, 80, 443, 5900-5920, 6080-6100

# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Node.js (for backend)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### S3 Bucket Setup
```bash
# Create S3 bucket for user data
aws s3 mb s3://modulus-user-data --region eu-west-2

# Set bucket policy for EC2 access
aws s3api put-bucket-policy --bucket modulus-user-data --policy file://s3-policy.json
```

#### IAM Role Setup
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::modulus-user-data",
        "arn:aws:s3:::modulus-user-data/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. Backend Deployment

#### Update Lambda/EC2 Backend
```bash
# Add desktop routes to existing backend
# Files already created:
# - backend/routes/desktop.js
# - backend/services/HybridDesktopManager.js

# Install additional dependencies
npm install dockerode aws-sdk

# Update server.js to include desktop routes (already done)

# Deploy updated backend
npm run build
# Deploy to Lambda or restart EC2 service
```

#### Database Migration
```sql
-- Add desktop_sessions table (already in schema.sql)
-- Run migration on your Aurora/RDS instance
```

### 3. Docker Image Build

#### Build Kali Linux Image
```bash
# Navigate to project root
cd /path/to/modulus

# Make build script executable
chmod +x build-kali-desktop.sh

# Build the image
./build-kali-desktop.sh

# Optional: Push to ECR
export PUSH_TO_ECR=true
export AWS_REGION=eu-west-2
./build-kali-desktop.sh
```

#### Test Local Image
```bash
# Test the image
docker run -d -p 6080:6080 -p 5901:5901 \
  -e USER_ID=1000 \
  -e LAB_ID=test \
  -e S3_BUCKET=modulus-user-data \
  --name kali-test \
  modulus-kali-hybrid:latest

# Check logs
docker logs kali-test

# Access via browser
# http://localhost:6080/vnc.html

# Cleanup
docker stop kali-test
docker rm kali-test
```

### 4. Frontend Deployment

#### Update Frontend
```bash
# Files already updated:
# - src/lib/api.ts (desktop methods added)
# - src/components/desktop/DesktopSession.tsx (new component)
# - src/components/views/lab-view.tsx (desktop integration)

# Build and deploy frontend
cd src
npm run build
aws s3 sync dist/ s3://modulus-frontend-1370267358 --delete
```

### 5. Production Configuration

#### Environment Variables
```bash
# Backend (.env)
USER_DATA_BUCKET=modulus-user-data
DOMAIN=yourdomain.com
MAX_CONTAINERS_PER_INSTANCE=25
SESSION_TIMEOUT_HOURS=2
BACKUP_INTERVAL_MINUTES=15

# AWS Region
AWS_REGION=eu-west-2
```

#### Nginx Configuration (if using EC2)
```nginx
# /etc/nginx/sites-available/modulus-desktop
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # VNC web proxy
    location ~ ^/vnc/(\d+)$ {
        set $user_id $1;
        # Proxy to user-specific port
        proxy_pass http://127.0.0.1:6080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6. Monitoring and Scaling

#### CloudWatch Metrics
```bash
# Monitor container usage
aws logs create-log-group --log-group-name /modulus/desktop-sessions

# Set up alarms for resource usage
aws cloudwatch put-metric-alarm \
  --alarm-name "HighCPUUsage" \
  --alarm-description "High CPU usage on desktop instances" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

#### Auto-Scaling Setup
```bash
# Create launch template for additional instances
aws ec2 create-launch-template \
  --launch-template-name modulus-desktop-template \
  --launch-template-data file://launch-template.json

# Create auto-scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name modulus-desktop-asg \
  --launch-template LaunchTemplateName=modulus-desktop-template,Version=1 \
  --min-size 1 \
  --max-size 5 \
  --desired-capacity 1
```

## Usage

### For Students
1. Navigate to any lab in the LMS
2. Click "Launch Desktop" button
3. Wait for Kali Linux environment to load (1-3 minutes)
4. Access via web browser (noVNC)
5. Files in Documents, Scripts, Projects are automatically saved
6. Session automatically backs up every 15 minutes

### For Administrators
1. Monitor usage via CloudWatch
2. Scale instances based on demand
3. Manage user data via S3 console
4. Check session logs in application

## Cost Optimization

### Expected Costs (EU-West-2)
- **C5.2xlarge Spot**: ~$0.15/hour (supports 20-30 users)
- **S3 Storage**: ~$0.023/GB/month (5GB per user = $0.12/month)
- **Data Transfer**: Minimal for VNC traffic
- **Total per user**: ~$0.005-0.01/hour

### Optimization Tips
1. Use Spot Instances (90% cost savings)
2. Implement session timeouts (2-hour default)
3. Auto-scale based on demand
4. Use GP3 storage for better performance/cost
5. Compress user backups efficiently

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check Docker logs
docker logs [container-id]

# Check available resources
docker system df
free -h
df -h
```

#### VNC Connection Failed
```bash
# Check VNC process
ps aux | grep vnc

# Check port binding
netstat -tulpn | grep 590

# Restart VNC
docker exec [container-id] su - student -c "vncserver -kill :1"
docker exec [container-id] su - student -c "vncserver :1 -geometry 1280x720"
```

#### S3 Backup Failed
```bash
# Check AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://modulus-user-data

# Check IAM permissions
aws iam get-role-policy --role-name [ec2-role] --policy-name S3Access
```

#### High Resource Usage
```bash
# Monitor container resources
docker stats

# Check system resources
htop
iotop

# Clean up old containers
docker container prune
docker image prune
```

## Security Considerations

1. **Network Isolation**: Each container runs in isolated network namespace
2. **Resource Limits**: CPU and memory limits prevent abuse
3. **VNC Security**: Password-protected VNC access
4. **S3 Security**: User data encrypted in transit and at rest
5. **Process Limits**: Prevent fork bombs and resource exhaustion

## Maintenance

### Regular Tasks
1. **Daily**: Check system resources and active sessions
2. **Weekly**: Review S3 storage usage and costs
3. **Monthly**: Update Kali Linux base image
4. **Quarterly**: Review and optimize resource allocation

### Updates
```bash
# Update Kali image
docker pull kalilinux/kali-rolling:latest
./build-kali-desktop.sh

# Update backend
git pull
npm install
npm run build
# Redeploy

# Update frontend
git pull
cd src && npm install && npm run build
aws s3 sync dist/ s3://modulus-frontend-1370267358
```
