# Modulus - Interactive Learning Management System

Modulus is a comprehensive Learning Management System (LMS) designed specifically for cybersecurity education, combining the interactive features of TryHackMe with the course management capabilities of Moodle.

## 🚀 Quick Start

### Deployment
```bash
# Deploy to AWS (unified script)
./deploy.sh

# Or use GitHub Actions (push to main branch)
git push origin main
```

### AWS Management
```powershell
# Scan resources
.\aws-manager.ps1 scan

# Verify deployment
.\aws-manager.ps1 verify

# Clean up when done
.\aws-manager.ps1 cleanup
```

📖 **Full deployment guide**: See [DEPLOYMENT_UNIFIED.md](../DEPLOYMENT_UNIFIED.md)

## 🚀 Features

### Core Functionality
- **Multi-role Dashboard System**: Tailored interfaces for Students, Instructors, and Administrators
- **Desktop-as-a-Service**: Kubernetes-powered virtual lab environments with GUI and CLI access
- **Gamification**: Comprehensive badge system, learning streaks, and point rewards
- **Interactive Labs**: Hands-on cybersecurity labs with CTF-style challenges
- **Course Management**: Structured learning paths for different academic programs

### Technical Highlights
- **Modern Stack**: Next.js 15, TypeScript, Tailwind CSS
- **Cloud-Native**: Designed for AWS deployment with Kubernetes orchestration
- **Security-First**: Network segmentation, container isolation, and comprehensive monitoring
- **Responsive Design**: Dark/light theme support with accessibility features
- **Real-time Features**: Live progress tracking and notifications

## 🎯 Target Audience

- **Academic Institutions**: Universities and colleges offering cybersecurity programs
- **Students**: BSc and MSc cybersecurity learners
- **Instructors**: Educators creating and managing cybersecurity content
- **System Administrators**: IT staff managing the platform infrastructure

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom TryHackMe-inspired theme
- **State Management**: Zustand with persistence
- **Components**: Modular, reusable component architecture

### Backend & Infrastructure
- **Container Orchestration**: Amazon EKS (Kubernetes)
- **Database**: Amazon RDS (PostgreSQL) for relational data
- **Object Storage**: Amazon S3 for lab resources and user files
- **Load Balancing**: Application Load Balancer with auto-scaling
- **Monitoring**: CloudWatch, Prometheus, and Grafana integration
- **Security**: VPC with network segmentation, WAF, and IAM policies

### Virtual Desktop Environment
- **Container Runtime**: Lightweight Docker containers
- **Desktop Types**: Ubuntu, Kali Linux, Windows, CentOS
- **Access Methods**: VNC (GUI), SSH (CLI), web-based file transfer
- **Persistence**: Persistent volumes for user data
- **Resource Management**: CPU, memory, and storage quotas per user

## 🎓 Learning Paths

### BSc Computer Science - Cybersecurity
- Network Security Fundamentals
- Web Application Security
- Digital Forensics
- Incident Response

### MSc Cybersecurity - Advanced Threats
- Advanced Persistent Threats (APT)
- Malware Analysis
- Red Team Operations
- Security Architecture

## 🛡️ Security Features

### Lab Environment Security
- **Network Isolation**: Each lab runs in isolated network segments
- **Container Security**: Hardened container images with security policies
- **Resource Limits**: CPU, memory, and network bandwidth restrictions
- **Session Management**: Secure token-based authentication for desktop access
- **Audit Logging**: Comprehensive logging of all user activities

### Platform Security
- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **Monitoring**: Real-time security event monitoring and alerting

## 🎮 Gamification System

### Badges & Achievements
- **First Steps**: Complete your first lab
- **Week Warrior**: Maintain a 7-day learning streak
- **CTF Solver**: Complete challenge-type labs
- **Path Completionist**: Finish entire learning paths

### Progress Tracking
- **Experience Points**: Earned through lab completion and challenges
- **Learning Streaks**: Daily engagement tracking
- **Leaderboards**: Friendly competition among peers
- **Skill Trees**: Visual progress representation

## 🚀 Deployment Guide

### Prerequisites
- AWS Account with appropriate permissions
- kubectl CLI tool
- Docker installed locally
- Node.js 18+ for development

### AWS Infrastructure Setup

1. **VPC and Networking**
   ```bash
   # Create VPC with public/private subnets
   # Configure NAT gateways and security groups
   # Set up network segmentation for lab environments
   ```

2. **EKS Cluster Setup**
   ```bash
   # Create EKS cluster with managed node groups
   # Configure cluster autoscaling
   # Set up load balancer controller
   ```

3. **Database Setup**
   ```bash
   # Create RDS PostgreSQL instance
   # Configure backup and maintenance windows
   # Set up read replicas for scaling
   ```

4. **Storage Configuration**
   ```bash
   # Create S3 buckets for static assets
   # Configure IAM policies for access
   # Set up lifecycle policies
   ```

### Application Deployment

1. **Build and Push Images**
   ```bash
   # Build application Docker image
   # Push to Amazon ECR
   # Create Kubernetes manifests
   ```

2. **Deploy to Kubernetes**
   ```bash
   # Apply namespace and RBAC configs
   # Deploy application pods and services
   # Configure ingress and load balancing
   ```

3. **Monitoring Setup**
   ```bash
   # Deploy Prometheus and Grafana
   # Configure CloudWatch integration
   # Set up alerting rules
   ```

## 💰 Cost Optimization

### Resource Management
- **Auto-scaling**: Horizontal pod autoscaling based on demand
- **Spot Instances**: Use EC2 spot instances for development environments
- **Storage Tiering**: Lifecycle policies for S3 storage classes
- **Reserved Capacity**: Reserved instances for predictable workloads

### Monitoring & Optimization
- **Cost Tracking**: AWS Cost Explorer integration
- **Resource Utilization**: Regular audits of underutilized resources
- **Scaling Policies**: Automatic scaling down during low-usage periods

## 📊 Monitoring & Analytics

### System Metrics
- **Infrastructure**: CPU, memory, disk, and network utilization
- **Application**: Response times, error rates, and throughput
- **Security**: Failed login attempts, suspicious activities
- **User Engagement**: Lab completion rates, time spent, popular content

### Dashboards
- **Admin Dashboard**: System health and user management
- **Instructor Dashboard**: Course analytics and student progress
- **Student Dashboard**: Personal progress and achievements

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

### Code Standards
- TypeScript for all new code
- ESLint and Prettier for code formatting
- Jest for unit testing
- Comprehensive documentation for new features

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by TryHackMe's interactive learning approach
- Built with modern web technologies and cloud-native principles
- Designed for the academic cybersecurity community

---

**Modulus by mahtabmehek** - Empowering the next generation of cybersecurity professionals through hands-on, interactive learning.

## 📞 Support

For technical support or questions about deployment, please refer to the documentation or contact the development team.

### Quick Start Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linting
npm run type-check   # TypeScript type checking

# Deployment
kubectl apply -f k8s/  # Deploy to Kubernetes
helm install modulus ./helm-chart  # Deploy with Helm
```
