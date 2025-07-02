# 🚀 AWS Deployment Guide for Modulus LMS

This guide provides step-by-step instructions for deploying Modulus LMS to AWS with a production-ready architecture.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Route 53 (DNS)                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              CloudFront (CDN)                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│         Application Load Balancer (ALB)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                ┌─────▼─────┐
                │    VPC    │
                │           │
        ┌───────▼───────────▼──────┐
        │   Public Subnets        │
        │  ┌─────────────────────┐ │
        │  │   EKS Cluster       │ │
        │  │                     │ │
        │  │ ┌─────────────────┐ │ │
        │  │ │  Web Frontend   │ │ │
        │  │ │   (Next.js)     │ │ │
        │  │ └─────────────────┘ │ │
        │  │                     │ │
        │  │ ┌─────────────────┐ │ │
        │  │ │   API Server    │ │ │
        │  │ │   (Node.js)     │ │ │
        │  │ └─────────────────┘ │ │
        │  │                     │ │
        │  │ ┌─────────────────┐ │ │
        │  │ │ Desktop Service │ │ │
        │  │ │  (Kubernetes)   │ │ │
        │  │ └─────────────────┘ │ │
        │  └─────────────────────┘ │
        └───────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Private Subnets         │
        │  ┌─────────────────────┐  │
        │  │      RDS            │  │
        │  │   (PostgreSQL)      │  │
        │  └─────────────────────┘  │
        │                           │
        │  ┌─────────────────────┐  │
        │  │    ElastiCache      │  │
        │  │     (Redis)         │  │
        │  └─────────────────────┘  │
        └───────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │         S3 Buckets        │
        │                           │
        │ • Static Assets           │
        │ • User Files              │
        │ • Lab Resources           │
        │ • Backups                 │
        └───────────────────────────┘
```

## 📋 Prerequisites

### Required Tools
- AWS CLI v2
- kubectl
- eksctl
- Docker
- Node.js 18+
- Terraform (optional, for Infrastructure as Code)

### AWS Account Setup
- AWS Account with appropriate permissions
- IAM user with AdministratorAccess or specific EKS/RDS/S3 permissions
- AWS CLI configured with credentials

## 🚀 Deployment Steps

### Phase 1: Infrastructure Setup

#### 1.1 Create VPC and Networking
```bash
# Create VPC with public and private subnets
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=modulus-vpc}]'

# Create Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=modulus-igw}]'

# Create public subnets (2 AZs for high availability)
aws ec2 create-subnet --vpc-id vpc-xxxxxx --cidr-block 10.0.1.0/24 --availability-zone us-west-2a
aws ec2 create-subnet --vpc-id vpc-xxxxxx --cidr-block 10.0.2.0/24 --availability-zone us-west-2b

# Create private subnets
aws ec2 create-subnet --vpc-id vpc-xxxxxx --cidr-block 10.0.10.0/24 --availability-zone us-west-2a
aws ec2 create-subnet --vpc-id vpc-xxxxxx --cidr-block 10.0.20.0/24 --availability-zone us-west-2b
```

#### 1.2 Create EKS Cluster
```bash
# Create EKS cluster
eksctl create cluster \
  --name modulus-cluster \
  --version 1.28 \
  --region us-west-2 \
  --nodegroup-name modulus-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10 \
  --ssh-access \
  --ssh-public-key your-key-name \
  --managed
```

#### 1.3 Create RDS Database
```bash
# Create RDS subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name modulus-db-subnet-group \
  --db-subnet-group-description "Modulus DB subnet group" \
  --subnet-ids subnet-xxxxxx subnet-yyyyyy

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier modulus-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username modulusadmin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxx \
  --db-subnet-group-name modulus-db-subnet-group
```

#### 1.4 Create S3 Buckets
```bash
# Static assets bucket
aws s3 mb s3://modulus-static-assets-unique-suffix

# User files bucket
aws s3 mb s3://modulus-user-files-unique-suffix

# Lab resources bucket
aws s3 mb s3://modulus-lab-resources-unique-suffix

# Configure bucket policies for appropriate access
```

### Phase 2: Application Deployment

#### 2.1 Build and Push Docker Images

**Frontend Dockerfile:**
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**Build and Push:**
```bash
# Create ECR repositories
aws ecr create-repository --repository-name modulus-frontend
aws ecr create-repository --repository-name modulus-api

# Get login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com

# Build and push frontend
docker build -t modulus-frontend .
docker tag modulus-frontend:latest ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/modulus-frontend:latest
docker push ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/modulus-frontend:latest
```

#### 2.2 Deploy to Kubernetes

**Frontend Deployment:**
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: modulus-frontend
  namespace: modulus
spec:
  replicas: 3
  selector:
    matchLabels:
      app: modulus-frontend
  template:
    metadata:
      labels:
        app: modulus-frontend
    spec:
      containers:
      - name: frontend
        image: ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/modulus-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: modulus-frontend-service
  namespace: modulus
spec:
  selector:
    app: modulus-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

**Ingress Configuration:**
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: modulus-ingress
  namespace: modulus
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/CERT_ID
    alb.ingress.kubernetes.io/ssl-redirect: '443'
spec:
  rules:
  - host: modulus.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: modulus-frontend-service
            port:
              number: 80
```

**Deploy to Kubernetes:**
```bash
# Create namespace
kubectl create namespace modulus

# Apply configurations
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"
```

### Phase 3: Desktop-as-a-Service Setup

#### 3.1 Kali Linux Desktop Deployment
```yaml
# k8s/kali-desktop.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kali-desktop-template
  namespace: modulus-labs
spec:
  replicas: 0  # Template only, scaled dynamically
  selector:
    matchLabels:
      app: kali-desktop
  template:
    metadata:
      labels:
        app: kali-desktop
    spec:
      containers:
      - name: kali-desktop
        image: kalilinux/kali-rolling:latest
        ports:
        - containerPort: 5901  # VNC
        - containerPort: 22    # SSH
        env:
        - name: VNC_PASSWORD
          valueFrom:
            secretKeyRef:
              name: vnc-secret
              key: password
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: user-home
          mountPath: /home/kali
      volumes:
      - name: user-home
        persistentVolumeClaim:
          claimName: user-home-pvc
```

#### 3.2 Auto-scaling Configuration
```yaml
# k8s/desktop-autoscaler.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kali-desktop-hpa
  namespace: modulus-labs
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kali-desktop-template
  minReplicas: 0
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Phase 4: Monitoring and Security

#### 4.1 CloudWatch Integration
```bash
# Install CloudWatch agent
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cloudwatch-namespace.yaml

kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cwagent/cwagent-daemonset.yaml
```

#### 4.2 Security Policies
```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: lab-isolation
  namespace: modulus-labs
spec:
  podSelector:
    matchLabels:
      type: lab-environment
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: modulus
    ports:
    - protocol: TCP
      port: 5901
    - protocol: TCP
      port: 22
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443
```

## 🔐 Security Hardening

### 4.1 IAM Roles and Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::modulus-*/*"
    }
  ]
}
```

### 4.2 Secrets Management
```bash
# Create secrets for database connection
kubectl create secret generic db-secret \
  --from-literal=username=modulusadmin \
  --from-literal=password=YourSecurePassword123! \
  --from-literal=host=modulus-db.xxxx.us-west-2.rds.amazonaws.com \
  --namespace=modulus

# Create TLS certificates
kubectl create secret tls modulus-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  --namespace=modulus
```

## 📊 Monitoring and Logging

### CloudWatch Dashboards
- **Application Performance**: Response times, error rates
- **Infrastructure Health**: CPU, memory, network usage
- **Security Events**: Failed logins, suspicious activity
- **Cost Optimization**: Resource utilization, scaling metrics

### Log Aggregation
```bash
# Install Fluent Bit for log collection
kubectl apply -f https://raw.githubusercontent.com/aws/aws-for-fluent-bit/mainline/aws-for-fluent-bit.yaml
```

## 💰 Cost Optimization

### Reserved Instances
- **RDS**: Use Reserved Instances for database
- **EC2**: Reserve capacity for predictable workloads

### Auto-scaling
- **Horizontal Pod Autoscaler**: Scale based on CPU/memory
- **Cluster Autoscaler**: Add/remove nodes based on demand
- **Vertical Pod Autoscaler**: Right-size container resources

### Storage Optimization
- **S3 Intelligent Tiering**: Automatic cost optimization
- **EBS GP3**: Better performance per dollar than GP2

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    - name: Build and push to ECR
      run: |
        aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
        docker build -t modulus-frontend .
        docker tag modulus-frontend:latest $ECR_REGISTRY/modulus-frontend:$GITHUB_SHA
        docker push $ECR_REGISTRY/modulus-frontend:$GITHUB_SHA
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --name modulus-cluster --region us-west-2
        kubectl set image deployment/modulus-frontend frontend=$ECR_REGISTRY/modulus-frontend:$GITHUB_SHA
```

## 📈 Scaling Considerations

### Traffic Patterns
- **Peak Hours**: Scale up during class times
- **Exam Periods**: Increased resource allocation
- **Seasonal**: Higher usage during academic terms

### Geographic Distribution
- **Multi-Region**: Deploy in multiple AWS regions for global users
- **CloudFront**: CDN for static assets and improved performance

## 🔄 Backup and Disaster Recovery

### Database Backups
- **Automated RDS Backups**: 7-day retention
- **Manual Snapshots**: Before major updates
- **Cross-Region Replication**: For disaster recovery

### Application State
- **EFS for Persistent Storage**: User data and lab files
- **S3 Cross-Region Replication**: Critical assets backup

## 📞 Support and Maintenance

### Health Checks
- **Application**: /health endpoint
- **Database**: Connection monitoring
- **Kubernetes**: Node and pod health

### Update Strategy
- **Rolling Updates**: Zero-downtime deployments
- **Canary Releases**: Gradual feature rollouts
- **Blue-Green**: Full environment switching

---

This deployment guide provides a production-ready architecture for Modulus LMS on AWS. Adjust configurations based on your specific requirements, scale, and budget constraints.

**Next Steps:**
1. Set up AWS account and IAM permissions
2. Follow Phase 1-4 sequentially
3. Configure monitoring and alerting
4. Implement CI/CD pipeline
5. Test disaster recovery procedures
6. Optimize for your specific use case

For detailed support and customization, contact the Modulus development team.
