# Modulus LMS - Deployment Architecture Overview

## 🚀 Deployment Structure

### Frontend Deployment (`frontend-deployment.sh`)
- **Purpose**: Deploy Next.js frontend application
- **Infrastructure**:
  - ECS Fargate service for frontend
  - Application Load Balancer (ALB)
  - ECR repository for frontend images
  - Security groups for web traffic
  - CloudWatch logging

### Backend Deployment (`backend-deployment.sh`)
- **Purpose**: Deploy Node.js/Express API and PostgreSQL database
- **Infrastructure**:
  - RDS PostgreSQL database (db.t3.micro)
  - ECS Fargate service for backend API
  - Secrets Manager for database credentials
  - Security groups for backend and database
  - ALB integration with `/api/*` routing
  - CloudWatch logging

## 📁 File Structure

```
.
├── frontend-deployment.sh           # Frontend deployment script
├── backend-deployment.sh            # Backend deployment script
├── .github/workflows/
│   ├── frontend-deployment.yml      # Frontend CI/CD workflow
│   └── backend-deployment.yml       # Backend CI/CD workflow
├── backend/                         # Backend application
│   ├── package.json
│   ├── server.js
│   └── Dockerfile
└── src/                            # Frontend application
```

## 🔄 GitHub Actions Triggers

### Frontend Deployment
- **Trigger**: Any push to `master` branch
- **Workflow**: `.github/workflows/frontend-deployment.yml`
- **Script**: `frontend-deployment.sh`

### Backend Deployment
- **Trigger**: Push to `master` with changes in:
  - `backend/**` directory
  - `backend-deployment.sh`
  - `.github/workflows/backend-deployment.yml`
- **Workflow**: `.github/workflows/backend-deployment.yml`
- **Script**: `backend-deployment.sh`

## 🏗️ AWS Infrastructure

### Shared Resources
- **VPC**: Default VPC in eu-west-2
- **ALB**: `modulus-alb` (serves both frontend and backend)
- **ECS Cluster**: `modulus-cluster`

### Frontend Resources
- **ECS Service**: `modulus-service`
- **ECR Repository**: `modulus-lms`
- **Security Group**: `modulus-sg`
- **Target Group**: `modulus-tg`

### Backend Resources
- **ECS Service**: `modulus-backend-service`
- **ECR Repository**: `modulus-backend`
- **Security Group**: `modulus-backend-sg`
- **Target Group**: `modulus-backend-tg`
- **RDS Instance**: `modulus-db` (PostgreSQL)
- **DB Security Group**: `modulus-db-sg`
- **Secrets Manager**: `modulus/db/password`

## 🌐 Access URLs

### Production URLs
- **Frontend**: `http://<ALB-DNS>/`
- **Backend API**: `http://<ALB-DNS>/api/status`
- **Backend Health**: `http://<ALB-DNS>/api/../health`

### API Endpoints
- `GET /api/status` - API status
- `GET /api/users` - Users endpoint (placeholder)
- `GET /api/labs` - Labs endpoint (placeholder)
- `GET /health` - Backend health check
- `GET /health/db` - Database connectivity check

## 💰 Cost Optimization (AWS Free Tier)

### Compute
- **ECS Fargate**: Minimal CPU/memory allocation
- **Frontend**: 256 CPU, 512 MB memory
- **Backend**: 256 CPU, 512 MB memory

### Database
- **RDS**: db.t3.micro (Free Tier eligible)
- **Storage**: 20 GB GP2 (Free Tier limit)
- **Backup**: 7-day retention

### Networking
- **ALB**: Single load balancer for both services
- **NAT Gateway**: Not used (public subnets)

### Monitoring
- **CloudWatch Logs**: 7-day retention
- **Health Checks**: Built-in ECS/ALB health monitoring

## 🔧 Manual Deployment Commands

### Deploy Frontend Only
```bash
./frontend-deployment.sh
```

### Deploy Backend Only
```bash
./backend-deployment.sh
```

### Check Deployment Status
```bash
aws ecs describe-services --cluster modulus-cluster --services modulus-service modulus-backend-service --region eu-west-2
```

### View Logs
```bash
# Frontend logs
aws logs tail /ecs/modulus --follow --region eu-west-2

# Backend logs
aws logs tail /ecs/modulus-backend --follow --region eu-west-2
```

## 🔒 Security Configuration

### Network Security
- **Frontend**: Open to internet (ports 80, 443, 3000)
- **Backend**: ALB traffic only (port 3001)
- **Database**: Backend access only (port 5432)

### Authentication
- **Database**: Username/password via Secrets Manager
- **AWS Resources**: IAM roles and policies
- **Container Security**: Non-root user execution

## 🚨 Troubleshooting

### Common Issues
1. **Build Failures**: Check Tailwind plugins in dependencies
2. **Database Connection**: Verify security group rules
3. **ALB 502 Errors**: Check ECS service health
4. **Docker Build**: Ensure Dockerfile syntax is correct

### Debug Commands
```bash
# Check ECS service status
aws ecs describe-services --cluster modulus-cluster --services modulus-service --region eu-west-2

# Check task logs
aws logs describe-log-streams --log-group-name /ecs/modulus --region eu-west-2

# Test database connectivity
aws rds describe-db-instances --db-instance-identifier modulus-db --region eu-west-2
```

## 📋 Next Steps

1. **Database Schema**: Create tables and initial data
2. **Authentication**: Implement user authentication system
3. **Environment Variables**: Configure frontend API endpoints
4. **SSL/TLS**: Add HTTPS certificate to ALB
5. **Monitoring**: Set up CloudWatch alarms and dashboards
6. **Backup Strategy**: Configure automated database backups
7. **CI/CD Enhancements**: Add testing stages to workflows

## 🎯 Features Implemented

✅ **Frontend Deployment**: Next.js on ECS Fargate
✅ **Backend Deployment**: Node.js/Express API on ECS Fargate  
✅ **Database**: PostgreSQL on RDS with security
✅ **Load Balancing**: ALB with path-based routing
✅ **Secrets Management**: Database credentials in Secrets Manager
✅ **Logging**: CloudWatch integration for both services
✅ **Health Checks**: Application and database health monitoring
✅ **Idempotent Deployment**: Safe to run multiple times
✅ **Cost Optimization**: Free Tier compatible configuration
✅ **GitHub Actions**: Automated CI/CD workflows
✅ **Security Groups**: Proper network security isolation
