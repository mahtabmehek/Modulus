#!/bin/bash

# Monitor Modulus LMS Deployment Status

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

AWS_REGION="eu-west-2"
CLUSTER_NAME="modulus-cluster"
SERVICE_NAME="modulus-service"
ALB_NAME="modulus-alb"

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🔍 Modulus LMS Deployment Status Check"
echo "======================================"

# Check ECS Service
log_info "Checking ECS Service Status..."
SERVICE_STATUS=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}' --output table 2>/dev/null || echo "Service not found")

if [ "$SERVICE_STATUS" = "Service not found" ]; then
    log_warning "ECS Service not found - deployment may be in progress"
else
    echo "$SERVICE_STATUS"
fi

# Check ALB Status
log_info "Checking Load Balancer..."
ALB_DNS=$(aws elbv2 describe-load-balancers --names $ALB_NAME --region $AWS_REGION --query 'LoadBalancers[0].DNSName' --output text 2>/dev/null || echo "None")

if [ "$ALB_DNS" = "None" ]; then
    log_warning "Load Balancer not found"
else
    log_success "Load Balancer DNS: http://$ALB_DNS"
fi

# Check Target Health
log_info "Checking Target Group Health..."
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups --names modulus-tg --region $AWS_REGION --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "None")

if [ "$TARGET_GROUP_ARN" != "None" ]; then
    TARGET_HEALTH=$(aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN --region $AWS_REGION --query 'TargetHealthDescriptions[*].{Target:Target.Id,Health:TargetHealth.State}' --output table 2>/dev/null || echo "No targets")
    echo "$TARGET_HEALTH"
else
    log_warning "Target Group not found"
fi

# Check latest ECS tasks
log_info "Recent ECS Task Status..."
TASK_ARNS=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --region $AWS_REGION --query 'taskArns[0:3]' --output text 2>/dev/null || echo "None")

if [ "$TASK_ARNS" != "None" ] && [ -n "$TASK_ARNS" ]; then
    aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $TASK_ARNS --region $AWS_REGION --query 'tasks[*].{TaskArn:taskArn,LastStatus:lastStatus,DesiredStatus:desiredStatus,CreatedAt:createdAt}' --output table 2>/dev/null || log_warning "Could not get task details"
else
    log_warning "No tasks found"
fi

echo ""
log_info "💡 Tips:"
echo "  - GitHub Actions workflow: https://github.com/mahtabmehek/Modulus/actions"
echo "  - AWS ECS Console: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION"
echo "  - CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/%2Fecs%2Fmodulus"
