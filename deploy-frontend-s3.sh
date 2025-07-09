#!/bin/bash

# Modulus LMS Frontend S3 Deployment Script
echo "🚀 Starting Modulus LMS Frontend S3 Deployment..."

# Set variables
AWS_REGION="eu-west-2"
BUCKET_NAME="modulus-frontend-$(date +%s)"
DISTRIBUTION_COMMENT="Modulus LMS Frontend"

# Export AWS region
export AWS_DEFAULT_REGION=$AWS_REGION

# Build the frontend
echo "🔨 Building frontend..."
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build completed!"

# Create S3 bucket
echo "🪣 Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Configure bucket for static website hosting
echo "🌐 Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document error.html

# Upload files to S3
echo "⬆️ Uploading files to S3..."
aws s3 sync ./out s3://$BUCKET_NAME --delete --region $AWS_REGION

# Set public read policy
echo "🔓 Setting public read policy..."
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
        }
    ]
}'

# Create CloudFront distribution
echo "☁️ Creating CloudFront distribution..."
DISTRIBUTION_CONFIG='{
    "CallerReference": "'$(date +%s)'",
    "Comment": "'$DISTRIBUTION_COMMENT'",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-'$BUCKET_NAME'",
                "DomainName": "'$BUCKET_NAME'.s3-website.'$AWS_REGION'.amazonaws.com",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only"
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-'$BUCKET_NAME'",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "Compress": true
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}'

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config "$DISTRIBUTION_CONFIG" \
    --query 'Distribution.Id' --output text --region $AWS_REGION)

echo "🎉 Frontend deployment completed!"
echo "🪣 S3 Bucket: $BUCKET_NAME"
echo "🌐 Website URL: http://$BUCKET_NAME.s3-website.$AWS_REGION.amazonaws.com"
echo "☁️ CloudFront Distribution ID: $DISTRIBUTION_ID"
echo "⏳ CloudFront deployment may take 10-15 minutes to complete"

echo "✅ Frontend S3 deployment script completed!"
