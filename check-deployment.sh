#!/bin/bash

# Quick deployment status check script

echo "=== MODULUS DEPLOYMENT STATUS CHECK ==="
echo

echo "1. Checking ECS Cluster..."
aws ecs describe-clusters --clusters modulus-cluster --region eu-west-2 --query 'clusters[0].status' --output text

echo "2. Checking ECS Service..."
SERVICE_STATUS=$(aws ecs describe-services --cluster modulus-cluster --services modulus-service --region eu-west-2 --query 'services[0].status' --output text 2>/dev/null || echo "NOT_FOUND")
RUNNING_COUNT=$(aws ecs describe-services --cluster modulus-cluster --services modulus-service --region eu-west-2 --query 'services[0].runningCount' --output text 2>/dev/null || echo "0")
DESIRED_COUNT=$(aws ecs describe-services --cluster modulus-cluster --services modulus-service --region eu-west-2 --query 'services[0].desiredCount' --output text 2>/dev/null || echo "0")

echo "Service Status: $SERVICE_STATUS"
echo "Running Tasks: $RUNNING_COUNT/$DESIRED_COUNT"

echo "3. Checking Load Balancer..."
ALB_DNS=$(aws elbv2 describe-load-balancers --region eu-west-2 --query 'LoadBalancers[?contains(LoadBalancerName, `modulus`)].DNSName' --output text 2>/dev/null || echo "NOT_FOUND")
ALB_STATE=$(aws elbv2 describe-load-balancers --region eu-west-2 --query 'LoadBalancers[?contains(LoadBalancerName, `modulus`)].State.Code' --output text 2>/dev/null || echo "NOT_FOUND")

echo "ALB DNS: $ALB_DNS"
echo "ALB State: $ALB_STATE"

echo "4. Checking Target Group Health..."
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups --region eu-west-2 --query 'TargetGroups[?contains(TargetGroupName, `modulus`)].TargetGroupArn' --output text 2>/dev/null)

if [ "$TARGET_GROUP_ARN" != "" ]; then
    echo "Target Group Found: $TARGET_GROUP_ARN"
    aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN --region eu-west-2 --query 'TargetHealthDescriptions[].{Target:Target.Id,Health:TargetHealth.State}' --output table
else
    echo "No target group found"
fi

echo "5. Application URL:"
if [ "$ALB_DNS" != "NOT_FOUND" ] && [ "$ALB_DNS" != "" ]; then
    echo "🌐 http://$ALB_DNS"
else
    echo "❌ No load balancer found - deployment may have failed"
fi

echo
echo "=== END STATUS CHECK ==="
