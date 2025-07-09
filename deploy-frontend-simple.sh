#!/bin/bash

# Modulus LMS Frontend Deployment Script - S3 + CloudFront
echo "🚀 Starting Modulus LMS Frontend Deployment..."

# Set AWS region
export AWS_DEFAULT_REGION=eu-west-2

# Variables
S3_BUCKET="modulus-frontend-$(date +%s)"
CLOUDFRONT_DISTRIBUTION_ID=""

# Build the frontend application
echo "📦 Building frontend application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build completed successfully!"

# Create S3 bucket for static hosting
echo "📁 Creating S3 bucket for static hosting..."
aws s3 mb s3://$S3_BUCKET --region eu-west-2

if [ $? -ne 0 ]; then
    echo "❌ S3 bucket creation failed!"
    exit 1
fi

# Configure S3 bucket for static website hosting
echo "🔧 Configuring S3 bucket for static website hosting..."
aws s3 website s3://$S3_BUCKET --index-document index.html --error-document error.html

# Set bucket policy for public read access
echo "🔐 Setting bucket policy for public access..."
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$S3_BUCKET/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://bucket-policy.json

# Upload built files to S3
echo "⬆️ Uploading frontend files to S3..."
aws s3 sync ./out s3://$S3_BUCKET --delete

if [ $? -ne 0 ]; then
    echo "❌ S3 upload failed!"
    exit 1
fi

echo "✅ Frontend files uploaded to S3 successfully!"

# Get S3 website URL
S3_WEBSITE_URL="http://$S3_BUCKET.s3-website.eu-west-2.amazonaws.com"

echo "🎉 Frontend deployment completed successfully!"
echo "🌐 Frontend is available at: $S3_WEBSITE_URL"

# Test the frontend deployment
echo "🧪 Testing frontend deployment..."
sleep 5
if curl -f $S3_WEBSITE_URL > /dev/null 2>&1; then
    echo "✅ Frontend is responding!"
else
    echo "⚠️ Frontend might still be starting up. Please check in a few minutes."
fi

# Clean up
rm -f bucket-policy.json

echo "✅ Frontend deployment script completed!"
echo "📝 Note: For production, consider setting up CloudFront distribution for better performance and HTTPS"
