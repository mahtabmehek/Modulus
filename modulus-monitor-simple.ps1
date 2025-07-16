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
