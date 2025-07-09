#!/bin/bash

# Modulus LMS Backend Deployment Script
echo "🚀 Starting Modulus LMS Backend Deployment..."

# Set variables
AWS_REGION="eu-west-2"
ECR_REGISTRY="590183696703.dkr.ecr.eu-west-2.amazonaws.com"
IMAGE_NAME="modulus-backend"
CLUSTER_NAME="modulus-cluster"
SERVICE_NAME="modulus-backend"

# Export AWS region
export AWS_DEFAULT_REGION=$AWS_REGION

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t $IMAGE_NAME -f Dockerfile.backend .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker image built successfully!"

# Create ECR repository if it doesn't exist
echo "🏗️ Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names $IMAGE_NAME --region $AWS_REGION > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "📦 Creating ECR repository..."
    aws ecr create-repository --repository-name $IMAGE_NAME --region $AWS_REGION
fi

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

if [ $? -ne 0 ]; then
    echo "❌ ECR login failed!"
    exit 1
fi

# Tag and push image
FULL_IMAGE_NAME="$ECR_REGISTRY/$IMAGE_NAME:latest"
echo "🏷️ Tagging image: $FULL_IMAGE_NAME"
docker tag $IMAGE_NAME:latest $FULL_IMAGE_NAME

echo "⬆️ Pushing image to ECR..."
docker push $FULL_IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Docker push failed!"
    exit 1
fi

echo "✅ Image pushed to ECR successfully!"

# Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment --region $AWS_REGION

if [ $? -ne 0 ]; then
    echo "❌ ECS service update failed!"
    exit 1
fi

echo "✅ ECS service update initiated!"
echo "⏳ Waiting for deployment to complete..."

# Wait for service to become stable
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION

echo "🎉 Backend deployment completed successfully!"
echo "🌐 Backend API should be available at: http://modulus-backend-1734346092.us-east-1.elb.amazonaws.com/api"

# Test the deployment
echo "🧪 Testing deployment..."
sleep 10

if curl -f -s "http://modulus-backend-1734346092.us-east-1.elb.amazonaws.com/api/health" > /dev/null; then
    echo "✅ Backend API is responding!"
else
    echo "⚠️ Backend might still be starting up. Please check in a few minutes."
fi

echo "✅ Backend deployment script completed!"
