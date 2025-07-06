#!/bin/bash

# Modulus LMS - EC2 Setup Script
echo "🚀 Setting up AWS EC2 for Modulus LMS..."

# Variables
INSTANCE_NAME="modulus-app"
KEY_NAME="modulus-key"
BUCKET_NAME="modulus-deployments-$(date +%s)"
REGION="us-east-1"

# Create S3 bucket for deployments
echo "📦 Creating S3 bucket for deployments..."
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Create key pair
echo "🔑 Creating EC2 key pair..."
aws ec2 create-key-pair --key-name $KEY_NAME --query 'KeyMaterial' --output text > ${KEY_NAME}.pem
chmod 400 ${KEY_NAME}.pem

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $REGION)

# Create security group
echo "🛡️ Creating security group..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
  --group-name modulus-sg \
  --description "Modulus LMS Security Group" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Add security group rules
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0

# Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y docker

# Start Docker service
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Create application directory
mkdir -p /var/www/modulus
chown ec2-user:ec2-user /var/www/modulus

# Install nginx for reverse proxy
amazon-linux-extras install nginx1 -y
systemctl start nginx
systemctl enable nginx

# Configure nginx
cat > /etc/nginx/nginx.conf << 'NGINX_EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
NGINX_EOF

systemctl restart nginx
EOF

# Launch EC2 instance
echo "🖥️ Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 1 \
  --instance-type t3.micro \
  --key-name $KEY_NAME \
  --security-group-ids $SECURITY_GROUP_ID \
  --user-data file://user-data.sh \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
  --iam-instance-profile Name=EC2-SSM-Role \
  --query 'Instances[0].InstanceId' \
  --output text)

# Wait for instance to be running
echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get instance public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

# Create IAM role for EC2 (if not exists)
echo "🔐 Creating IAM role for EC2..."
cat > ec2-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role --role-name EC2-SSM-Role --assume-role-policy-document file://ec2-trust-policy.json 2>/dev/null || echo "Role already exists"
aws iam attach-role-policy --role-name EC2-SSM-Role --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam attach-role-policy --role-name EC2-SSM-Role --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Create instance profile
aws iam create-instance-profile --instance-profile-name EC2-SSM-Role 2>/dev/null || echo "Instance profile already exists"
aws iam add-role-to-instance-profile --instance-profile-name EC2-SSM-Role --role-name EC2-SSM-Role 2>/dev/null || echo "Role already added"

# Add AWS SDK permissions
cat > modulus-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "eks:DescribeCluster",
        "eks:ListClusters",
        "rds:DescribeDBInstances",
        "s3:GetObject",
        "s3:ListBucket",
        "ec2:DescribeInstances",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeTargetGroups"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy --role-name EC2-SSM-Role --policy-name ModulusAWSAccess --policy-document file://modulus-policy.json

# Cleanup temporary files
rm -f user-data.sh ec2-trust-policy.json modulus-policy.json

echo "✅ EC2 setup complete!"
echo ""
echo "📋 Summary:"
echo "  - Instance ID: $INSTANCE_ID"
echo "  - Public IP: $PUBLIC_IP"
echo "  - Key file: ${KEY_NAME}.pem"
echo "  - S3 Bucket: $BUCKET_NAME"
echo ""
echo "🔧 Next steps:"
echo "1. Set up GitHub secrets:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "   - S3_BUCKET: $BUCKET_NAME"
echo "   - EC2_INSTANCE_TAG: $INSTANCE_NAME"
echo "2. Enable the EC2 workflow in .github/workflows/"
echo "3. Push to master branch to trigger deployment"
echo ""
echo "🌐 Your app will be available at: http://$PUBLIC_IP"
echo ""
echo "🔑 To SSH into the instance:"
echo "ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo ""
echo "💡 Note: It may take 5-10 minutes for the instance to be fully configured."
