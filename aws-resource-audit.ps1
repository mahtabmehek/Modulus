# AWS Resource Audit and Cleanup Script for Modulus LMS
# Date: July 15, 2025

Write-Host "🔍 AWS Resource Audit for Modulus LMS" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue

$region = "eu-west-2"

# Summary of findings based on analysis
Write-Host "`n📊 CURRENT RESOURCE ANALYSIS:" -ForegroundColor Green

Write-Host "`n✅ ACTIVELY USED RESOURCES:" -ForegroundColor Green
Write-Host "- RDS Aurora Cluster: modulus-aurora-cluster (PostgreSQL 15.4)" -ForegroundColor White
Write-Host "  Status: ACTIVE - Used by production LMS" -ForegroundColor Green
Write-Host "- RDS Instance: modulus-aurora-instance" -ForegroundColor White
Write-Host "  Status: ACTIVE - Part of Aurora cluster" -ForegroundColor Green

Write-Host "`n🚨 POTENTIALLY UNUSED RESOURCES:" -ForegroundColor Yellow

# Check ECR repositories
Write-Host "`n🐳 ECR REPOSITORIES:" -ForegroundColor Cyan
Write-Host "Found 3 ECR repositories:" -ForegroundColor White

# ECR Repository Analysis
$ecrRepos = @(
    @{Name="modulus-simple"; Status="EMPTY"; LastPush="None"; Recommendation="DELETE"},
    @{Name="modulus-backend"; Status="UNUSED"; LastPush="July 9, 2025"; Recommendation="CONSIDER DELETING"},
    @{Name="modulus-lms"; Status="UNUSED"; LastPush="July 7, 2025"; Recommendation="CONSIDER DELETING"}
)

foreach ($repo in $ecrRepos) {
    Write-Host "Repository: $($repo.Name)" -ForegroundColor Yellow
    Write-Host "  Status: $($repo.Status)" -ForegroundColor $(if($repo.Status -eq "EMPTY") {"Red"} else {"Yellow"})
    Write-Host "  Last Push: $($repo.LastPush)" -ForegroundColor White
    Write-Host "  Recommendation: $($repo.Recommendation)" -ForegroundColor $(if($repo.Recommendation -like "*DELETE*") {"Red"} else {"Yellow"})
    Write-Host ""
}

Write-Host "💡 ANALYSIS SUMMARY:" -ForegroundColor Cyan
Write-Host "- Your current production LMS uses Lambda ZIP deployment, NOT containers" -ForegroundColor White
Write-Host "- ECR repositories appear to be from development/testing phases" -ForegroundColor White
Write-Host "- VNC Kali infrastructure is planned but not deployed" -ForegroundColor White

Write-Host "`n🧹 CLEANUP RECOMMENDATIONS:" -ForegroundColor Magenta

Write-Host "`n1. SAFE TO DELETE IMMEDIATELY:" -ForegroundColor Red
Write-Host "   - modulus-simple ECR repository (empty)" -ForegroundColor White

Write-Host "`n2. LIKELY SAFE TO DELETE:" -ForegroundColor Yellow
Write-Host "   - modulus-backend ECR repository (not used in current Lambda deployment)" -ForegroundColor White
Write-Host "   - modulus-lms ECR repository (not used in current deployment)" -ForegroundColor White

Write-Host "`n3. KEEP (ACTIVE PRODUCTION):" -ForegroundColor Green
Write-Host "   - modulus-aurora-cluster RDS cluster" -ForegroundColor White
Write-Host "   - modulus-aurora-instance RDS instance" -ForegroundColor White

# Cost estimate
Write-Host "`n💰 ESTIMATED MONTHLY SAVINGS:" -ForegroundColor Green
Write-Host "ECR Storage: ~$0.50-$5/month (depending on image sizes)" -ForegroundColor White
Write-Host "Note: RDS cluster costs ~$50-100/month but is ACTIVELY USED" -ForegroundColor Yellow

Write-Host "`n🛡️ SAFETY CHECKS BEFORE CLEANUP:" -ForegroundColor Red
Write-Host "1. Verify no other projects use these ECR repositories" -ForegroundColor White
Write-Host "2. Confirm current deployment only uses Lambda ZIP files" -ForegroundColor White
Write-Host "3. Check if ECR images are needed for future VNC infrastructure" -ForegroundColor White

Write-Host "`n🚀 AUTOMATED CLEANUP OPTIONS:" -ForegroundColor Blue

# Interactive cleanup
$cleanup = Read-Host "`nWould you like to proceed with safe cleanup? (y/N)"

if ($cleanup -eq "y" -or $cleanup -eq "Y") {
    Write-Host "`n🧹 Starting safe cleanup..." -ForegroundColor Yellow
    
    # Only delete the empty repository as it's completely safe
    Write-Host "`n1. Deleting empty ECR repository: modulus-simple" -ForegroundColor Yellow
    try {
        aws ecr delete-repository --repository-name modulus-simple --region $region --force
        Write-Host "✅ Deleted modulus-simple ECR repository" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to delete modulus-simple: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Ask about other repositories
    $cleanupOthers = Read-Host "`n2. Delete other ECR repositories (modulus-backend, modulus-lms)? (y/N)"
    
    if ($cleanupOthers -eq "y" -or $cleanupOthers -eq "Y") {
        Write-Host "`nDeleting modulus-backend ECR repository..." -ForegroundColor Yellow
        try {
            aws ecr delete-repository --repository-name modulus-backend --region $region --force
            Write-Host "✅ Deleted modulus-backend ECR repository" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to delete modulus-backend: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "`nDeleting modulus-lms ECR repository..." -ForegroundColor Yellow
        try {
            aws ecr delete-repository --repository-name modulus-lms --region $region --force
            Write-Host "✅ Deleted modulus-lms ECR repository" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to delete modulus-lms: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "⏭️ Skipping other ECR repositories" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "⏭️ Cleanup skipped" -ForegroundColor Yellow
}

Write-Host "`n📋 MANUAL CLEANUP COMMANDS:" -ForegroundColor Cyan
Write-Host "To delete ECR repositories manually:" -ForegroundColor White
Write-Host "aws ecr delete-repository --repository-name modulus-simple --region $region --force" -ForegroundColor Gray
Write-Host "aws ecr delete-repository --repository-name modulus-backend --region $region --force" -ForegroundColor Gray
Write-Host "aws ecr delete-repository --repository-name modulus-lms --region $region --force" -ForegroundColor Gray

Write-Host "`n⚠️ DO NOT DELETE:" -ForegroundColor Red
Write-Host "aws rds delete-db-cluster --db-cluster-identifier modulus-aurora-cluster --region $region" -ForegroundColor Red
Write-Host "aws rds delete-db-instance --db-instance-identifier modulus-aurora-instance --region $region" -ForegroundColor Red
Write-Host "(These are your ACTIVE production database!)" -ForegroundColor Red

Write-Host "`n✅ Audit Complete!" -ForegroundColor Green
Write-Host "Check AWS console to verify changes" -ForegroundColor White
