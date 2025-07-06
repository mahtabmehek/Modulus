#!/bin/bash

# Monitor Modulus Deployment Status
# Checks AWS resources and provides deployment troubleshooting

set -e

AWS_REGION="eu-west-2"
APP_NAME="modulus-ultra-simple"

echo "🔍 Monitoring Modulus Deployment Status..."
echo "=========================================="

# Check AWS CLI access
echo "1. Checking AWS Access..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "FAILED")
if [ "$ACCOUNT_ID" = "FAILED" ]; then
    echo "❌ AWS CLI not configured or no access"
    exit 1
else
    echo "✅ AWS Account: $ACCOUNT_ID"
fi

# Check ECR Repository
echo -e "\n2. Checking Container Repository..."
REPO_EXISTS=$(aws ecr describe-repositories --repository-names $APP_NAME --region $AWS_REGION 2>/dev/null && echo "YES" || echo "NO")
if [ "$REPO_EXISTS" = "YES" ]; then
    echo "✅ ECR Repository exists"
    # Get latest image
    LATEST_IMAGE=$(aws ecr describe-images --repository-name $APP_NAME --region $AWS_REGION --query 'sort_by(imageDetails,&imagePushedAt)[-1].imageTags[0]' --output text 2>/dev/null || echo "None")
    echo "📦 Latest image tag: $LATEST_IMAGE"
else
    echo "❌ ECR Repository not found"
fi

# Check ECS Cluster
echo -e "\n3. Checking ECS Cluster..."
CLUSTER_EXISTS=$(aws ecs describe-clusters --clusters modulus-simple --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null || echo "FAILED")
if [ "$CLUSTER_EXISTS" = "ACTIVE" ]; then
    echo "✅ ECS Cluster is active"
    
    # Check services
    SERVICES=$(aws ecs list-services --cluster modulus-simple --region $AWS_REGION --query 'serviceArns' --output text 2>/dev/null || echo "None")
    if [ "$SERVICES" != "None" ] && [ -n "$SERVICES" ]; then
        echo "📋 Active services found"
        
        # Check service status
        SERVICE_STATUS=$(aws ecs describe-services --cluster modulus-simple --services modulus-service --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null || echo "Not found")
        echo "🔄 Service status: $SERVICE_STATUS"
        
        # Check running tasks
        RUNNING_TASKS=$(aws ecs list-tasks --cluster modulus-simple --service-name modulus-service --region $AWS_REGION --query 'length(taskArns)' --output text 2>/dev/null || echo "0")
        echo "⚡ Running tasks: $RUNNING_TASKS"
    else
        echo "⚠️ No services found in cluster"
    fi
else
    echo "❌ ECS Cluster not found or inactive"
fi

# Check Load Balancer
echo -e "\n4. Checking Load Balancer..."
ALB_EXISTS=$(aws elbv2 describe-load-balancers --names modulus-simple-alb --region $AWS_REGION --query 'LoadBalancers[0].State.Code' --output text 2>/dev/null || echo "Not found")
if [ "$ALB_EXISTS" = "active" ]; then
    echo "✅ Load Balancer is active"
    
    # Get ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers --names modulus-simple-alb --region $AWS_REGION --query 'LoadBalancers[0].DNSName' --output text 2>/dev/null)
    echo "🌐 ALB URL: http://$ALB_DNS"
    
    # Check target health
    TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups --names modulus-simple-tg --region $AWS_REGION --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "Not found")
    if [ "$TARGET_GROUP_ARN" != "Not found" ]; then
        HEALTHY_TARGETS=$(aws elbv2 describe-target-health --target-group-arn "$TARGET_GROUP_ARN" --region $AWS_REGION --query 'length(TargetHealthDescriptions[?TargetHealth.State==`healthy`])' --output text 2>/dev/null || echo "0")
        echo "💚 Healthy targets: $HEALTHY_TARGETS"
    fi
else
    echo "❌ Load Balancer not found or not active"
fi

# Check RDS (if exists)
echo -e "\n5. Checking Database..."
DB_EXISTS=$(aws rds describe-db-instances --db-instance-identifier modulus-simple-db --region $AWS_REGION --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null || echo "Not found")
if [ "$DB_EXISTS" = "available" ]; then
    echo "✅ Database is available"
else
    echo "⚠️ Database not found (may be intentional for simple deployment)"
fi

echo -e "\n=========================================="
echo "🏁 Deployment Status Check Complete"
echo "=========================================="

# Provide next steps based on status
if [ "$CLUSTER_EXISTS" = "ACTIVE" ] && [ "$ALB_EXISTS" = "active" ]; then
    echo -e "\n🎉 Deployment appears successful!"
    echo "🔗 Try accessing: http://$ALB_DNS"
    echo "⏱️ Note: It may take 2-3 minutes for the app to be fully ready"
else
    echo -e "\n⚠️ Deployment may still be in progress or has issues"
    echo "💡 Check GitHub Actions for detailed logs"
    echo "📋 Common issues:"
    echo "   - GitHub secrets not set correctly"
    echo "   - AWS Free Tier limits exceeded"
    echo "   - Container failing to start (check CloudWatch logs)"
fi
