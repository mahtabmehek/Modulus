#!/bin/bash

# Simple deployment script for testing the backend functionality
# This script will test the API endpoints and seed the database

echo "🚀 Starting Modulus Backend Test & Seed"
echo "======================================="

# Configuration
API_URL="https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"
BACKEND_DIR="./backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -e "\n${YELLOW}Testing $description...${NC}"
    echo "URL: $API_URL$endpoint"
    
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_URL$endpoint")
    http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Success (HTTP $http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Failed (HTTP $http_code)${NC}"
        echo "$body"
    fi
}

# Test backend structure first
echo -e "\n${YELLOW}🔍 Checking backend structure...${NC}"
if [ -d "$BACKEND_DIR" ]; then
    echo "✅ Backend directory exists"
    
    # Check required files
    required_files=("server.js" "lambda.js" "routes/admin.js" "routes/auth.js" "routes/health.js")
    for file in "${required_files[@]}"; do
        if [ -f "$BACKEND_DIR/$file" ]; then
            echo "✅ $file exists"
        else
            echo "❌ $file missing"
        fi
    done
    
    # Check for seed route
    if grep -q "router.get('/seed'" "$BACKEND_DIR/routes/admin.js"; then
        echo "✅ /seed route found in admin.js"
    else
        echo "❌ /seed route NOT found in admin.js"
    fi
else
    echo "❌ Backend directory not found"
fi

# Test API endpoints
echo -e "\n${YELLOW}🌐 Testing API endpoints...${NC}"

# Test basic health
test_endpoint "/health" "Basic Health Check"

# Test database health
test_endpoint "/health/db" "Database Health Check"

# Test status endpoint
test_endpoint "/status" "API Status"

# Test seed endpoint (this is the main one we're fixing)
test_endpoint "/admin/seed" "Seed Endpoint (Database Seeding)"

# Test auth endpoints
test_endpoint "/auth/validate-access-code" "Access Code Validation (POST required)"

echo -e "\n${YELLOW}🧪 Testing seed endpoint with detailed output...${NC}"
seed_response=$(curl -s "$API_URL/admin/seed")
echo "Raw seed response:"
echo "$seed_response"

if echo "$seed_response" | jq -e '.users' > /dev/null 2>&1; then
    echo -e "\n${GREEN}✅ Seed endpoint working correctly${NC}"
    user_count=$(echo "$seed_response" | jq '.users | length')
    echo "Created $user_count users"
    echo "Users created:"
    echo "$seed_response" | jq '.users[] | {email: .email, name: .name, role: .role}'
else
    echo -e "\n${RED}❌ Seed endpoint not working as expected${NC}"
fi

# Test with specific test users
echo -e "\n${YELLOW}🔐 Testing authentication with seeded users...${NC}"

# Try to login with a test user
echo "Testing login with student@test.com..."
login_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "student@test.com", "password": "Mahtabmehek@1337"}')

if echo "$login_response" | jq -e '.token' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "$login_response" | jq '.user'
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "$login_response"
fi

echo -e "\n${YELLOW}📊 Deployment Summary${NC}"
echo "===================="
echo "API URL: $API_URL"
echo "Key endpoints tested:"
echo "  - Health: $API_URL/health"
echo "  - Database: $API_URL/health/db"
echo "  - Seed: $API_URL/admin/seed"
echo "  - Auth: $API_URL/auth/login"

echo -e "\n${GREEN}🎉 Testing completed!${NC}"
echo "If the seed endpoint is working, your backend is ready for use."
echo "You can now run the frontend with the API_URL pointing to: $API_URL"
