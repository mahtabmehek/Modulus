# Master AWS Monitoring Setup for Modulus LMS
# This script sets up comprehensive monitoring across all methods

param(
    [string]$EmailAddress = "",
    [switch]$SetupAll,
    [switch]$Quick,
    [switch]$Status
)

Write-Host "🚀 Modulus LMS - Master Monitoring Setup" -ForegroundColor Cyan

if ($Status) {
    Write-Host "`n📊 Current Monitoring Status:" -ForegroundColor Yellow
    
    # Check CloudWatch Alarms
    Write-Host "`n1. CloudWatch Alarms:" -ForegroundColor Cyan
    & ".\aws-cloudwatch-alarms.ps1" -ListAlarms
    
    # Check Scheduled Task
    Write-Host "`n2. Windows Scheduled Task:" -ForegroundColor Cyan
    & ".\aws-task-scheduler.ps1" -Status
    
    # Check Recent Logs
    Write-Host "`n3. Recent Log Activity:" -ForegroundColor Cyan
    & ".\aws-monitor-simple.ps1"
    
    return
}

if ($Quick) {
    Write-Host "`n⚡ Quick Monitoring Setup (Local Only)" -ForegroundColor Yellow
    
    # Install Windows scheduled task for continuous monitoring
    Write-Host "`nSetting up local monitoring..." -ForegroundColor Cyan
    & ".\aws-task-scheduler.ps1" -Install
    
    Write-Host "`n✅ Quick setup complete!" -ForegroundColor Green
    Write-Host "`nMonitoring features enabled:" -ForegroundColor Cyan
    Write-Host "• Local log monitoring (runs continuously)" -ForegroundColor White
    Write-Host "• Windows notifications for errors" -ForegroundColor White
    Write-Host "• Alert logging to modulus-alerts.log" -ForegroundColor White
    
    return
}

if ($SetupAll) {
    if (-not $EmailAddress) {
        Write-Host "❌ Email address required for full setup" -ForegroundColor Red
        Write-Host "Usage: .\aws-monitoring-master.ps1 -SetupAll -EmailAddress 'your@email.com'" -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n🎯 Full Monitoring Setup" -ForegroundColor Yellow
    Write-Host "This will set up comprehensive monitoring including:" -ForegroundColor White
    Write-Host "• AWS CloudWatch Alarms with email notifications" -ForegroundColor White
    Write-Host "• Local continuous log monitoring" -ForegroundColor White
    Write-Host "• Windows notifications" -ForegroundColor White
    Write-Host "• Automated alert logging" -ForegroundColor White
    
    Write-Host "`nProceeding with setup..." -ForegroundColor Cyan
    
    # Step 1: Setup CloudWatch Alarms
    Write-Host "`n1️⃣ Setting up CloudWatch Alarms..." -ForegroundColor Yellow
    & ".\aws-cloudwatch-alarms.ps1" -CreateAlarms -EmailAddress $EmailAddress
    
    # Step 2: Setup Local Monitoring
    Write-Host "`n2️⃣ Setting up local monitoring..." -ForegroundColor Yellow
    & ".\aws-task-scheduler.ps1" -Install
    
    # Step 3: Test Everything
    Write-Host "`n3️⃣ Testing setup..." -ForegroundColor Yellow
    & ".\aws-monitoring-master.ps1" -Status
    
    Write-Host "`n🎉 Complete Monitoring Setup Finished!" -ForegroundColor Green
    Write-Host "`n📧 Important: Check your email ($EmailAddress) to confirm SNS subscription" -ForegroundColor Yellow
    Write-Host "`n📋 What's Now Monitoring Your System:" -ForegroundColor Cyan
    Write-Host "• CloudWatch Alarms → Email alerts for critical issues" -ForegroundColor White
    Write-Host "• Local Monitor → Continuous log scanning + Windows notifications" -ForegroundColor White
    Write-Host "• Alert Logging → All issues logged to modulus-alerts.log" -ForegroundColor White
    Write-Host "• Service Health → Regular AWS service status checks" -ForegroundColor White
    
    return
}

# Default help
Write-Host "`n🔧 Available Monitoring Options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Quick Setup (Recommended for development):" -ForegroundColor Cyan
Write-Host "  .\aws-monitoring-master.ps1 -Quick" -ForegroundColor White
Write-Host "  • Sets up local monitoring only" -ForegroundColor Gray
Write-Host "  • No AWS charges, runs on your machine" -ForegroundColor Gray
Write-Host ""
Write-Host "Full Setup (Recommended for production):" -ForegroundColor Cyan
Write-Host "  .\aws-monitoring-master.ps1 -SetupAll -EmailAddress 'your@email.com'" -ForegroundColor White
Write-Host "  • CloudWatch alarms + local monitoring" -ForegroundColor Gray
Write-Host "  • Email notifications for critical issues" -ForegroundColor Gray
Write-Host ""
Write-Host "Check Status:" -ForegroundColor Cyan
Write-Host "  .\aws-monitoring-master.ps1 -Status" -ForegroundColor White
Write-Host "  • Shows current monitoring status" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 I recommend starting with -Quick for immediate monitoring!" -ForegroundColor Yellow
