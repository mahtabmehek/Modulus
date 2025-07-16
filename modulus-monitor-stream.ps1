# Modulus LMS Log Monitor - Stream Version
# Uses AWS CLI streaming approach to avoid JSON truncation

param(
    [string]$LogGroup = "/aws/lambda/modulus-backend",
    [int]$IntervalSeconds = 30
)

Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MODULUS LMS - STREAM LOG MONITOR" -ForegroundColor Cyan
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
        
        # Use text output instead of JSON to avoid parsing issues
        $logCommand = "aws logs filter-log-events --log-group-name `"$LogGroup`" --start-time $startTimeMs --end-time $endTimeMs --output text"
        $logLines = Invoke-Expression $logCommand 2>$null
        
        if ($logLines -and $logLines.Length -gt 0) {
            $lines = $logLines -split "`n" | Where-Object { $_.Trim() -ne "" }
            Write-Host "[$timeDisplay] Found $($lines.Count) log lines" -ForegroundColor White
            
            $currentErrors = 0
            $currentWarnings = 0
            
            foreach ($line in $lines) {
                if ($line.Trim() -eq "") { continue }
                
                # Parse AWS CLI text output format
                $parts = $line -split "`t"
                if ($parts.Length -ge 4) {
                    try {
                        $timestamp = [int64]$parts[1]
                        $eventTime = [datetime]::FromFileTimeUtc($timestamp * 10000 + 116444736000000000)
                        $eventTimeStr = $eventTime.ToString('HH:mm:ss.fff')
                    } catch {
                        # If timestamp conversion fails, use current time
                        $eventTimeStr = (Get-Date).ToString('HH:mm:ss.fff')
                    }
                    
                    $message = $parts[3].Trim()
                    
                    # Shorten long messages
                    if ($message.Length -gt 100) {
                        $message = $message.Substring(0, 100) + "..."
                    }
                    
                    # Categorize and color-code
                    if ($message -match "ERROR|FATAL|Exception|Failed|500|timeout") {
                        Write-Host "  [$eventTimeStr] ERROR: $message" -ForegroundColor Red
                        $currentErrors++
                        $script:totalErrors++
                    } elseif ($message -match "WARN|WARNING|deprecated|slow") {
                        Write-Host "  [$eventTimeStr] WARN:  $message" -ForegroundColor Yellow
                        $currentWarnings++
                        $script:totalWarnings++
                    } elseif ($message -match "START RequestId") {
                        # Extract Request ID
                        if ($message -match "RequestId: ([a-f0-9-]+)") {
                            $requestId = $matches[1].Substring(0, 8)
                            Write-Host "  [$eventTimeStr] START: Request $requestId" -ForegroundColor Cyan
                        } else {
                            Write-Host "  [$eventTimeStr] START: $message" -ForegroundColor Cyan
                        }
                    } elseif ($message -match "END RequestId") {
                        if ($message -match "RequestId: ([a-f0-9-]+)") {
                            $requestId = $matches[1].Substring(0, 8)
                            Write-Host "  [$eventTimeStr] END:   Request $requestId" -ForegroundColor Cyan
                        } else {
                            Write-Host "  [$eventTimeStr] END:   $message" -ForegroundColor Cyan
                        }
                    } elseif ($message -match "REPORT RequestId") {
                        # Extract performance metrics
                        $duration = "N/A"
                        $memory = "N/A"
                        if ($message -match "Duration: ([0-9.]+) ms") {
                            $duration = $matches[1] + "ms"
                        }
                        if ($message -match "Max Memory Used: ([0-9]+) MB") {
                            $memory = $matches[1] + "MB"
                        }
                        Write-Host "  [$eventTimeStr] PERF:  $duration, Memory: $memory" -ForegroundColor Green
                    } elseif ($message -match "INFO") {
                        Write-Host "  [$eventTimeStr] INFO:  $message" -ForegroundColor White
                    } else {
                        Write-Host "  [$eventTimeStr] LOG:   $message" -ForegroundColor Gray
                    }
                    
                    $script:totalLogs++
                } else {
                    Write-Host "  [??:??:??] RAW:   $line" -ForegroundColor DarkGray
                }
            }
            
            # Summary
            if ($currentErrors -gt 0 -or $currentWarnings -gt 0) {
                $summaryColor = if ($currentErrors -gt 0) { "Red" } else { "Yellow" }
                Write-Host "[$timeDisplay] This check: $currentErrors errors, $currentWarnings warnings" -ForegroundColor $summaryColor
            } else {
                Write-Host "[$timeDisplay] This check: All systems normal" -ForegroundColor Green
            }
            
        } else {
            Write-Host "[$timeDisplay] No new log entries" -ForegroundColor Gray
        }
        
        # Running totals
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
