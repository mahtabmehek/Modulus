#!/bin/bash

# Modulus LMS Authentication Backend Test Script
# Tests all authentication endpoints after deployment

set -e

# Configuration
API_BASE_URL="http://modulus-alb-2046761654.eu-west-2.elb.amazonaws.com/api"
ACCESS_CODE="mahtabmehek1337"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo "🧪 Modulus LMS Authentication Backend Test Suite"
echo "================================================="
echo "API Base URL: $API_BASE_URL"
echo ""

# Test 1: Health Check
log_info "Test 1: Health Check"
response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$API_BASE_URL/../health" || echo "000")
if [ "$response" = "200" ]; then
    log_success "Health check passed"
    cat /tmp/health_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/health_response.json
else
    log_error "Health check failed with status: $response"
fi
echo ""

# Test 2: Database Health Check
log_info "Test 2: Database Health Check"
response=$(curl -s -w "%{http_code}" -o /tmp/db_health_response.json "$API_BASE_URL/../health/db" || echo "000")
if [ "$response" = "200" ]; then
    log_success "Database health check passed"
    cat /tmp/db_health_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/db_health_response.json
else
    log_error "Database health check failed with status: $response"
fi
echo ""

# Test 3: API Status
log_info "Test 3: API Status Endpoint"
response=$(curl -s -w "%{http_code}" -o /tmp/status_response.json "$API_BASE_URL/status" || echo "000")
if [ "$response" = "200" ]; then
    log_success "API status check passed"
    cat /tmp/status_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/status_response.json
else
    log_error "API status check failed with status: $response"
fi
echo ""

# Test 4: Access Code Validation
log_info "Test 4: Access Code Validation"
response=$(curl -s -w "%{http_code}" -o /tmp/access_code_response.json \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"accessCode\":\"$ACCESS_CODE\"}" \
    "$API_BASE_URL/auth/validate-access-code" || echo "000")

if [ "$response" = "200" ]; then
    log_success "Access code validation passed"
    cat /tmp/access_code_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/access_code_response.json
else
    log_error "Access code validation failed with status: $response"
    cat /tmp/access_code_response.json 2>/dev/null || echo "No response body"
fi
echo ""

# Test 5: User Registration
log_info "Test 5: User Registration"
test_email="test-$(date +%s)@modulus.edu"
test_password="SecurePass123!"
response=$(curl -s -w "%{http_code}" -o /tmp/register_response.json \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"email\":\"$test_email\",
        \"password\":\"$test_password\",
        \"name\":\"Test User\",
        \"accessCode\":\"$ACCESS_CODE\",
        \"role\":\"student\"
    }" \
    "$API_BASE_URL/auth/register" || echo "000")

if [ "$response" = "201" ]; then
    log_success "User registration passed"
    token=$(cat /tmp/register_response.json | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
    cat /tmp/register_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/register_response.json
else
    log_error "User registration failed with status: $response"
    cat /tmp/register_response.json 2>/dev/null || echo "No response body"
    token=""
fi
echo ""

# Test 6: User Login
if [ -n "$token" ]; then
    log_info "Test 6: User Login"
    response=$(curl -s -w "%{http_code}" -o /tmp/login_response.json \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"email\":\"$test_email\",
            \"password\":\"$test_password\"
        }" \
        "$API_BASE_URL/auth/login" || echo "000")

    if [ "$response" = "200" ]; then
        log_success "User login passed"
        login_token=$(cat /tmp/login_response.json | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
        cat /tmp/login_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/login_response.json
    else
        log_error "User login failed with status: $response"
        cat /tmp/login_response.json 2>/dev/null || echo "No response body"
        login_token=""
    fi
    echo ""
else
    log_warning "Skipping login test - no token from registration"
    login_token=""
fi

# Test 7: Get Current User Info
if [ -n "$login_token" ]; then
    log_info "Test 7: Get Current User Info"
    response=$(curl -s -w "%{http_code}" -o /tmp/me_response.json \
        -H "Authorization: Bearer $login_token" \
        "$API_BASE_URL/auth/me" || echo "000")

    if [ "$response" = "200" ]; then
        log_success "Get user info passed"
        cat /tmp/me_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/me_response.json
    else
        log_error "Get user info failed with status: $response"
        cat /tmp/me_response.json 2>/dev/null || echo "No response body"
    fi
    echo ""
else
    log_warning "Skipping user info test - no valid token"
fi

# Test 8: Invalid Access Code
log_info "Test 8: Invalid Access Code Test"
response=$(curl -s -w "%{http_code}" -o /tmp/invalid_access_response.json \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"accessCode\":\"invalid-code\"}" \
    "$API_BASE_URL/auth/validate-access-code" || echo "000")

if [ "$response" = "400" ]; then
    log_success "Invalid access code properly rejected"
    cat /tmp/invalid_access_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/invalid_access_response.json
else
    log_warning "Invalid access code test returned unexpected status: $response"
    cat /tmp/invalid_access_response.json 2>/dev/null || echo "No response body"
fi
echo ""

# Test 9: Unauthorized Access
log_info "Test 9: Unauthorized Access Test"
response=$(curl -s -w "%{http_code}" -o /tmp/unauth_response.json \
    "$API_BASE_URL/auth/me" || echo "000")

if [ "$response" = "401" ]; then
    log_success "Unauthorized access properly blocked"
    cat /tmp/unauth_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/unauth_response.json
else
    log_warning "Unauthorized access test returned unexpected status: $response"
    cat /tmp/unauth_response.json 2>/dev/null || echo "No response body"
fi
echo ""

# Summary
echo "🏁 Test Summary"
echo "==============="
log_info "All authentication backend tests completed"
log_info "Check the results above to verify functionality"

# Cleanup
rm -f /tmp/*_response.json

echo ""
echo "🔗 Next Steps:"
echo "1. If tests passed, integrate frontend with backend"
echo "2. Test user registration flow in browser"
echo "3. Implement additional features (courses, labs, etc.)"
