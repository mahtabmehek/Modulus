# Quick AWS Integration Test for Modulus LMS
# This script tests all AWS integrations

Write-Host "🧪 Testing AWS Integration for Modulus LMS" -ForegroundColor Cyan

Write-Host "`n1️⃣ Testing AWS CLI Setup..." -ForegroundColor Yellow
& ".\aws-setup.ps1"

Write-Host "`n2️⃣ Testing Service Monitor..." -ForegroundColor Yellow
& ".\aws-monitor.ps1" -All

Write-Host "`n3️⃣ Testing Log Viewer..." -ForegroundColor Yellow
& ".\aws-log-viewer.ps1" -ListGroups

Write-Host "`n✅ AWS Integration Test Complete!" -ForegroundColor Green
Write-Host "`n📋 Available Tools:" -ForegroundColor Cyan
Write-Host "   🔧 aws-setup.ps1       - Initial AWS setup and verification" -ForegroundColor White
Write-Host "   📊 aws-log-viewer.ps1   - View and monitor CloudWatch logs" -ForegroundColor White
Write-Host "   🔍 aws-monitor.ps1      - Monitor AWS service health" -ForegroundColor White
Write-Host "   🚀 aws-cognito-setup.ps1 - Set up Cognito for user migration" -ForegroundColor White

Write-Host "`n🎯 Next Steps for Deep Integration:" -ForegroundColor Cyan
Write-Host "   1. Run aws-setup.ps1 to verify AWS CLI configuration" -ForegroundColor White
Write-Host "   2. Use aws-log-viewer.ps1 to monitor your application logs" -ForegroundColor White
Write-Host "   3. Run aws-monitor.ps1 regularly to check service health" -ForegroundColor White
Write-Host "   4. When ready, use aws-cognito-setup.ps1 to migrate to Cognito" -ForegroundColor White
