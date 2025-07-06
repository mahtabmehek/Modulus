# AWS Integration Setup Guide

## Overview

This guide will help you configure Modulus LMS to work with AWS services for real-time monitoring, metrics, and infrastructure management.

## Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured (optional but recommended)
3. **IAM Permissions**: Required permissions for CloudWatch, EKS, RDS, S3, EC2, and Load Balancer access

## Required AWS Services

### 1. **Amazon EKS (Elastic Kubernetes Service)**
- **Purpose**: Container orchestration for virtual desktops and application services
- **Required for**: Kubernetes cluster metrics, pod monitoring, node health
- **Setup**: Deploy EKS cluster with Container Insights enabled

### 2. **Amazon RDS (Relational Database Service)**
- **Purpose**: Application database for user data, courses, progress tracking
- **Required for**: Database performance metrics, connection monitoring
- **Setup**: PostgreSQL or MySQL instance with CloudWatch monitoring enabled

### 3. **Application Load Balancer (ALB)**
- **Purpose**: Traffic distribution and SSL termination
- **Required for**: Request metrics, response times, health checks
- **Setup**: ALB with target groups pointing to EKS services

### 4. **Amazon S3**
- **Purpose**: Storage for course materials, user uploads, backups
- **Required for**: Storage metrics, usage monitoring
- **Setup**: S3 bucket with CloudWatch metrics enabled

### 5. **Amazon CloudWatch**
- **Purpose**: Metrics collection, monitoring, alerting
- **Required for**: All system metrics and health monitoring
- **Setup**: Enabled by default, configure custom dashboards

## Configuration Steps

### Step 1: Set Up Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Configure your AWS settings in `.env.local`:
   ```bash
   # AWS Region
   NEXT_PUBLIC_AWS_REGION=us-east-1
   AWS_REGION=us-east-1

   # AWS Credentials (if not using IAM roles)
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here

   # Resource Identifiers
   NEXT_PUBLIC_EKS_CLUSTER_NAME=modulus-cluster
   NEXT_PUBLIC_RDS_INSTANCE_ID=modulus-db
   NEXT_PUBLIC_ALB_NAME=modulus-alb
   NEXT_PUBLIC_S3_BUCKET=modulus-storage
   ```

### Step 2: Configure IAM Permissions

Create an IAM policy with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:GetMetricData"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:DescribeNodegroup",
        "eks:ListClusters"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:HeadBucket"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeTargetHealth"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 3: Enable Container Insights (for EKS)

1. Enable Container Insights on your EKS cluster:
   ```bash
   aws eks update-cluster-config \
     --region us-east-1 \
     --name modulus-cluster \
     --logging '{"enable":["api","audit","authenticator","controllerManager","scheduler"]}'
   ```

2. Install CloudWatch Container Insights:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cloudwatch-namespace.yaml

   kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cwagent/cwagent-daemonset.yaml
   ```

### Step 4: Configure RDS Monitoring

1. Enable Enhanced Monitoring on your RDS instance:
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier modulus-db \
     --monitoring-interval 60 \
     --monitoring-role-arn arn:aws:iam::YOUR_ACCOUNT:role/rds-monitoring-role
   ```

2. Enable Performance Insights (optional):
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier modulus-db \
     --enable-performance-insights \
     --performance-insights-retention-period 7
   ```

### Step 5: Set Up CloudWatch Dashboards

Create a custom CloudWatch dashboard for Modulus LMS:

1. Go to CloudWatch Console > Dashboards
2. Create new dashboard named "ModulusLMS"
3. Add widgets for:
   - EKS cluster CPU/Memory utilization
   - RDS database performance
   - ALB request count and latency
   - S3 storage usage

### Step 6: Configure Alerting

Set up CloudWatch alarms for critical metrics:

1. **High CPU Usage**: Alert when EKS nodes exceed 80% CPU
2. **Database Connections**: Alert when RDS connections exceed threshold
3. **Failed Requests**: Alert when ALB 5xx errors spike
4. **Storage Full**: Alert when S3 storage approaches limits

## Authentication Options

### Option 1: AWS Credentials (Development)
Use access keys for development environments:
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Option 2: IAM Roles (Production)
Use IAM roles for production deployments:
1. Create IAM role with required permissions
2. Attach role to EC2 instances or EKS pods
3. No need to set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY

### Option 3: AWS SSO/CLI Profiles
Use AWS CLI profiles for local development:
```bash
aws configure --profile modulus
export AWS_PROFILE=modulus
```

## Resource Naming Convention

Follow this naming convention for AWS resources:

- **EKS Cluster**: `modulus-cluster-{environment}`
- **RDS Instance**: `modulus-db-{environment}`
- **Load Balancer**: `modulus-alb-{environment}`
- **S3 Bucket**: `modulus-storage-{environment}-{random}`
- **CloudWatch Log Group**: `/aws/modulus/{service}-{environment}`

## Monitoring Features

Once configured, the admin dashboard will display:

### Real-time Metrics
- ✅ EKS cluster health and resource usage
- ✅ RDS database performance and connections
- ✅ Load balancer traffic and response times
- ✅ S3 storage usage and costs
- ✅ System uptime and availability

### Infrastructure Health
- ✅ Service status indicators
- ✅ Instance health checks
- ✅ Error rate monitoring
- ✅ Performance metrics

### Alerting & Notifications
- ✅ Real-time alerts from CloudWatch
- ✅ Security notifications
- ✅ Performance warnings
- ✅ Resource usage alerts

## Troubleshooting

### Common Issues

1. **"AWS is not properly configured" Error**
   - Check environment variables are set correctly
   - Verify AWS credentials have required permissions
   - Ensure AWS region is valid

2. **"Permission denied" Errors**
   - Review IAM policy permissions
   - Check resource ARNs are correct
   - Verify cross-account access if needed

3. **No Metrics Data**
   - Ensure CloudWatch monitoring is enabled
   - Check resource names match configuration
   - Verify data exists for the time range

4. **High API Costs**
   - Increase refresh interval in production
   - Use CloudWatch metric filters
   - Implement caching for metrics

### Testing Configuration

Run the configuration test:
```bash
npm run test:aws-config
```

Or check in the admin dashboard:
- Go to Admin Dashboard
- Check AWS Integration Status panel
- Click "Refresh" to test connection
- Review any error messages

## Cost Optimization

### CloudWatch Costs
- Use longer retention periods only for critical metrics
- Implement metric filters to reduce data points
- Use CloudWatch Logs Insights instead of real-time streaming

### API Call Optimization
- Cache metrics data locally
- Use batch API calls where possible
- Implement exponential backoff for retries

### Resource Tagging
Tag all resources for cost allocation:
```json
{
  "Project": "ModulusLMS",
  "Environment": "production",
  "Component": "monitoring"
}
```

## Security Best Practices

1. **Use IAM Roles**: Prefer IAM roles over access keys
2. **Least Privilege**: Grant minimum required permissions
3. **Rotate Credentials**: Regularly rotate access keys
4. **VPC Endpoints**: Use VPC endpoints for AWS API calls
5. **Encryption**: Enable encryption for all data stores

## Next Steps

1. Deploy the AWS infrastructure using the provided Terraform/CloudFormation templates
2. Configure monitoring and alerting rules
3. Set up automated backups and disaster recovery
4. Implement cost monitoring and optimization
5. Configure security scanning and compliance checks

For detailed deployment instructions, see:
- [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)
- [COMPLETE_AWS_DEPLOYMENT.md](./COMPLETE_AWS_DEPLOYMENT.md)
