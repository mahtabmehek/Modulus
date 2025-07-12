#!/bin/bash

# Modulus LMS - Simple Deployment Status Checker
# Quick status check for all deployment components

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="eu-west-2"
LAMBDA_FUNCTION="modulus-backend"
S3_BUCKET="modulus-frontend-1370267358"
API_GATEWAY_NAME="modulus-api"

echo -e "${BLUE}🔍 Modulus LMS - Deployment Status Check${NC}"
echo "========================================"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"
echo ""

# Get AWS Account Info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CURRENT_USER=$(aws sts get-caller-identity --query Arn --output text)
echo -e "${BLUE}AWS Account:${NC} $ACCOUNT_ID"
echo -e "${BLUE}Current User:${NC} $CURRENT_USER"
echo ""

# Check Lambda Function
echo -e "${YELLOW}Checking Lambda Function...${NC}"
LAMBDA_STATUS=$(aws lambda get-function \
    --function-name "$LAMBDA_FUNCTION" \
    --region "$AWS_REGION" \
    --query 'Configuration.State' \
    --output text 2>/dev/null || echo "ERROR")

if [ "$LAMBDA_STATUS" = "Active" ]; then
    echo -e "${GREEN}✅ Lambda Function: $LAMBDA_FUNCTION - Active${NC}"
    
    # Get last modified
    LAST_MODIFIED=$(aws lambda get-function \
        --function-name "$LAMBDA_FUNCTION" \
        --region "$AWS_REGION" \
        --query 'Configuration.LastModified' \
        --output text 2>/dev/null)
    echo -e "   Last Modified: $LAST_MODIFIED"
else
    echo -e "${RED}❌ Lambda Function: $LAMBDA_FUNCTION - $LAMBDA_STATUS${NC}"
fi

# Check S3 Bucket
echo ""
echo -e "${YELLOW}Checking S3 Bucket...${NC}"
if aws s3api head-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null; then
    echo -e "${GREEN}✅ S3 Bucket: $S3_BUCKET - Exists${NC}"
    
    # Check website configuration
    WEBSITE_CONFIG=$(aws s3api get-bucket-website --bucket "$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null)
    if [ -n "$WEBSITE_CONFIG" ]; then
        echo -e "   Website hosting: Enabled"
        echo -e "   Website URL: http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com/"
    else
        echo -e "${YELLOW}   Website hosting: Not configured${NC}"
    fi
    
    # Check object count
    OBJECT_COUNT=$(aws s3 ls s3://"$S3_BUCKET"/ --recursive --region "$AWS_REGION" 2>/dev/null | wc -l)
    echo -e "   Object count: $OBJECT_COUNT"
else
    echo -e "${RED}❌ S3 Bucket: $S3_BUCKET - Not found${NC}"
fi

# Check API Gateway
echo ""
echo -e "${YELLOW}Checking API Gateway...${NC}"
API_ID=$(aws apigateway get-rest-apis \
    --region "$AWS_REGION" \
    --query "items[?name=='$API_GATEWAY_NAME'].id" \
    --output text 2>/dev/null)

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    echo -e "${GREEN}✅ API Gateway: $API_GATEWAY_NAME - Found${NC}"
    API_URL="https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/prod"
    echo -e "   API URL: $API_URL"
    
    # Test health endpoint
    echo -e "${YELLOW}   Testing health endpoint...${NC}"
    if curl -f "$API_URL/api/health" --silent --max-time 10 > /dev/null; then
        echo -e "${GREEN}   ✅ Health check: Passed${NC}"
    else
        echo -e "${RED}   ❌ Health check: Failed${NC}"
    fi
else
    echo -e "${RED}❌ API Gateway: $API_GATEWAY_NAME - Not found${NC}"
fi

# Check RDS Aurora (if exists)
echo ""
echo -e "${YELLOW}Checking RDS Aurora...${NC}"
CLUSTER_ID="modulus-aurora-cluster"
CLUSTER_STATUS=$(aws rds describe-db-clusters \
    --db-cluster-identifier "$CLUSTER_ID" \
    --region "$AWS_REGION" \
    --query 'DBClusters[0].Status' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$CLUSTER_STATUS" = "available" ]; then
    echo -e "${GREEN}✅ RDS Aurora: $CLUSTER_ID - Available${NC}"
    
    # Get endpoint
    CLUSTER_ENDPOINT=$(aws rds describe-db-clusters \
        --db-cluster-identifier "$CLUSTER_ID" \
        --region "$AWS_REGION" \
        --query 'DBClusters[0].Endpoint' \
        --output text 2>/dev/null)
    echo -e "   Endpoint: $CLUSTER_ENDPOINT"
elif [ "$CLUSTER_STATUS" = "NOT_FOUND" ]; then
    echo -e "${YELLOW}⚠️  RDS Aurora: Not configured (using Lambda environment)${NC}"
else
    echo -e "${RED}❌ RDS Aurora: $CLUSTER_ID - $CLUSTER_STATUS${NC}"
fi

echo ""
echo "========================================"

# Summary
TOTAL_CHECKS=3
PASSED_CHECKS=0

if [ "$LAMBDA_STATUS" = "Active" ]; then
    ((PASSED_CHECKS++))
fi

if aws s3api head-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null; then
    ((PASSED_CHECKS++))
fi

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    ((PASSED_CHECKS++))
fi

echo -e "${BLUE}Status Summary: $PASSED_CHECKS/$TOTAL_CHECKS components operational${NC}"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}🎉 All systems operational!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some components need attention${NC}"
    exit 1
fi
