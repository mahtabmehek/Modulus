#!/bin/bash

# Modulus LMS Frontend Deployment Script
echo "🚀 Starting Modulus LMS Frontend Deployment..."

# Set AWS region
export AWS_DEFAULT_REGION=eu-west-2

# Build the frontend application
echo "📦 Building frontend application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build completed successfully!"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build Docker image for frontend
echo "🐳 Building frontend Docker image..."
docker build -t modulus-frontend .

if [ $? -ne 0 ]; then
    echo "❌ Frontend Docker build failed!"
    exit 1
fi

echo "✅ Frontend Docker image built successfully!"

# Tag for ECR (Frontend)
ECR_REGISTRY="533267404533.dkr.ecr.eu-west-2.amazonaws.com"
FRONTEND_IMAGE_TAG="latest"
FRONTEND_FULL_IMAGE_NAME="$ECR_REGISTRY/modulus:$FRONTEND_IMAGE_TAG"

echo "🏷️ Tagging frontend image for ECR..."
docker tag modulus-frontend:latest $FRONTEND_FULL_IMAGE_NAME

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin $ECR_REGISTRY

if [ $? -ne 0 ]; then
    echo "❌ ECR login failed!"
    exit 1
fi

# Push frontend to ECR
echo "⬆️ Pushing frontend image to ECR..."
docker push $FRONTEND_FULL_IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Frontend Docker push failed!"
    exit 1
fi

echo "✅ Frontend image pushed to ECR successfully!"

# Update ECS service for frontend
echo "🔄 Updating frontend ECS service..."
aws ecs update-service \
    --cluster modulus-cluster \
    --service modulus-service \
    --force-new-deployment \
    --region eu-west-2

if [ $? -ne 0 ]; then
    echo "❌ Frontend ECS service update failed!"
    exit 1
fi

echo "✅ Frontend ECS service update initiated!"
echo "⏳ Waiting for frontend deployment to complete..."

# Wait for frontend service to become stable
aws ecs wait services-stable \
    --cluster modulus-cluster \
    --services modulus-service \
    --region eu-west-2

echo "🎉 Frontend deployment completed successfully!"
echo "🌐 Frontend should be available at: http://modulus-alb-2046761654.eu-west-2.elb.amazonaws.com"

# Test the frontend deployment
echo "🧪 Testing frontend deployment..."
sleep 10
if curl -f http://modulus-alb-2046761654.eu-west-2.elb.amazonaws.com > /dev/null 2>&1; then
    echo "✅ Frontend is responding!"
else
    echo "⚠️ Frontend might still be starting up. Please check in a few minutes."
fi

echo "✅ Frontend deployment script completed!"
