<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Modulus LMS Development Guidelines

## Project Overview
Modulus is a comprehensive Learning Management System (LMS) designed specifically for cybersecurity education. It combines the interactive features of TryHackMe with the course management capabilities of Moodle, creating a unique platform for hands-on cybersecurity learning.

## Architecture
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **State Management**: Zustand with persistence
- **UI Components**: Custom components with TryHackMe-inspired design
- **Theme**: Dark/Light mode support with system preference detection
- **Deployment**: AWS-native with Kubernetes and Docker containers

## Key Features
1. **Multi-role Dashboard System**: Student, Instructor, and Admin views
2. **Desktop-as-a-Service**: Kubernetes-based virtual environments
3. **Gamification**: Badges, streaks, and point systems
4. **Lab Management**: Interactive cybersecurity labs with CTF elements
5. **Course Paths**: Structured learning paths (BSc, MSc programs)
6. **Real-time Monitoring**: System health and security monitoring

## Development Standards
- Use TypeScript for all new code
- Follow Next.js App Router conventions
- Implement responsive design with Tailwind CSS
- Maintain component modularity and reusability
- Include proper error handling and loading states
- Follow accessibility best practices

## Component Structure
```
src/
├── app/                 # Next.js App Router
├── components/
│   ├── dashboards/      # Role-specific dashboards
│   ├── layout/          # Header, footer, navigation
│   ├── views/           # Main content views
│   └── providers/       # Context providers
├── lib/
│   ├── hooks/           # Custom React hooks
│   └── data/            # Mock data and utilities
└── types/               # TypeScript type definitions
```

## AWS Infrastructure
- **Container Orchestration**: Amazon EKS (Kubernetes)
- **Database**: Amazon RDS (PostgreSQL) or DynamoDB
- **Storage**: Amazon S3 for resources and backups
- **Load Balancing**: Application Load Balancer
- **Monitoring**: CloudWatch and Prometheus
- **Security**: VPC with network segmentation, IAM roles

## Security Considerations
- Network segmentation for lab environments
- Container isolation and security policies
- Secure session management for virtual desktops
- Regular security audits and monitoring
- Compliance with educational data protection standards

## Branding
- Use TryHackMe-inspired color scheme (red primary, dark theme support)
- Include "Modulus by mahtabmehek" branding consistently
- Modern, professional design suitable for academic environments

When working on this project, prioritize:
1. Security and isolation of virtual environments
2. Scalability for educational institution deployment
3. User experience for different role types
4. Performance optimization for large user bases
5. Cost-effective AWS resource utilization
