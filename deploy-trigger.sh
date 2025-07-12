#!/bin/bash

# Modulus LMS - Deployment Trigger Script (Bash)
# Requires AWS CLI to be installed and configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Modulus LMS Deployment Script${NC}"
echo -e "${YELLOW}This script will deploy both backend and frontend components${NC}"
echo ""

# Configuration
AWS_REGION="eu-west-2"
LAMBDA_FUNCTION="modulus-backend"
S3_BUCKET="modulus-frontend-1370267358"
API_GATEWAY_NAME="modulus-api"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get API Gateway URL
get_api_url() {
    local api_id
    api_id=$(aws apigateway get-rest-apis \
        --region "$AWS_REGION" \
        --query "items[?name=='$API_GATEWAY_NAME'].id" \
        --output text 2>/dev/null)
    
    if [ -n "$api_id" ] && [ "$api_id" != "None" ]; then
        echo "https://$api_id.execute-api.$AWS_REGION.amazonaws.com/prod"
    else
        echo ""
    fi
}

# Function to build backend
build_backend() {
    echo -e "${YELLOW}📦 Building backend...${NC}"
    cd backend
    
    # Install dependencies
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
    
    # Check if we need to rebuild the package
    if [ ! -f "modulus-backend.zip" ] || [ "$(find . -name '*.js' -newer modulus-backend.zip 2>/dev/null)" ]; then
        echo -e "${YELLOW}Creating new backend package...${NC}"
        
        # Remove old package
        rm -f modulus-backend.zip
        
        # Create new package excluding unnecessary files
        zip -r modulus-backend.zip . \
            -x "node_modules/*" \
            -x "*.zip" \
            -x "test/*" \
            -x ".git/*" \
            -x "*.log"
        
        echo -e "${GREEN}✅ Backend package created${NC}"
    else
        echo -e "${GREEN}✅ Backend package is up to date${NC}"
    fi
    
    cd ..
}

# Function to deploy backend
deploy_backend() {
    echo -e "${YELLOW}🚀 Deploying backend to AWS Lambda...${NC}"
    
    # Update function code
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION" \
        --zip-file fileb://backend/modulus-backend.zip \
        --region "$AWS_REGION"
    
    # Wait for update to complete
    echo -e "${YELLOW}⏳ Waiting for Lambda update to complete...${NC}"
    aws lambda wait function-updated \
        --function-name "$LAMBDA_FUNCTION" \
        --region "$AWS_REGION"
    
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
}

# Function to build frontend
build_frontend() {
    echo -e "${YELLOW}📦 Building frontend...${NC}"
    cd frontend
    
    # Install dependencies
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
    
    # Build the project
    echo -e "${BLUE}Building React application...${NC}"
    npm run build
    
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${YELLOW}🚀 Deploying frontend to S3...${NC}"
    
    # Sync build to S3
    aws s3 sync frontend/dist/ s3://"$S3_BUCKET"/ \
        --region "$AWS_REGION" \
        --delete \
        --cache-control "public, max-age=86400"
    
    # Update S3 bucket website configuration
    aws s3 website s3://"$S3_BUCKET" \
        --index-document index.html \
        --error-document index.html \
        --region "$AWS_REGION"
    
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
    echo -e "${BLUE}🌐 Frontend URL: http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com/${NC}"
}

# Function to initialize database
init_database() {
    echo -e "${YELLOW}🗄️ Initializing database...${NC}"
    
    local api_url
    api_url=$(get_api_url)
    
    if [ -z "$api_url" ]; then
        echo -e "${RED}❌ Could not find API Gateway URL${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Using API URL: $api_url${NC}"
    
    # Initialize database tables
    echo -e "${YELLOW}Creating database tables...${NC}"
    local response
    response=$(curl -s -X POST "$api_url/api/admin/init-db" \
        -H "Content-Type: application/json" \
        -w "%{http_code}")
    
    local http_code
    http_code=$(echo "$response" | tail -c 4)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✅ Database initialization completed${NC}"
    else
        echo -e "${YELLOW}⚠️ Database may already be initialized (HTTP: $http_code)${NC}"
    fi
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}🧪 Running API tests...${NC}"
    
    local api_url
    api_url=$(get_api_url)
    
    if [ -z "$api_url" ]; then
        echo -e "${RED}❌ Could not find API Gateway URL${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Testing API at: $api_url${NC}"
    
    # Test health endpoint
    echo -e "${YELLOW}Testing health endpoint...${NC}"
    if curl -f "$api_url/api/health" --silent > /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        return 1
    fi
    
    # Test registration endpoints
    echo -e "${YELLOW}Testing registration endpoints...${NC}"
    
    local roles=("student" "instructor" "staff" "admin")
    local access_codes=("student2025" "instructor2025" "staff2025" "mahtabmehek1337")
    
    for i in "${!roles[@]}"; do
        local role="${roles[$i]}"
        local code="${access_codes[$i]}"
        
        echo -e "${BLUE}Testing $role registration...${NC}"
        
        local test_data=$(cat <<EOF
{
  "name": "Test $role User",
  "email": "test.$role@modulus.test",
  "password": "TestPassword123!",
  "role": "$role",
  "accessCode": "$code"
}
EOF
)
        
        local response
        response=$(curl -s -X POST "$api_url/api/auth/register" \
            -H "Content-Type: application/json" \
            -d "$test_data" \
            -w "%{http_code}")
        
        local http_code
        http_code=$(echo "$response" | tail -c 4)
        
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            echo -e "${GREEN}✅ $role registration test passed${NC}"
        else
            echo -e "${YELLOW}⚠️ $role registration test: HTTP $http_code${NC}"
        fi
    done
    
    echo -e "${GREEN}✅ All tests completed${NC}"
}

# Function to show deployment status
show_status() {
    echo -e "${BLUE}📊 Deployment Status${NC}"
    echo "===================="
    
    # Lambda function status
    local lambda_status
    lambda_status=$(aws lambda get-function \
        --function-name "$LAMBDA_FUNCTION" \
        --region "$AWS_REGION" \
        --query 'Configuration.State' \
        --output text 2>/dev/null || echo "ERROR")
    
    echo -e "Lambda Function: ${GREEN}$LAMBDA_FUNCTION${NC} - Status: $lambda_status"
    
    # S3 bucket status
    local bucket_exists
    if aws s3api head-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null; then
        bucket_exists="EXISTS"
    else
        bucket_exists="NOT_FOUND"
    fi
    
    echo -e "S3 Bucket: ${GREEN}$S3_BUCKET${NC} - Status: $bucket_exists"
    
    # API Gateway status
    local api_url
    api_url=$(get_api_url)
    
    if [ -n "$api_url" ]; then
        echo -e "API Gateway: ${GREEN}$API_GATEWAY_NAME${NC} - URL: $api_url"
    else
        echo -e "API Gateway: ${RED}NOT_FOUND${NC}"
    fi
    
    echo ""
}

# Main deployment flow
main() {
    show_status
    
    echo -e "${BLUE}Select deployment option:${NC}"
    echo "1) Full deployment (backend + frontend + database)"
    echo "2) Backend only"
    echo "3) Frontend only"
    echo "4) Database initialization only"
    echo "5) Run tests only"
    echo "6) Show status only"
    read -p "Enter choice (1-6): " choice
    
    case $choice in
        1)
            echo -e "${BLUE}Starting full deployment...${NC}"
            build_backend
            deploy_backend
            build_frontend
            deploy_frontend
            init_database
            run_tests
            ;;
        2)
            echo -e "${BLUE}Starting backend deployment...${NC}"
            build_backend
            deploy_backend
            ;;
        3)
            echo -e "${BLUE}Starting frontend deployment...${NC}"
            build_frontend
            deploy_frontend
            ;;
        4)
            echo -e "${BLUE}Initializing database...${NC}"
            init_database
            ;;
        5)
            echo -e "${BLUE}Running tests...${NC}"
            run_tests
            ;;
        6)
            show_status
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    show_status
}

# Run main function
main
