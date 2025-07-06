#!/bin/bash
# EC2 User Data Script for Modulus LMS

# Update system
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Create app directory
mkdir -p /home/ec2-user/modulus
chown ec2-user:ec2-user /home/ec2-user/modulus
cd /home/ec2-user/modulus

# Create simple startup script
cat > start.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/modulus
if [ -f package.json ]; then
    npm install --production
    npm start
else
    echo "No app deployed yet. Waiting for deployment..."
    sleep infinity
fi
EOF

chmod +x start.sh
chown ec2-user:ec2-user start.sh

# Start the app (will wait for deployment)
sudo -u ec2-user ./start.sh > /var/log/modulus.log 2>&1 &
