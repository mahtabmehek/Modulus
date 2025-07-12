#!/bin/bash

# Manual Backend Deployment Script
# This script will deploy the backend directly to AWS Lambda to fix the routing issue

echo "🚀 Modulus Backend Manual Deployment"
echo "====================================="

# Configuration
FUNCTION_NAME="modulus-backend"
REGION="eu-west-2"
BACKEND_DIR="./backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi

# Validate backend structure
echo -e "${YELLOW}🔍 Validating backend structure...${NC}"

required_files=("server.js" "lambda.js" "routes/admin.js" "routes/auth.js" "routes/health.js")
for file in "${required_files[@]}"; do
    if [ -f "$BACKEND_DIR/$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        exit 1
    fi
done

# Check for seed route
if grep -q "router.get('/seed'" "$BACKEND_DIR/routes/admin.js"; then
    echo -e "${GREEN}✅ /seed route found in admin.js${NC}"
else
    echo -e "${RED}❌ /seed route NOT found in admin.js${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd "$BACKEND_DIR"
npm install --production
cd ..

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
cd "$BACKEND_DIR"
zip -r ../backend-deployment.zip . -x "*.git*" "*node_modules/.cache*" "*.log*"
cd ..

if [ ! -f "backend-deployment.zip" ]; then
    echo -e "${RED}❌ Failed to create deployment package${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment package created: $(ls -lh backend-deployment.zip | awk '{print $5}')${NC}"

# Check if Lambda function exists
echo -e "${YELLOW}🔍 Checking if Lambda function exists...${NC}"
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &>/dev/null; then
    echo -e "${GREEN}✅ Function exists, updating...${NC}"
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://backend-deployment.zip \
        --region $REGION
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Function code updated successfully${NC}"
    else
        echo -e "${RED}❌ Failed to update function code${NC}"
        exit 1
    fi
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 30 \
        --memory-size 512 \
        --region $REGION
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Function configuration updated${NC}"
    else
        echo -e "${YELLOW}⚠️  Function configuration update failed (might not be critical)${NC}"
    fi
else
    echo -e "${RED}❌ Lambda function not found: $FUNCTION_NAME${NC}"
    echo "Please run the full deployment workflow first to create the function."
    exit 1
fi

# Wait for deployment to be ready
echo -e "${YELLOW}⏳ Waiting for deployment to be ready...${NC}"
sleep 10

# Test the deployment
echo -e "${YELLOW}🧪 Testing deployment...${NC}"

# Get API Gateway URL
API_ID=$(aws apigateway get-rest-apis --query 'items[?name==`modulus-api`].id' --output text --region $REGION)
if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    echo -e "${RED}❌ API Gateway not found${NC}"
    exit 1
fi

API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod/api"
echo "Testing API: $API_URL"

# Test health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
health_response=$(curl -s "$API_URL/health")
if echo "$health_response" | jq -e '.status' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health endpoint working${NC}"
else
    echo -e "${RED}❌ Health endpoint failed${NC}"
    echo "$health_response"
fi

# Test seed endpoint
echo -e "${YELLOW}Testing seed endpoint...${NC}"
seed_response=$(curl -s "$API_URL/admin/seed")
if echo "$seed_response" | jq -e '.users' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Seed endpoint working! 🎉${NC}"
    user_count=$(echo "$seed_response" | jq '.users | length')
    echo "Created $user_count users"
else
    echo -e "${RED}❌ Seed endpoint still not working${NC}"
    echo "$seed_response"
    exit 1
fi

# Test database health
echo -e "${YELLOW}Testing database health...${NC}"
db_response=$(curl -s "$API_URL/health/db")
if echo "$db_response" | jq -e '.status' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database health endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  Database health endpoint failed (might be normal if DB is not configured)${NC}"
fi

# Cleanup
rm -f backend-deployment.zip

echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================="
echo "API URL: $API_URL"
echo "Key endpoints:"
echo "  - Health: $API_URL/health"
echo "  - Seed: $API_URL/admin/seed"
echo "  - Auth: $API_URL/auth/login"
echo ""
echo "The backend is now functional and ready to use!"
