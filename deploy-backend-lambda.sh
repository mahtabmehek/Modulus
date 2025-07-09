#!/bin/bash

# Modulus LMS Backend Lambda Deployment Script
echo "🚀 Starting Modulus LMS Backend Lambda Deployment..."

# Set variables
AWS_REGION="eu-west-2"
FUNCTION_NAME="modulus-backend"
RUNTIME="nodejs18.x"
HANDLER="lambda.handler"
ROLE_NAME="modulus-lambda-role"
API_NAME="modulus-api"

# Export AWS region
export AWS_DEFAULT_REGION=$AWS_REGION

# Create deployment package
echo "📦 Creating deployment package..."
cd backend
zip -r ../backend-deployment.zip . -x "*.git*" "node_modules/*" "*.log"

# Install production dependencies
echo "📥 Installing production dependencies..."
npm install --production

# Add dependencies to zip
zip -r ../backend-deployment.zip node_modules

cd ..

# Create IAM role for Lambda if it doesn't exist
echo "🔑 Creating IAM role..."
aws iam get-role --role-name $ROLE_NAME --region $AWS_REGION > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "📋 Creating Lambda execution role..."
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }' \
        --region $AWS_REGION

    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region $AWS_REGION
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text --region $AWS_REGION)

# Create or update Lambda function
echo "🔄 Creating/updating Lambda function..."
aws lambda get-function --function-name $FUNCTION_NAME --region $AWS_REGION > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "📤 Creating Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://backend-deployment.zip \
        --timeout 30 \
        --memory-size 512 \
        --region $AWS_REGION
else
    echo "📤 Updating Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://backend-deployment.zip \
        --region $AWS_REGION
fi

# Create API Gateway
echo "🌐 Setting up API Gateway..."
aws apigateway get-rest-apis --region $AWS_REGION | grep -q $API_NAME
if [ $? -ne 0 ]; then
    echo "📋 Creating API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "Modulus LMS Backend API" \
        --region $AWS_REGION \
        --query 'id' --output text)
    
    echo "🔗 API Gateway created with ID: $API_ID"
else
    API_ID=$(aws apigateway get-rest-apis --region $AWS_REGION --query "items[?name=='$API_NAME'].id" --output text)
fi

# Add Lambda permission for API Gateway
echo "🔐 Adding Lambda permissions..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id "api-gateway-invoke" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --region $AWS_REGION || true

echo "🎉 Backend deployment completed!"
echo "🌐 API Gateway ID: $API_ID"
echo "🔧 Lambda Function: $FUNCTION_NAME"
echo "📍 Region: $AWS_REGION"

# Clean up
rm -f backend-deployment.zip

echo "✅ Backend Lambda deployment script completed!"
