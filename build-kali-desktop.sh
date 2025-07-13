#!/bin/bash
# Build script for Modulus Kali Linux Hybrid Desktop

set -e

echo "🚀 Building Modulus Kali Linux Hybrid Desktop Image"
echo "=================================================="

# Change to docker directory
cd "$(dirname "$0")/docker/kali-hybrid"

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t modulus-kali-hybrid:latest .

# Tag for different environments
docker tag modulus-kali-hybrid:latest modulus-kali-hybrid:$(date +%Y%m%d)

echo "✅ Build completed successfully!"
echo ""
echo "📋 Image Details:"
docker images | grep modulus-kali-hybrid

echo ""
echo "🧪 To test the image locally:"
echo "docker run -d -p 6080:6080 -p 5901:5901 \\"
echo "  -e USER_ID=1000 \\"
echo "  -e LAB_ID=test \\"
echo "  -e S3_BUCKET=your-bucket \\"
echo "  --name kali-test \\"
echo "  modulus-kali-hybrid:latest"
echo ""
echo "Then visit: http://localhost:6080/vnc.html"

# Optional: Push to ECR if configured
if [ "$PUSH_TO_ECR" = "true" ]; then
    echo ""
    echo "🚀 Pushing to ECR..."
    
    # Get AWS account ID and region
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=${AWS_REGION:-eu-west-2}
    ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/modulus-kali-hybrid"
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
    
    # Tag and push
    docker tag modulus-kali-hybrid:latest $ECR_REPO:latest
    docker tag modulus-kali-hybrid:latest $ECR_REPO:$(date +%Y%m%d)
    
    docker push $ECR_REPO:latest
    docker push $ECR_REPO:$(date +%Y%m%d)
    
    echo "✅ Pushed to ECR: $ECR_REPO"
fi

echo ""
echo "🎉 Build process completed!"
