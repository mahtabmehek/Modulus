#!/bin/bash

# Free Tier Usage Monitor
# Check your AWS Free Tier usage to avoid unexpected charges

echo "🔍 Checking AWS Free Tier Usage..."
echo "=================================="

# Get current month
CURRENT_MONTH=$(date +%Y-%m)

echo "📊 EC2 Usage (Free: 750 hours/month)"
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=$(aws ec2 describe-instances --query 'Reservations[].Instances[?State.Name==`running`].InstanceId' --output text) \
  --start-time ${CURRENT_MONTH}-01T00:00:00Z \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 3600 \
  --statistics Average \
  --query 'length(Datapoints)' \
  --output text 2>/dev/null || echo "No EC2 instances running"

echo ""
echo "📊 RDS Usage (Free: 750 hours/month)"
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=modulusdb \
  --start-time ${CURRENT_MONTH}-01T00:00:00Z \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 3600 \
  --statistics Average \
  --query 'length(Datapoints)' \
  --output text 2>/dev/null || echo "No RDS instances running"

echo ""
echo "📊 S3 Storage Usage (Free: 5GB)"
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=modulus-deployment-bucket Name=StorageType,Value=StandardStorage \
  --start-time ${CURRENT_MONTH}-01T00:00:00Z \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 86400 \
  --statistics Average \
  --query 'Datapoints[-1].Average' \
  --output text 2>/dev/null | awk '{print int($1/1024/1024/1024) " GB used"}' || echo "No S3 data available"

echo ""
echo "📊 Data Transfer (Free: 15GB/month)"
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name NetworkOut \
  --start-time ${CURRENT_MONTH}-01T00:00:00Z \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 86400 \
  --statistics Sum \
  --query 'sum(Datapoints[].Sum)' \
  --output text 2>/dev/null | awk '{print int($1/1024/1024/1024) " GB transferred"}' || echo "No transfer data available"

echo ""
echo "🎯 Tips to Stay Within Free Tier:"
echo "- Monitor usage weekly with this script"
echo "- Stop unused EC2 instances when not needed"
echo "- Clean up old S3 files periodically"
echo "- Use CloudWatch alarms for usage alerts"
echo "- Check AWS Billing Dashboard monthly"

echo ""
echo "✅ Free Tier Monitor Complete!"
