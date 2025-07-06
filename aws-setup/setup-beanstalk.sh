#!/bin/bash

# Modulus LMS - Elastic Beanstalk Setup Script
echo "🚀 Setting up AWS Elastic Beanstalk for Modulus LMS..."

# Variables
APP_NAME="modulus-lms"
ENV_NAME="modulus-lms-env"
SOLUTION_STACK="64bit Amazon Linux 2 v5.8.4 running Node.js 18"
REGION="us-east-1"

# Create Elastic Beanstalk application
echo "📦 Creating Elastic Beanstalk application..."
aws elasticbeanstalk create-application \
  --application-name $APP_NAME \
  --description "Modulus Learning Management System" \
  --region $REGION

# Create application version
echo "📋 Creating application version..."
aws elasticbeanstalk create-application-version \
  --application-name $APP_NAME \
  --version-label v1.0 \
  --description "Initial version" \
  --region $REGION

# Create Elastic Beanstalk environment
echo "🌍 Creating Elastic Beanstalk environment..."
aws elasticbeanstalk create-environment \
  --application-name $APP_NAME \
  --environment-name $ENV_NAME \
  --solution-stack-name "$SOLUTION_STACK" \
  --option-settings \
    Namespace=aws:autoscaling:launchconfiguration,OptionName=InstanceType,Value=t3.micro \
    Namespace=aws:elasticbeanstalk:environment,OptionName=EnvironmentType,Value=LoadBalanced \
    Namespace=aws:autoscaling:asg,OptionName=MinSize,Value=1 \
    Namespace=aws:autoscaling:asg,OptionName=MaxSize,Value=4 \
    Namespace=aws:elasticbeanstalk:healthreporting:system,OptionName=SystemType,Value=enhanced \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=NODE_ENV,Value=production \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS_REGION,Value=$REGION \
  --region $REGION

# Wait for environment to be ready
echo "⏳ Waiting for environment to be ready..."
aws elasticbeanstalk wait environment-exists --environment-names $ENV_NAME --region $REGION

# Create IAM service role for Elastic Beanstalk
echo "🔐 Creating IAM service role..."
cat > eb-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "elasticbeanstalk.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role --role-name aws-elasticbeanstalk-service-role --assume-role-policy-document file://eb-trust-policy.json 2>/dev/null || echo "Service role already exists"
aws iam attach-role-policy --role-name aws-elasticbeanstalk-service-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService

# Create instance profile for EC2 instances
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

aws iam create-role --role-name aws-elasticbeanstalk-ec2-role --assume-role-policy-document file://ec2-trust-policy.json 2>/dev/null || echo "EC2 role already exists"
aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier
aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier

# Create instance profile
aws iam create-instance-profile --instance-profile-name aws-elasticbeanstalk-ec2-role 2>/dev/null || echo "Instance profile already exists"
aws iam add-role-to-instance-profile --instance-profile-name aws-elasticbeanstalk-ec2-role --role-name aws-elasticbeanstalk-ec2-role 2>/dev/null || echo "Role already added to instance profile"

# Add AWS SDK permissions for application
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

aws iam put-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-name ModulusAWSAccess --policy-document file://modulus-policy.json

# Get environment URL
echo "⏳ Getting environment URL..."
sleep 30  # Wait a bit for environment to initialize

ENV_URL=$(aws elasticbeanstalk describe-environments \
  --environment-names $ENV_NAME \
  --region $REGION \
  --query 'Environments[0].CNAME' \
  --output text)

# Cleanup temporary files
rm -f eb-trust-policy.json ec2-trust-policy.json modulus-policy.json

echo "✅ Elastic Beanstalk setup complete!"
echo ""
echo "📋 Summary:"
echo "  - Application: $APP_NAME"
echo "  - Environment: $ENV_NAME"
echo "  - URL: http://$ENV_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Set up GitHub secrets:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "2. Enable the Elastic Beanstalk workflow in .github/workflows/"
echo "3. Push to master branch to trigger deployment"
echo ""
echo "🌐 Your app will be available at: http://$ENV_URL"
echo ""
echo "💡 Note: It may take 5-10 minutes for the environment to be fully ready."
