# Setup Windows Task Scheduler for Continuous Monitoring
# This script creates a Windows scheduled task to monitor logs

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Status
)

$taskName = "ModulusLogMonitor"
$scriptPath = Join-Path (Get-Location) "aws-log-monitor.ps1"

if ($Install) {
    Write-Host "Installing Modulus Log Monitor as Windows Scheduled Task" -ForegroundColor Cyan
    
    # Create the scheduled task
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
    
    try {
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Continuous log monitoring for Modulus LMS"
        Write-Host "✅ Task installed successfully" -ForegroundColor Green
        Write-Host "The monitor will start automatically when Windows boots" -ForegroundColor Yellow
        
        # Start the task immediately
        Start-ScheduledTask -TaskName $taskName
        Write-Host "✅ Task started" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install task: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($Uninstall) {
    Write-Host "Uninstalling Modulus Log Monitor" -ForegroundColor Cyan
    try {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "✅ Task uninstalled successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to uninstall task: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($Status) {
    Write-Host "Checking Modulus Log Monitor Status" -ForegroundColor Cyan
    try {
        $task = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
        $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName
        
        Write-Host "Task Status: $($task.State)" -ForegroundColor $(if($task.State -eq "Running") { "Green" } else { "Yellow" })
        Write-Host "Last Run: $($taskInfo.LastRunTime)" -ForegroundColor White
        Write-Host "Next Run: $($taskInfo.NextRunTime)" -ForegroundColor White
        Write-Host "Last Result: $($taskInfo.LastTaskResult)" -ForegroundColor White
    } catch {
        Write-Host "❌ Task not found or error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if (-not $Install -and -not $Uninstall -and -not $Status) {
    Write-Host "Modulus Log Monitor Task Scheduler Setup" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\aws-task-scheduler.ps1 -Install    # Install the monitoring task" -ForegroundColor White
    Write-Host "  .\aws-task-scheduler.ps1 -Status     # Check task status" -ForegroundColor White
    Write-Host "  .\aws-task-scheduler.ps1 -Uninstall  # Remove the monitoring task" -ForegroundColor White
    Write-Host ""
    Write-Host "This will create a Windows scheduled task that:" -ForegroundColor Cyan
    Write-Host "• Starts automatically when Windows boots" -ForegroundColor White
    Write-Host "• Runs continuously in the background" -ForegroundColor White
    Write-Host "• Monitors AWS CloudWatch logs for errors" -ForegroundColor White
    Write-Host "• Shows Windows notifications for alerts" -ForegroundColor White
    Write-Host "• Logs all alerts to modulus-alerts.log" -ForegroundColor White
}
