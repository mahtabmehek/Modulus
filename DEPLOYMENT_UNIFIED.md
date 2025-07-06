# 🚀 Modulus LMS - Deployment Management

## Unified Deployment Scripts

This project now uses **optimized, unified deployment scripts** to eliminate redundancy and improve maintainability.

## 📁 Core Scripts

### 1. `deploy.sh` - Main Deployment Script
**Primary deployment script with smart features:**
- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Zero-downtime**: Updates existing services without downtime
- ✅ **Cost-optimized**: Reuses existing infrastructure
- ✅ **EU-optimized**: Configured for `eu-west-2` (London)

```bash
# Make executable and run
chmod +x ./deploy.sh
./deploy.sh
```

### 2. `aws-manager.ps1` - Unified Management Script
**PowerShell script for all AWS management tasks:**

```powershell
# Scan for running resources
.\aws-manager.ps1 scan

# Cleanup Modulus resources
.\aws-manager.ps1 cleanup

# Verify deployment health
.\aws-manager.ps1 verify

# Monitor costs and usage
.\aws-manager.ps1 monitor

# Emergency cleanup (all regions)
.\aws-manager.ps1 emergency-cleanup

# Options:
.\aws-manager.ps1 scan -AllRegions        # Check all AWS regions
.\aws-manager.ps1 cleanup -DryRun         # Preview what would be deleted
.\aws-manager.ps1 cleanup -Region eu-west-1  # Specific region
```

### 3. GitHub Actions Workflow
**Automated deployment via `.github/workflows/deploy.yml`:**
- Triggered on push to main/master
- Uses the unified `deploy.sh` script
- Includes build testing and deployment verification

## 🗑️ Removed Scripts (Consolidated)

The following redundant scripts have been **consolidated into the unified solution**:

### Cleanup Scripts (Replaced by `aws-manager.ps1 cleanup`)
- ❌ `cleanup-all-aws.ps1`
- ❌ `cleanup-modulus-only.ps1`  
- ❌ `quick-cleanup.ps1`
- ❌ `emergency-cleanup-all-regions.ps1`

### Scanning Scripts (Replaced by `aws-manager.ps1 scan`)
- ❌ `scan-all-aws-resources.ps1`
- ❌ `simple-scan.ps1`
- ❌ `check-running-services.ps1`
- ❌ `final-verification.ps1`

### Deployment Scripts (Replaced by unified `deploy.sh`)
- ❌ `cleanup-all-aws.sh`
- ❌ Multiple duplicate deployment variants

## 🎯 Quick Commands

### Deploy Application
```bash
# Local deployment
./deploy.sh

# Or trigger GitHub Actions
git add .
git commit -m "Deploy update"
git push origin main
```

### Check AWS Resources
```powershell
# Quick scan
.\aws-manager.ps1 scan

# Full scan (all regions)
.\aws-manager.ps1 scan -AllRegions
```

### Clean Up Resources
```powershell
# Preview cleanup
.\aws-manager.ps1 cleanup -DryRun

# Clean up Modulus resources
.\aws-manager.ps1 cleanup

# Emergency cleanup (ALL regions)
.\aws-manager.ps1 emergency-cleanup
```

### Verify Deployment
```powershell
# Check if deployment is healthy
.\aws-manager.ps1 verify
```

## 🏗️ Architecture

The unified scripts manage this AWS architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │    │  Load Balancer   │    │   ECS Cluster   │
│   Load Balancer │ -> │  (ALB)          │ -> │   (Fargate)     │
│   (Public)      │    │  Health Checks   │    │   Auto-scaling  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         v                        v                       v
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ECR Registry  │    │   CloudWatch     │    │   Security      │
│   Docker Images │    │   Logs & Metrics │    │   Groups & IAM  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 💡 Benefits of Unified Scripts

1. **Reduced Complexity**: One script per function instead of multiple variants
2. **Better Maintainability**: Single source of truth for each operation
3. **Improved Reliability**: Tested, idempotent operations
4. **Cost Optimization**: Smart resource reuse and cleanup
5. **Better Documentation**: Clear usage patterns and examples

## 🔧 Configuration

All scripts use these optimized defaults:
- **Region**: `eu-west-2` (London) - EU-optimized
- **Instance Type**: `t3.micro` (Free Tier eligible)
- **Capacity**: Auto-scaling 1-2 instances
- **Network**: Default VPC with public subnets
- **Security**: Minimal required permissions

## 📊 Monitoring

Use `aws-manager.ps1 monitor` to:
- Check current AWS costs
- View resource utilization
- Monitor deployment health
- Get cost optimization recommendations

---

## 🚀 Quick Start

1. **Deploy**: `./deploy.sh`
2. **Verify**: `.\aws-manager.ps1 verify`
3. **Monitor**: `.\aws-manager.ps1 monitor`
4. **Cleanup**: `.\aws-manager.ps1 cleanup` (when done)

The unified scripts ensure your Modulus LMS deployment is **cost-effective**, **maintainable**, and **production-ready**!
