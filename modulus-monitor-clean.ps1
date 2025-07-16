# Modulus LMS Log Monitor - Clean Version
# Simple, effective log monitoring without complex parsing

param(
    [string]$LogGroup = "/aws/lambda/modulus-backend",
    [int]$IntervalSeconds = 20
)

Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MODULUS LMS - LIVE LOG MONITOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: $LogGroup" -ForegroundColor White
Write-Host "Interval: $IntervalSeconds seconds" -ForegroundColor White
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

$script:lastCheck = (Get-Date).AddMinutes(-1)
$script:checkNumber = 0

Write-Host "`n[INIT] Testing AWS connection..." -ForegroundColor Yellow
try {
    $awsTest = aws sts get-caller-identity --output json 2>&1
    if ($awsTest -like "*error*") {
        Write-Host "[INIT] AWS Error: $awsTest" -ForegroundColor Red
    } else {
        $identity = $awsTest | ConvertFrom-Json
        Write-Host "[INIT] Connected as: $($identity.Arn -replace '.*user/', '')" -ForegroundColor Green
    }
} catch {
    Write-Host "[INIT] Connection test failed" -ForegroundColor Red
}

Write-Host "`n[READY] Starting monitor... Press Ctrl+C to stop" -ForegroundColor Green
Write-Host ""

while ($true) {
    $script:checkNumber++
    $currentTime = Get-Date
    $timeDisplay = $currentTime.ToString('HH:mm:ss')
    
    Write-Host "[$timeDisplay] Check #$script:checkNumber" -ForegroundColor Cyan
    
    try {
        # Calculate time range
        $startTimeMs = [int64](($script:lastCheck.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
        $endTimeMs = [int64](($currentTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
        
        # Query logs using a simple approach
        $logCommand = "aws logs filter-log-events --log-group-name `"$LogGroup`" --start-time $startTimeMs --end-time $endTimeMs --query `"events[*].message`" --output text"
        $rawOutput = Invoke-Expression $logCommand 2>$null
        
        if ($rawOutput -and $rawOutput.Trim() -ne "None" -and $rawOutput.Length -gt 0) {
            $messages = $rawOutput -split "`n" | Where-Object { $_.Trim() -ne "" -and $_.Trim() -ne "None" }
            
            if ($messages.Count -gt 0) {
                Write-Host "  Found $($messages.Count) log entries:" -ForegroundColor White
                
                foreach ($message in $messages) {
                    $msg = $message.Trim()
                    if ($msg.Length -eq 0) { continue }
                    
                    # Clean up the message
                    if ($msg.Length -gt 100) {
                        $msg = $msg.Substring(0, 100) + "..."
                    }
                    
                    # Color code based on content
                    if ($msg -match "ERROR|FATAL|Exception|500") {
                        Write-Host "    🔴 ERROR: $msg" -ForegroundColor Red
                    } elseif ($msg -match "WARN|WARNING") {
                        Write-Host "    🟡 WARN:  $msg" -ForegroundColor Yellow
                    } elseif ($msg -match "START RequestId") {
                        $requestId = if ($msg -match "RequestId: ([a-f0-9]+)") { $matches[1].Substring(0,8) } else { "unknown" }
                        Write-Host "    🚀 START: Lambda $requestId" -ForegroundColor Cyan
                    } elseif ($msg -match "END RequestId") {
                        $requestId = if ($msg -match "RequestId: ([a-f0-9]+)") { $matches[1].Substring(0,8) } else { "unknown" }
                        Write-Host "    ✅ END:   Lambda $requestId" -ForegroundColor Cyan
                    } elseif ($msg -match "REPORT.*Duration: ([0-9.]+) ms") {
                        $duration = $matches[1]
                        $memory = if ($msg -match "Max Memory Used: ([0-9]+) MB") { $matches[1] + "MB" } else { "?MB" }
                        Write-Host "    📊 PERF:  ${duration}ms, Memory: $memory" -ForegroundColor Green
                    } elseif ($msg -match "Lambda Event received") {
                        Write-Host "    📨 EVENT: Incoming request" -ForegroundColor White
                    } elseif ($msg -match "INIT_START") {
                        Write-Host "    🔄 INIT:  Runtime starting" -ForegroundColor Magenta
                    } else {
                        Write-Host "    💬 LOG:   $msg" -ForegroundColor Gray
                    }
                }
            } else {
                Write-Host "  No new activity" -ForegroundColor Gray
            }
        } else {
            Write-Host "  No new logs" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    $script:lastCheck = $currentTime
    
    Write-Host ""
    Start-Sleep $IntervalSeconds
}
