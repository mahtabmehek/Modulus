# Continuous Log Monitor for Modulus LMS
# This script runs in the background and monitors logs continuously

param(
    [string]$LogGroup = "/aws/lambda/modulus-backend",
    [int]$IntervalSeconds = 30,
    [string]$AlertEmail = "",
    [switch]$Background
)

Write-Host "Starting Continuous Log Monitor for Modulus LMS" -ForegroundColor Cyan
Write-Host "Log Group: $LogGroup" -ForegroundColor White
Write-Host "Check Interval: $IntervalSeconds seconds" -ForegroundColor White

# Define error patterns to watch for
$errorPatterns = @(
    "ERROR",
    "FATAL",
    "Exception",
    "500",
    "timeout",
    "connection refused",
    "authentication failed",
    "database error"
)

# Function to check for errors in logs
function Get-LogErrors {
    param($logGroup, $lastCheckTime)
    
    $endTime = Get-Date
    $startTimeMs = [int64](($lastCheckTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
    $endTimeMs = [int64](($endTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
    
    try {
        $result = aws logs filter-log-events --log-group-name $logGroup --start-time $startTimeMs --end-time $endTimeMs --output json | ConvertFrom-Json
        
        $errors = @()
        foreach ($logEvent in $result.events) {
            foreach ($pattern in $errorPatterns) {
                if ($logEvent.message -match $pattern) {
                    $timestamp = [datetime]::FromFileTimeUtc($logEvent.timestamp * 10000 + 116444736000000000)
                    $errors += @{
                        Timestamp = $timestamp
                        Message = $logEvent.message
                        Pattern = $pattern
                    }
                    break
                }
            }
        }
        
        return $errors
    } catch {
        Write-Host "Error checking logs: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    }
}

# Function to send alert
function Send-Alert {
    param($errors, $logGroup)
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $alertMsg = "[$timestamp] MODULUS LMS ALERT - $($errors.Count) error(s) detected in $logGroup"
    
    Write-Host $alertMsg -ForegroundColor Red
    Write-Host ("=" * 80) -ForegroundColor Red
    
    foreach ($errorItem in $errors) {
        Write-Host "$($errorItem.Timestamp) | $($errorItem.Pattern) | $($errorItem.Message)" -ForegroundColor Yellow
    }
    
    Write-Host ("=" * 80) -ForegroundColor Red
    
    # Log to file
    $logFile = "modulus-alerts.log"
    $alertMsg | Add-Content -Path $logFile
    foreach ($errorItem in $errors) {
        "$($errorItem.Timestamp) | $($errorItem.Pattern) | $($errorItem.Message)" | Add-Content -Path $logFile
    }
    
    # Send email if configured
    if ($AlertEmail) {
        # You can implement email sending here using Send-MailMessage or other methods
        Write-Host "Would send email alert to: $AlertEmail" -ForegroundColor Cyan
    }
    
    # Windows notification
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $notification = New-Object System.Windows.Forms.NotifyIcon
        $notification.Icon = [System.Drawing.SystemIcons]::Warning
        $notification.BalloonTipTitle = "Modulus LMS Alert"
        $notification.BalloonTipText = "$($errors.Count) error(s) detected in logs"
        $notification.Visible = $true
        $notification.ShowBalloonTip(5000)
    } catch {
        # Notification failed, continue silently
    }
}

# Main monitoring loop
$lastCheckTime = (Get-Date).AddMinutes(-5) # Start checking from 5 minutes ago

Write-Host "`nStarting continuous monitoring..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow

$checkCount = 0
while ($true) {
    $checkCount++
    $currentTime = Get-Date
    
    Write-Host "`n[$($currentTime.ToString('HH:mm:ss'))] Check #$checkCount - Scanning logs..." -ForegroundColor Gray
    
    $errors = Get-LogErrors -logGroup $LogGroup -lastCheckTime $lastCheckTime
    
    if ($errors.Count -gt 0) {
        Send-Alert -errors $errors -logGroup $LogGroup
    } else {
        Write-Host "  ✅ No errors detected" -ForegroundColor Green
    }
    
    $lastCheckTime = $currentTime
    Start-Sleep -Seconds $IntervalSeconds
}

# Note: This script can be run as a background job:
# Start-Job -ScriptBlock { .\aws-log-monitor.ps1 -Background }
