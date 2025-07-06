# Deployment Trigger

This file is used to trigger GitHub Actions deployment.

Last deployment: July 6, 2025 - UK Region (eu-west-2)
Status: Fixed VPC limit error, using default VPC, UK region
Target: AWS Free Tier deployment (eu-west-2 London)

Changes in this deployment:
- Changed region from us-east-1 to eu-west-2 (UK/London)
- Fixed VPC limit exceeded error
- Use default VPC instead of creating new one
- Simplified deployment script
- Fixed duplicate useState declarations
- Disabled invite-only feature  
- Set default admin user for immediate access
- All TypeScript errors resolved

Benefits of EU-West-2 (London):
- Lower latency for UK users
- GDPR compliance
- Same free tier benefits
- Better performance for European users
