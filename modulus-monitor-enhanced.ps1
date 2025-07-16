# Enhanced Modulus LMS Log Monitor with Full CLI Output
param(
    [string]$LogGroup = "/aws/lambda/modulus-backend",
    [int]$IntervalSeconds = 30,
    [switch]$ShowAllLogs,
    [switch]$Verbose
)

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "           Modulus LMS - Enhanced Log Monitor" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "Log Group: $LogGroup" -ForegroundColor White
Write-Host "Check Interval: $IntervalSeconds seconds" -ForegroundColor White
Write-Host "Show All Logs: $($ShowAllLogs -or $Verbose)" -ForegroundColor White
Write-Host "Verbose Mode: $Verbose" -ForegroundColor White
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "==============================================================" -ForegroundColor Cyan

# Error patterns to monitor
$errorPatterns = @(
    @{ Pattern = "ERROR"; Color = "Red"; Priority = "HIGH" }
    @{ Pattern = "FATAL"; Color = "Red"; Priority = "CRITICAL" }
    @{ Pattern = "Exception"; Color = "Red"; Priority = "HIGH" }
    @{ Pattern = "500"; Color = "Red"; Priority = "HIGH" }
    @{ Pattern = "timeout"; Color = "Yellow"; Priority = "MEDIUM" }
    @{ Pattern = "connection refused"; Color = "Red"; Priority = "HIGH" }
    @{ Pattern = "authentication failed"; Color = "Red"; Priority = "HIGH" }
    @{ Pattern = "database error"; Color = "Red"; Priority = "CRITICAL" }
    @{ Pattern = "WARN"; Color = "Yellow"; Priority = "LOW" }
    @{ Pattern = "INFO"; Color = "Green"; Priority = "INFO" }
    @{ Pattern = "DEBUG"; Color = "Gray"; Priority = "DEBUG" }
)

$lastCheckTime = (Get-Date).AddMinutes(-5)
$alertFile = "modulus-alerts.log"
$allLogsFile = "modulus-all-logs.log"
$checkCount = 0

# Function to categorize log messages
function Get-LogCategory {
    param($message)
    
    foreach ($errorPattern in $errorPatterns) {
        if ($message -match $errorPattern.Pattern) {
            return $errorPattern
        }
    }
    
    return @{ Pattern = "INFO"; Color = "White"; Priority = "INFO" }
}

# Function to format timestamp
function Format-Timestamp {
    param($timestamp)
    return [datetime]::FromFileTimeUtc($timestamp * 10000 + 116444736000000000).ToString('yyyy-MM-dd HH:mm:ss')
}

Write-Host "`nStarting continuous monitoring..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop monitoring`n" -ForegroundColor Yellow

while ($true) {
    try {
        $checkCount++
        $currentTime = Get-Date
        $checkTimeStr = $currentTime.ToString('HH:mm:ss')
        
        # Calculate time range
        $startTimeMs = [int64](($lastCheckTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
        $endTimeMs = [int64](($currentTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
        
        Write-Host "[$checkTimeStr] Check #$checkCount - Scanning logs..." -ForegroundColor Cyan
        
        if ($Verbose) {
            Write-Host "  Time Range: $($lastCheckTime.ToString('HH:mm:ss')) to $($currentTime.ToString('HH:mm:ss'))" -ForegroundColor Gray
            Write-Host "  Start Time MS: $startTimeMs" -ForegroundColor Gray
            Write-Host "  End Time MS: $endTimeMs" -ForegroundColor Gray
        }
        
        # Fetch logs from AWS
        $awsCommand = "aws logs filter-log-events --log-group-name `"$LogGroup`" --start-time $startTimeMs --end-time $endTimeMs --output json"
        
        if ($Verbose) {
            Write-Host "  AWS Command: $awsCommand" -ForegroundColor Gray
        }
        
        $result = Invoke-Expression "$awsCommand 2>aws-error.log" | ConvertFrom-Json
        
        # Check for AWS CLI errors
        if (Test-Path "aws-error.log") {
            $awsError = Get-Content "aws-error.log" -Raw
            if ($awsError.Trim()) {
                Write-Host "  AWS CLI Error: $awsError" -ForegroundColor Red
            }
            Remove-Item "aws-error.log" -Force -ErrorAction SilentlyContinue
        }
        
        $totalEvents = 0
        $errorCount = 0
        $warnCount = 0
        $infoCount = 0
        
        if ($result -and $result.events) {
            $totalEvents = $result.events.Count
            Write-Host "  Found $totalEvents log events" -ForegroundColor Green
            
            # Process each log event
            foreach ($logEvent in $result.events) {
                $timestamp = Format-Timestamp $logEvent.timestamp
                $category = Get-LogCategory $logEvent.message
                $logLine = "[$timestamp] [$($category.Priority)] $($logEvent.message)"
                
                # Count by category
                switch ($category.Priority) {
                    { $_ -in @("HIGH", "CRITICAL") } { $errorCount++ }
                    { $_ -in @("MEDIUM", "LOW") } { $warnCount++ }
                    "INFO" { $infoCount++ }
                }
                
                # Display in CLI based on settings
                if ($ShowAllLogs -or $Verbose -or $category.Priority -in @("HIGH", "CRITICAL", "MEDIUM")) {
                    Write-Host "    $logLine" -ForegroundColor $category.Color
                }
                
                # Log all events to file
                $logLine | Add-Content -Path $allLogsFile
                
                # Log errors/warnings to alert file
                if ($category.Priority -in @("HIGH", "CRITICAL", "MEDIUM", "LOW")) {
                    $logLine | Add-Content -Path $alertFile
                }
            }
            
            # Summary for this check
            Write-Host "  Summary: $errorCount errors, $warnCount warnings, $infoCount info messages" -ForegroundColor $(
                if ($errorCount -gt 0) { "Red" }
                elseif ($warnCount -gt 0) { "Yellow" }
                else { "Green" }
            )
            
            # Show notification for errors
            if ($errorCount -gt 0) {
                Write-Host "  ⚠️  ALERT: $errorCount error(s) detected!" -ForegroundColor Red
                
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
                    Write-Host "  (Notification failed: $($_.Exception.Message))" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "  No new log events found" -ForegroundColor Gray
        }
        
        # Update last check time
        $lastCheckTime = $currentTime
        
        # Show status line
        Write-Host "[$checkTimeStr] Status: OK | Total Events: $totalEvents | Errors: $errorCount | Warnings: $warnCount" -ForegroundColor $(
            if ($errorCount -gt 0) { "Red" }
            elseif ($warnCount -gt 0) { "Yellow" }
            else { "Green" }
        )
        
        Write-Host ("-" * 80) -ForegroundColor Gray
        
        # Wait for next check
        Start-Sleep -Seconds $IntervalSeconds
        
    } catch {
        Write-Host "[$checkTimeStr] Monitor Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Retrying in 60 seconds..." -ForegroundColor Yellow
        
        if ($Verbose) {
            Write-Host "  Full Error: $($_.Exception)" -ForegroundColor Gray
        }
        
        Start-Sleep 60
    }
}
