# Modulus LMS - AWS CLI Deployment Guide

This guide provides comprehensive AWS CLI deployment scripts for the Modulus LMS application, including all the fixes and features that have been implemented.

## 🚀 Quick Start

### Prerequisites
- AWS CLI installed and configured (`aws configure`)
- Node.js and npm installed
- Access to AWS account with appropriate permissions

### One-Command Deployment

**Windows (Batch):**
```batch
quick-deploy.bat
```

**Linux/macOS (Bash):**
```bash
chmod +x deploy-trigger.sh
./deploy-trigger.sh
```

**Windows (PowerShell):**
```powershell
.\deploy-trigger.ps1 -DeployType full
```

## 📋 Available Scripts

### Main Deployment Scripts

| Script | Platform | Description |
|--------|----------|-------------|
| `deploy-trigger.sh` | Linux/macOS | Full-featured deployment script with menu |
| `deploy-trigger.ps1` | Windows | PowerShell deployment script with parameters |
| `quick-deploy.bat` | Windows | Simple batch file with menu interface |

### Status Checking Scripts

| Script | Platform | Description |
|--------|----------|-------------|
| `check-deployment-status.sh` | Linux/macOS | Comprehensive status checker |
| `simple-status-check.ps1` | Windows | Quick status verification |

### Configuration Files

| File | Description |
|------|-------------|
| `deployment-config.json` | Deployment configuration and feature flags |

## 🎯 Deployment Options

All scripts support the following deployment modes:

1. **Full Deployment** - Backend + Frontend + Database + Tests
2. **Backend Only** - Lambda function deployment
3. **Frontend Only** - S3 static website deployment
4. **Database Only** - Database table initialization
5. **Tests Only** - Run API endpoint tests
6. **Status Check** - Verify deployment status

## 🔧 Configuration

### AWS Resources

The deployment uses these AWS resources:

- **Region:** `eu-west-2` (London)
- **Lambda Function:** `modulus-backend`
- **S3 Bucket:** `modulus-frontend-1370267358`
- **API Gateway:** `modulus-api`
- **RDS Aurora:** `modulus-aurora-cluster` (optional)

### Role-Based Access Codes

The system now supports role-specific access codes:

- **Student:** `student2025` (auto-approved)
- **Instructor:** `instructor2025` (requires approval)
- **Staff:** `staff2025` (requires approval)
- **Admin:** `mahtabmehek1337` (auto-approved)

## 📝 Features Included

### Backend Features
✅ Role-based registration with access codes  
✅ User approval workflow for staff/instructors  
✅ Admin user management APIs  
✅ Course management APIs (CRUD)  
✅ Database initialization endpoints  
✅ Health check endpoints  

### Frontend Features
✅ Updated registration form with role dropdown  
✅ Dynamic access code hints removed  
✅ Admin dashboard with real user data  
✅ Course and lab management interfaces  
✅ User approval functionality  
✅ Profile page improvements  

### Deployment Features
✅ Automated backend packaging and deployment  
✅ Frontend build and S3 sync  
✅ S3 website hosting configuration  
✅ Database table initialization  
✅ Comprehensive API testing  
✅ Status monitoring and health checks  

## 🚀 Usage Examples

### Deploy Everything
```bash
# Interactive menu
./deploy-trigger.sh

# Direct command
./deploy-trigger.sh
# Select option 1 for full deployment
```

### Deploy Backend Only
```powershell
.\deploy-trigger.ps1 -DeployType backend
```

### Check Status
```bash
./check-deployment-status.sh
```

### Run Tests Only
```batch
quick-deploy.bat
REM Select option 5
```

## 🔍 Troubleshooting

### Common Issues

1. **AWS CLI not configured**
   ```bash
   aws configure
   # Enter your AWS credentials
   ```

2. **Permission denied errors**
   ```bash
   chmod +x deploy-trigger.sh
   chmod +x check-deployment-status.sh
   ```

3. **Lambda function not found**
   - Ensure the Lambda function `modulus-backend` exists
   - Check the region is correct (`eu-west-2`)

4. **S3 bucket access denied**
   - Verify bucket name: `modulus-frontend-1370267358`
   - Ensure your AWS user has S3 permissions

5. **API Gateway not found**
   - Check if API Gateway `modulus-api` exists
   - Verify the API is deployed to the `prod` stage

### Health Check Endpoints

Test these endpoints to verify deployment:

```bash
# Health check
curl https://YOUR_API_ID.execute-api.eu-west-2.amazonaws.com/prod/api/health

# Registration test (student)
curl -X POST https://YOUR_API_ID.execute-api.eu-west-2.amazonaws.com/prod/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123!","role":"student","accessCode":"student2025"}'
```

## 📊 Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Lambda        │
│   (S3 Static)   │────│   (REST API)    │────│   (Node.js)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        │
                                               ┌─────────────────┐
                                               │   RDS Aurora    │
                                               │   (MySQL)       │
                                               │                 │
                                               └─────────────────┘
```

## 🔐 Security Considerations

- All API endpoints use HTTPS
- Role-based access control implemented
- User approval workflow for sensitive roles
- Environment variables for sensitive configuration
- CORS properly configured for frontend domain

## 📈 Monitoring

### CloudWatch Logs
- Lambda function logs: `/aws/lambda/modulus-backend`
- API Gateway logs: Available in CloudWatch

### Status Monitoring
Run the status scripts regularly to monitor:
- Lambda function health
- S3 bucket accessibility
- API Gateway responsiveness
- Database connectivity

## 🔄 CI/CD Integration

While these scripts focus on AWS CLI deployment, they can be integrated into CI/CD pipelines:

1. Use in GitHub Actions workflows
2. Integrate with Jenkins pipelines
3. Use in AWS CodePipeline stages
4. Run from local development environments

## 🆘 Support

If you encounter issues:

1. Check the AWS CloudWatch logs
2. Verify your AWS permissions
3. Ensure all prerequisites are installed
4. Run the status check scripts for diagnostics

## 📚 Additional Resources

- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)

---

**Note:** This deployment setup reflects all the fixes and improvements made to the Modulus LMS system, including role-based access codes, user approval workflows, and comprehensive admin functionality.
