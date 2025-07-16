# Modulus LMS Log Monitor - Fixed CLI Version
# Complete real-time monitoring with full CLI visibility

param(
    [string]$LogGroup = "/aws/lambda/modulus-backend",
    [int]$IntervalSeconds = 30
)

# Terminal header
Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MODULUS LMS - LIVE LOG MONITOR" -ForegroundColor Cyan
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

# AWS connection test
Write-Host "`n[INIT] Testing AWS CLI connection..." -ForegroundColor Yellow
try {
    $awsTest = aws sts get-caller-identity --output json 2>&1
    if ($awsTest -like "*error*" -or $awsTest -like "*Unable*") {
        Write-Host "[INIT] AWS CLI Error: $awsTest" -ForegroundColor Red
        Write-Host "[INIT] Continuing with limited functionality..." -ForegroundColor Yellow
    } else {
        $identity = $awsTest | ConvertFrom-Json
        Write-Host "[INIT] AWS Connected as: $($identity.Arn)" -ForegroundColor Green
    }
} catch {
    Write-Host "[INIT] AWS CLI test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[READY] Monitor starting... Press Ctrl+C to stop" -ForegroundColor Green
Write-Host ""

# Main monitoring loop
while ($true) {
    $script:checkNumber++
    $currentTime = Get-Date
    $timeDisplay = $currentTime.ToString('HH:mm:ss')
    
    # Show check header
    Write-Host "[$timeDisplay] === CHECK #$script:checkNumber ===" -ForegroundColor Cyan
    
    try {
        # Calculate time range in milliseconds (AWS format)
        $startTimeMs = [int64](($script:lastCheck.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
        $endTimeMs = [int64](($currentTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
        
        Write-Host "[$timeDisplay] Querying logs from $($script:lastCheck.ToString('HH:mm:ss'))..." -ForegroundColor Gray
        
        # Query CloudWatch logs with better error handling and size limit
        $logCommand = "aws logs filter-log-events --log-group-name `"$LogGroup`" --start-time $startTimeMs --end-time $endTimeMs --max-items 50 --output json"
        $logOutput = Invoke-Expression $logCommand 2>$null
        
        # Check if output is valid before parsing
        if ([string]::IsNullOrEmpty($logOutput)) {
            Write-Host "[$timeDisplay] No output from AWS CLI" -ForegroundColor Gray
            $logResult = $null
        } else {
            try {
                $logResult = $logOutput | ConvertFrom-Json
            } catch {
                Write-Host "[$timeDisplay] JSON Parse Error: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "[$timeDisplay] Raw output length: $($logOutput.Length) chars" -ForegroundColor Yellow
                if ($logOutput.Length -gt 1000) {
                    Write-Host "[$timeDisplay] Output truncated - using partial data" -ForegroundColor Yellow
                    # Try to fix truncated JSON by adding closing braces
                    $fixedOutput = $logOutput.TrimEnd() + ']}}'
                    try {
                        $logResult = $fixedOutput | ConvertFrom-Json
                        Write-Host "[$timeDisplay] Recovered from truncated JSON" -ForegroundColor Green
                    } catch {
                        $logResult = $null
                        Write-Host "[$timeDisplay] Could not recover JSON - skipping this check" -ForegroundColor Red
                    }
                } else {
                    $logResult = $null
                }
            }
        }
        
        if ($logResult -and $logResult.events -and $logResult.events.Count -gt 0) {
            Write-Host "[$timeDisplay] Found $($logResult.events.Count) new log entries" -ForegroundColor White
            
            $currentErrors = 0
            $currentWarnings = 0
            
            # Process each log event
            foreach ($event in $logResult.events) {
                $eventTime = [datetime]::FromFileTimeUtc($event.timestamp * 10000 + 116444736000000000)
                $eventTimeStr = $eventTime.ToString('HH:mm:ss.fff')
                $message = $event.message.Trim()
                
                # Color-code based on log level
                if ($message -match "ERROR|FATAL|Exception|Failed|500|timeout|denied") {
                    Write-Host "  [$eventTimeStr] ERROR: $message" -ForegroundColor Red
                    $currentErrors++
                    $script:totalErrors++
                } elseif ($message -match "WARN|WARNING|deprecated|slow|retry") {
                    Write-Host "  [$eventTimeStr] WARN:  $message" -ForegroundColor Yellow
                    $currentWarnings++
                    $script:totalWarnings++
                } elseif ($message -match "START|END|REQUEST|INIT") {
                    Write-Host "  [$eventTimeStr] INFO:  $message" -ForegroundColor Green
                } else {
                    Write-Host "  [$eventTimeStr] LOG:   $message" -ForegroundColor White
                }
                
                $script:totalLogs++
            }
            
            # Show summary for this check
            if ($currentErrors -gt 0 -or $currentWarnings -gt 0) {
                $summaryColor = if ($currentErrors -gt 0) { "Red" } else { "Yellow" }
                Write-Host "[$timeDisplay] This check: $currentErrors errors, $currentWarnings warnings" -ForegroundColor $summaryColor
            } else {
                Write-Host "[$timeDisplay] This check: All clear" -ForegroundColor Green
            }
            
        } else {
            Write-Host "[$timeDisplay] No new log entries" -ForegroundColor Gray
        }
        
        # Show running totals every 5 checks
        if ($script:checkNumber % 5 -eq 0) {
            Write-Host "[$timeDisplay] TOTALS: $script:totalLogs logs, $script:totalErrors errors, $script:totalWarnings warnings" -ForegroundColor Cyan
        }
        
    } catch {
        Write-Host "[$timeDisplay] Monitor error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "[$timeDisplay] Will retry on next cycle..." -ForegroundColor Yellow
    }
    
    # Update last check time
    $script:lastCheck = $currentTime
    
    # Wait with countdown
    Write-Host "[$timeDisplay] Waiting $IntervalSeconds seconds..." -ForegroundColor Gray
    
    for ($i = 1; $i -le $IntervalSeconds; $i++) {
        Start-Sleep 1
        if ($i % 10 -eq 0) {
            $remaining = $IntervalSeconds - $i
            Write-Host "  $remaining seconds remaining..." -ForegroundColor DarkGray
        }
    }
    
    Write-Host ""
}
