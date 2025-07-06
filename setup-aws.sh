#!/bin/bash

# Modulus LMS - AWS Deployment Setup Script
# This script sets up AWS infrastructure for Modulus LMS

set -e

echo "🚀 Setting up Modulus LMS on AWS..."

# Variables
APP_NAME="modulus-lms"
REGION="us-east-1"
KEY_NAME="modulus-key"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first:"
    echo "https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "AWS CLI is configured"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_status "AWS Account ID: $ACCOUNT_ID"

echo ""
echo "🔧 Creating AWS Resources..."

# 1. Create S3 bucket for deployment artifacts
BUCKET_NAME="$APP_NAME-deployments-$ACCOUNT_ID"
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb s3://$BUCKET_NAME --region $REGION
    print_status "Created S3 bucket: $BUCKET_NAME"
else
    print_warning "S3 bucket already exists: $BUCKET_NAME"
fi

# 2. Create IAM roles for Elastic Beanstalk
aws iam create-role --role-name aws-elasticbeanstalk-ec2-role \
    --assume-role-policy-document file://trust-policy-ec2.json \
    --output table || print_warning "Role may already exist"

aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role \
    --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier || true

aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role \
    --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier || true

# 3. Create Elastic Beanstalk application
aws elasticbeanstalk create-application \
    --application-name $APP_NAME \
    --description "Modulus LMS - Interactive Learning Management System" \
    --region $REGION || print_warning "Application may already exist"

print_status "Created Elastic Beanstalk application"

# 4. Create environment
aws elasticbeanstalk create-environment \
    --application-name $APP_NAME \
    --environment-name "$APP_NAME-prod" \
    --solution-stack-name "64bit Amazon Linux 2 v5.8.0 running Node.js 18" \
    --option-settings \
        Namespace=aws:autoscaling:launchconfiguration,OptionName=IamInstanceProfile,Value=aws-elasticbeanstalk-ec2-role \
        Namespace=aws:elasticbeanstalk:environment,OptionName=EnvironmentType,Value=SingleInstance \
        Namespace=aws:elasticbeanstalk:environment:process:default,OptionName=Port,Value=3000 \
    --region $REGION || print_warning "Environment may already exist"

print_status "Creating Elastic Beanstalk environment (this may take several minutes)..."

# Wait for environment to be ready
aws elasticbeanstalk wait environment-ready \
    --application-name $APP_NAME \
    --environment-names "$APP_NAME-prod" \
    --region $REGION

# Get environment URL
ENV_URL=$(aws elasticbeanstalk describe-environments \
    --application-name $APP_NAME \
    --environment-names "$APP_NAME-prod" \
    --region $REGION \
    --query 'Environments[0].CNAME' --output text)

echo ""
echo "🎉 AWS Setup Complete!"
echo ""
echo "📋 Setup Summary:"
echo "   • Application: $APP_NAME"
echo "   • Environment: $APP_NAME-prod"
echo "   • S3 Bucket: $BUCKET_NAME"
echo "   • Region: $REGION"
echo "   • URL: http://$ENV_URL"
echo ""
echo "🔐 GitHub Secrets to Add:"
echo "   AWS_ACCESS_KEY_ID: <your-access-key>"
echo "   AWS_SECRET_ACCESS_KEY: <your-secret-key>"
echo "   S3_BUCKET_NAME: $BUCKET_NAME"
echo ""
echo "🚀 Next Steps:"
echo "   1. Add the GitHub secrets above to your repository"
echo "   2. Push code to trigger deployment"
echo "   3. Monitor deployment in GitHub Actions"
echo ""
