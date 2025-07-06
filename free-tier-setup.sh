#!/bin/bash

# Modulus LMS - AWS Free Tier Setup (Ultra Simple)
echo "🚀 Setting up AWS Free Tier for Modulus LMS..."

# Variables
BUCKET_NAME="modulus-deploy-$(date +%s)"
REGION="eu-west-2"
KEY_NAME="modulus-key"

echo "📋 Creating AWS resources (Free Tier)..."

# 1. Create S3 bucket (5GB free)
echo "📦 Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION

# 2. Create EC2 key pair
echo "🔑 Creating key pair..."
aws ec2 create-key-pair --key-name $KEY_NAME --query 'KeyMaterial' --output text > ${KEY_NAME}.pem
chmod 400 ${KEY_NAME}.pem

# 3. Create security group
echo "🛡️ Creating security group..."
GROUP_ID=$(aws ec2 create-security-group \
  --group-name modulus-sg \
  --description "Modulus Security Group" \
  --query 'GroupId' --output text)

# Allow HTTP and SSH
aws ec2 authorize-security-group-ingress --group-id $GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $GROUP_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0

# 4. Launch free tier EC2 instance (t2.micro)
echo "🖥️ Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 1 \
  --instance-type t2.micro \
  --key-name $KEY_NAME \
  --security-group-ids $GROUP_ID \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=modulus-app}]" \
  --user-data file://setup-instance.sh \
  --query 'Instances[0].InstanceId' --output text)

# 5. Wait for instance
echo "⏳ Waiting for instance..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# 6. Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "✅ Setup complete!"
echo ""
echo "📋 Your AWS Free Tier Setup:"
echo "  • S3 Bucket: $BUCKET_NAME"
echo "  • Instance ID: $INSTANCE_ID"
echo "  • Public IP: http://$PUBLIC_IP:3000"
echo "  • SSH Key: ${KEY_NAME}.pem"
echo ""
echo "🔧 GitHub Secrets to add:"
echo "  AWS_ACCESS_KEY_ID=your_access_key"
echo "  AWS_SECRET_ACCESS_KEY=your_secret_key"
echo "  S3_BUCKET=$BUCKET_NAME"
echo ""
echo "🚀 Push to GitHub to deploy!"
echo "💰 Free Tier Usage: ✅ t2.micro ✅ 5GB S3 ✅ 750 hours/month"
