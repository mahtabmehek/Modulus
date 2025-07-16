# Modulus LMS Log Monitor - Robust Version
# Handles large log volumes with pagination and better parsing

param(
    [string]$LogGroup = "/aws/lambda/modulus-backend",
    [int]$IntervalSeconds = 30
)

Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MODULUS LMS - ROBUST LOG MONITOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: $LogGroup" -ForegroundColor White
Write-Host "Interval: $IntervalSeconds seconds" -ForegroundColor White
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

$script:lastCheck = (Get-Date).AddMinutes(-2)
$script:checkNumber = 0
$script:totalErrors = 0
$script:totalWarnings = 0
$script:totalLogs = 0

# Test AWS connection
Write-Host "`n[INIT] Testing AWS CLI connection..." -ForegroundColor Yellow
try {
    $awsTest = aws sts get-caller-identity --output json 2>&1
    if ($awsTest -like "*error*") {
        Write-Host "[INIT] AWS CLI Error: $awsTest" -ForegroundColor Red
    } else {
        $identity = $awsTest | ConvertFrom-Json
        Write-Host "[INIT] AWS Connected as: $($identity.Arn)" -ForegroundColor Green
    }
} catch {
    Write-Host "[INIT] AWS CLI test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[READY] Monitor starting... Press Ctrl+C to stop" -ForegroundColor Green
Write-Host ""

while ($true) {
    $script:checkNumber++
    $currentTime = Get-Date
    $timeDisplay = $currentTime.ToString('HH:mm:ss')
    
    Write-Host "[$timeDisplay] === CHECK #$script:checkNumber ===" -ForegroundColor Cyan
    
    try {
        $startTimeMs = [int64](($script:lastCheck.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
        $endTimeMs = [int64](($currentTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
        
        Write-Host "[$timeDisplay] Querying logs from $($script:lastCheck.ToString('HH:mm:ss'))..." -ForegroundColor Gray
        
        # Use smaller page size and process incrementally
        $tempFile = [System.IO.Path]::GetTempFileName()
        $logCommand = "aws logs filter-log-events --log-group-name `"$LogGroup`" --start-time $startTimeMs --end-time $endTimeMs --max-items 20 --output json > `"$tempFile`""
        
        Invoke-Expression $logCommand 2>$null
        
        if (Test-Path $tempFile) {
            $fileSize = (Get-Item $tempFile).Length
            if ($fileSize -eq 0) {
                Write-Host "[$timeDisplay] No new log entries" -ForegroundColor Gray
                Remove-Item $tempFile -Force
            } else {
                Write-Host "[$timeDisplay] Processing $fileSize bytes of log data..." -ForegroundColor White
                
                try {
                    $logContent = Get-Content $tempFile -Raw
                    $logResult = $logContent | ConvertFrom-Json
                    Remove-Item $tempFile -Force
                    
                    if ($logResult -and $logResult.events) {
                        Write-Host "[$timeDisplay] Found $($logResult.events.Count) new log entries" -ForegroundColor White
                        
                        $currentErrors = 0
                        $currentWarnings = 0
                        
                        foreach ($logEvent in $logResult.events) {
                            $eventTime = [datetime]::FromFileTimeUtc($logEvent.timestamp * 10000 + 116444736000000000)
                            $eventTimeStr = $eventTime.ToString('HH:mm:ss.fff')
                            $message = $logEvent.message.Trim()
                            
                            # Shorten very long messages
                            if ($message.Length -gt 120) {
                                $message = $message.Substring(0, 120) + "..."
                            }
                            
                            if ($message -match "ERROR|FATAL|Exception|Failed|500|timeout") {
                                Write-Host "  [$eventTimeStr] ERROR: $message" -ForegroundColor Red
                                $currentErrors++
                                $script:totalErrors++
                            } elseif ($message -match "WARN|WARNING|deprecated|slow") {
                                Write-Host "  [$eventTimeStr] WARN:  $message" -ForegroundColor Yellow
                                $currentWarnings++
                                $script:totalWarnings++
                            } elseif ($message -match "START RequestId|END RequestId") {
                                Write-Host "  [$eventTimeStr] REQ:   $message" -ForegroundColor Cyan
                            } elseif ($message -match "REPORT RequestId") {
                                # Extract duration from REPORT
                                if ($message -match "Duration: ([0-9.]+) ms") {
                                    $duration = $matches[1]
                                    Write-Host "  [$eventTimeStr] PERF:  Duration: ${duration}ms" -ForegroundColor Green
                                } else {
                                    Write-Host "  [$eventTimeStr] PERF:  $message" -ForegroundColor Green
                                }
                            } elseif ($message -match "INFO") {
                                Write-Host "  [$eventTimeStr] INFO:  $message" -ForegroundColor White
                            } else {
                                Write-Host "  [$eventTimeStr] LOG:   $message" -ForegroundColor Gray
                            }
                            
                            $script:totalLogs++
                        }
                        
                        # Summary
                        if ($currentErrors -gt 0 -or $currentWarnings -gt 0) {
                            $summaryColor = if ($currentErrors -gt 0) { "Red" } else { "Yellow" }
                            Write-Host "[$timeDisplay] This check: $currentErrors errors, $currentWarnings warnings" -ForegroundColor $summaryColor
                        } else {
                            Write-Host "[$timeDisplay] This check: All systems normal" -ForegroundColor Green
                        }
                        
                    } else {
                        Write-Host "[$timeDisplay] No events in response" -ForegroundColor Gray
                    }
                    
                } catch {
                    Write-Host "[$timeDisplay] Parse Error: $($_.Exception.Message)" -ForegroundColor Red
                    Write-Host "[$timeDisplay] File size was: $fileSize bytes" -ForegroundColor Yellow
                    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
                }
            }
        } else {
            Write-Host "[$timeDisplay] AWS CLI command failed" -ForegroundColor Red
        }
        
        # Running totals every 5 checks
        if ($script:checkNumber % 5 -eq 0) {
            Write-Host "[$timeDisplay] TOTALS: $script:totalLogs logs, $script:totalErrors errors, $script:totalWarnings warnings" -ForegroundColor Cyan
        }
        
    } catch {
        Write-Host "[$timeDisplay] Monitor error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    $script:lastCheck = $currentTime
    
    Write-Host "[$timeDisplay] Next check in $IntervalSeconds seconds..." -ForegroundColor Gray
    Start-Sleep $IntervalSeconds
    Write-Host ""
}
