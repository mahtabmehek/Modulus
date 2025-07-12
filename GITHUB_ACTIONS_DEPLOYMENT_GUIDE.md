# Modulus LMS - Automated Deployment Guide

This guide explains how to use the GitHub Actions workflows to automatically deploy the Modulus LMS application to AWS.

## Overview

We've created three main deployment workflows:

1. **Full Stack Deployment** (`modulus-full-deployment.yml`) - Deploys both backend and frontend
2. **Backend Deployment** (`modulus-backend-deployment.yml`) - Deploys only the backend API
3. **Frontend Deployment** (`modulus-frontend-deployment.yml`) - Deploys only the frontend

## Why GitHub Actions?

GitHub Actions provides several advantages over manual deployment scripts:

- **Consistency**: Every deployment follows the same process
- **Security**: Secrets are managed securely in GitHub
- **Auditability**: Every deployment is logged and tracked
- **Rollback**: Easy to see what changed and when
- **Testing**: Automated validation before deployment
- **Parallelization**: Can run multiple jobs simultaneously
- **Integration**: Triggers on code changes automatically

## Prerequisites

### 1. AWS Credentials Setup

In your GitHub repository, go to Settings > Secrets and Variables > Actions, and add these secrets:

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_ACCOUNT_ID=your_12_digit_aws_account_id
```

### 2. Database Configuration

Add these database secrets:

```
DB_HOST=your_rds_endpoint
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=modulus_lms
JWT_SECRET=your_jwt_secret_key
```

### 3. AWS Permissions

Your AWS user/role needs these permissions:

- Lambda: Create, update, and invoke functions
- API Gateway: Create and manage APIs
- IAM: Create and manage service roles
- S3: Create buckets and upload files
- RDS: Access to your database

## Deployment Workflows

### Full Stack Deployment

**File**: `.github/workflows/modulus-full-deployment.yml`

**Triggers**:
- Push to `main` branch
- Manual trigger via GitHub Actions UI

**What it does**:
1. Validates frontend and backend code
2. Deploys backend to AWS Lambda
3. Sets up API Gateway
4. Builds and deploys frontend to S3
5. Runs comprehensive tests
6. Optionally seeds the database

**Usage**:
```bash
# Automatic: Push to main branch
git push origin main

# Manual: Go to GitHub Actions tab and trigger "Modulus LMS - Full Stack Deployment"
```

**Configuration Options** (manual trigger):
- `deploy_backend`: Deploy backend (default: true)
- `deploy_frontend`: Deploy frontend (default: true)
- `run_tests`: Run comprehensive tests (default: true)
- `seed_database`: Seed database with test data (default: false)

### Backend Deployment

**File**: `.github/workflows/modulus-backend-deployment.yml`

**Triggers**:
- Push to `main` branch with changes in `backend/` folder
- Manual trigger

**What it does**:
1. Validates backend structure and endpoints
2. Creates optimized deployment package
3. Deploys to AWS Lambda
4. Sets up/updates API Gateway
5. Tests all API endpoints

**Key Features**:
- Validates all critical endpoints exist
- Checks for role-based access codes
- Tests approval functionality
- Verifies course management APIs
- Comprehensive error handling

### Frontend Deployment

**File**: `.github/workflows/modulus-frontend-deployment.yml`

**Triggers**:
- Push to `main` branch with changes in frontend files
- Manual trigger

**What it does**:
1. Builds Next.js application with correct API URL
2. Deploys to S3 with static website hosting
3. Configures public access policies
4. Tests deployment accessibility
5. Validates build artifacts

**Key Features**:
- Automatically detects API Gateway URL
- Optimized S3 deployment (no CloudFront overhead)
- Build validation and testing
- Static asset verification

## Deployment Architecture

### Backend (AWS Lambda + API Gateway)
```
GitHub → Lambda Function (Node.js 18) → API Gateway → Internet
                ↓
            Amazon RDS (MySQL)
```

### Frontend (S3 Static Website)
```
GitHub → S3 Bucket (Static Website Hosting) → Internet
```

### API Endpoints Deployed
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/admin/users` - List users (admin only)
- `POST /api/admin/approve/:id` - Approve users (admin only)
- `POST /api/admin/create-user` - Create user (admin only)
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

## Monitoring and Debugging

### Viewing Deployment Status
1. Go to your GitHub repository
2. Click on "Actions" tab
3. View running/completed workflows

### Common Issues and Solutions

#### Backend Deployment Fails
```bash
# Check Lambda logs
aws logs tail /aws/lambda/modulus-backend --follow

# Check API Gateway
aws apigateway get-rest-apis --query 'items[?name==`modulus-api`]'
```

#### Frontend Build Fails
- Check if `NEXT_PUBLIC_API_URL` is set correctly
- Verify all dependencies are in `package.json`
- Check for TypeScript errors

#### Database Connection Issues
- Verify RDS endpoint is correct
- Check security groups allow Lambda access
- Ensure database credentials are correct

### Manual Testing Commands

After deployment, test the endpoints:

```bash
# Get the API URL from deployment output, then:

# Test health
curl https://your-api-id.execute-api.eu-west-2.amazonaws.com/prod/api/health

# Test registration
curl -X POST https://your-api-id.execute-api.eu-west-2.amazonaws.com/prod/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@modulus.edu",
    "password": "TestPass123!",
    "role": "student",
    "accessCode": "STUDENT2024"
  }'

# Test frontend
curl http://modulus-frontend-production.s3-website.eu-west-2.amazonaws.com
```

## Cost Optimization

The deployment uses these AWS services:

1. **Lambda**: Pay per execution (free tier: 1M requests/month)
2. **API Gateway**: Pay per API call (free tier: 1M calls/month)
3. **S3**: Pay for storage and requests (free tier: 5GB storage)
4. **RDS**: Ongoing cost (consider Aurora Serverless for cost optimization)

## Security Features

- Secrets stored securely in GitHub
- IAM roles with minimal permissions
- API Gateway with CORS configuration
- S3 bucket policies for controlled access
- Environment-specific configurations

## Rollback Strategy

To rollback a deployment:

1. **Backend**: Redeploy previous version via GitHub Actions
2. **Frontend**: Use S3 versioning or redeploy previous commit
3. **Database**: Use RDS snapshots for schema changes

## Next Steps

1. Set up the required secrets in GitHub
2. Test the workflows with manual triggers
3. Set up monitoring and alerting
4. Configure branch protection rules
5. Add integration tests
6. Set up staging environment

## Environment URLs

After deployment, you'll have:

- **Frontend**: `http://modulus-frontend-production.s3-website.eu-west-2.amazonaws.com`
- **API**: `https://{api-id}.execute-api.eu-west-2.amazonaws.com/prod/api`
- **Admin**: Same frontend URL with admin login

## Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Review AWS CloudWatch logs
3. Verify all secrets are set correctly
4. Ensure AWS permissions are adequate
5. Test individual components manually

---

*This automated deployment system ensures consistent, reliable deployments while maintaining security and providing comprehensive testing.*
