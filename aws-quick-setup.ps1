# Quick AWS Monitoring Setup for Modulus LMS
Write-Host "Setting up Quick Monitoring for Modulus LMS..." -ForegroundColor Cyan

# Step 1: Create the monitoring script
Write-Host "`nStep 1: Creating monitoring script..." -ForegroundColor Yellow

$monitorScript = @'
# Simple Log Monitor for Modulus LMS
$logGroup = "/aws/lambda/modulus-backend"
$lastCheck = (Get-Date).AddMinutes(-5)
$alertFile = "modulus-alerts.log"

Write-Host "Starting Modulus LMS Log Monitor..." -ForegroundColor Green
Write-Host "Monitoring: $logGroup" -ForegroundColor White
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

while ($true) {
    try {
        $endTime = Get-Date
        $startTimeMs = [int64](($lastCheck.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
        $endTimeMs = [int64](($endTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
        
        $result = aws logs filter-log-events --log-group-name $logGroup --start-time $startTimeMs --end-time $endTimeMs --output json 2>$null | ConvertFrom-Json
        
        $errorCount = 0
        if ($result.events) {
            foreach ($logEvent in $result.events) {
                if ($logEvent.message -match "ERROR|FATAL|Exception|500|timeout") {
                    $errorCount++
                    $timestamp = [datetime]::FromFileTimeUtc($logEvent.timestamp * 10000 + 116444736000000000)
                    $alertMsg = "[$timestamp] ERROR: $($logEvent.message)"
                    Write-Host $alertMsg -ForegroundColor Red
                    $alertMsg | Add-Content -Path $alertFile
                }
            }
        }
        
        if ($errorCount -eq 0) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] System OK - No errors detected" -ForegroundColor Green
        } else {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ALERT: $errorCount error(s) detected!" -ForegroundColor Red
            
            # Try to show Windows notification
            try {
                Add-Type -AssemblyName System.Windows.Forms
                $notification = New-Object System.Windows.Forms.NotifyIcon
                $notification.Icon = [System.Drawing.SystemIcons]::Warning
                $notification.BalloonTipTitle = "Modulus LMS Alert"
                $notification.BalloonTipText = "$errorCount error(s) detected in logs"
                $notification.Visible = $true
                $notification.ShowBalloonTip(5000)
                Start-Sleep 1
                $notification.Dispose()
            } catch {
                # Notification failed, continue
            }
        }
        
        $lastCheck = $endTime
        Start-Sleep 30
    } catch {
        Write-Host "Monitor error: $($_.Exception.Message)" -ForegroundColor Yellow
        Start-Sleep 60
    }
}
'@

$monitorScript | Out-File -FilePath "modulus-monitor-simple.ps1" -Encoding UTF8
Write-Host "  Created: modulus-monitor-simple.ps1" -ForegroundColor Green

# Step 2: Create Windows Task
Write-Host "`nStep 2: Setting up Windows Scheduled Task..." -ForegroundColor Yellow

$taskName = "ModulusLogMonitor"
$scriptPath = Join-Path (Get-Location) "modulus-monitor-simple.ps1"

try {
    # Remove existing task if it exists
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    
    # Create new task
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Minimized -ExecutionPolicy Bypass -File `"$scriptPath`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Modulus LMS Log Monitor"
    Write-Host "  Task created successfully" -ForegroundColor Green
    
    # Start the task
    Start-ScheduledTask -TaskName $taskName
    Write-Host "  Task started" -ForegroundColor Green
    
} catch {
    Write-Host "  Failed to create scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  You can run the monitor manually with: .\modulus-monitor-simple.ps1" -ForegroundColor Yellow
}

# Step 3: Test the setup
Write-Host "`nStep 3: Testing the setup..." -ForegroundColor Yellow
Start-Sleep 2

try {
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
    Write-Host "  Task Status: $($task.State)" -ForegroundColor Green
} catch {
    Write-Host "  Task check failed, but monitor script is available" -ForegroundColor Yellow
}

Write-Host "`nQuick Setup Complete!" -ForegroundColor Green
Write-Host "`nWhat's now monitoring your system:" -ForegroundColor Cyan
Write-Host "  Monitor Script: modulus-monitor-simple.ps1" -ForegroundColor White
Write-Host "  Alert Log: modulus-alerts.log" -ForegroundColor White
Write-Host "  Check Interval: Every 30 seconds" -ForegroundColor White
Write-Host "  Startup: Automatic with Windows" -ForegroundColor White

Write-Host "`nManual Commands:" -ForegroundColor Yellow
Write-Host "  Start Monitor: .\modulus-monitor-simple.ps1" -ForegroundColor White
Write-Host "  Check Alerts: Get-Content modulus-alerts.log" -ForegroundColor White
Write-Host "  Task Status: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
