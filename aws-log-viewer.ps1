# AWS CloudWatch Log Viewer for Modulus LMS
# This script helps view and analyze CloudWatch logs

param(
    [string]$LogGroup = "",
    [string]$FilterPattern = "",
    [int]$Hours = 1,
    [switch]$Follow,
    [switch]$ListGroups
)

Write-Host "📊 Modulus LMS - CloudWatch Log Viewer" -ForegroundColor Cyan

# List all log groups if requested
if ($ListGroups) {
    Write-Host "`n📋 Available Log Groups:" -ForegroundColor Yellow
    try {
        $logGroups = aws logs describe-log-groups --query 'logGroups[*].logGroupName' --output json | ConvertFrom-Json
        foreach ($group in $logGroups) {
            if ($group -like "*modulus*" -or $group -like "*lambda*" -or $group -like "*api*") {
                Write-Host "   🔹 $group" -ForegroundColor Green
            } else {
                Write-Host "   🔸 $group" -ForegroundColor White
            }
        }
    } catch {
        Write-Host "❌ Failed to retrieve log groups: $($_.Exception.Message)" -ForegroundColor Red
    }
    return
}

# If no log group specified, try to find Modulus-related ones
if (-not $LogGroup) {
    Write-Host "🔍 Searching for Modulus-related log groups..." -ForegroundColor Yellow
    try {
        $logGroups = aws logs describe-log-groups --query 'logGroups[*].logGroupName' --output json | ConvertFrom-Json
        $modulusGroups = $logGroups | Where-Object { $_ -like "*modulus*" -or $_ -like "*lambda*" }
        
        if ($modulusGroups.Count -gt 0) {
            $LogGroup = $modulusGroups[0]
            Write-Host "✅ Using log group: $LogGroup" -ForegroundColor Green
        } else {
            Write-Host "❌ No Modulus-related log groups found. Use -ListGroups to see all available groups." -ForegroundColor Red
            return
        }
    } catch {
        Write-Host "❌ Failed to search log groups: $($_.Exception.Message)" -ForegroundColor Red
        return
    }
}

# Calculate time range
$endTime = Get-Date
$startTime = $endTime.AddHours(-$Hours)
$startTimeMs = [int64](($startTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
$endTimeMs = [int64](($endTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)

Write-Host "`n📋 Log Query Details:" -ForegroundColor Cyan
Write-Host "   Log Group: $LogGroup" -ForegroundColor White
Write-Host "   Time Range: $startTime to $endTime" -ForegroundColor White
Write-Host "   Filter: $(if($FilterPattern) { $FilterPattern } else { 'None' })" -ForegroundColor White

# Build AWS CLI command
$cmd = "aws logs filter-log-events --log-group-name `"$LogGroup`" --start-time $startTimeMs --end-time $endTimeMs"
if ($FilterPattern) {
    $cmd += " --filter-pattern `"$FilterPattern`""
}
$cmd += " --output json"

try {
    Write-Host "`n📊 Retrieving logs..." -ForegroundColor Yellow
    $result = Invoke-Expression $cmd | ConvertFrom-Json
    
    if ($result.events.Count -eq 0) {
        Write-Host "ℹ️  No log events found for the specified criteria." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Found $($result.events.Count) log events:" -ForegroundColor Green
        Write-Host "`n" + "="*80 -ForegroundColor Gray
        
        foreach ($logEvent in $result.events) {
            $timestamp = [datetime]::FromFileTimeUtc($logEvent.timestamp * 10000 + 116444736000000000)
            $level = if ($logEvent.message -match "ERROR|❌") { "Red" } 
                    elseif ($logEvent.message -match "WARN|⚠️") { "Yellow" }
                    elseif ($logEvent.message -match "INFO|✅") { "Green" }
                    else { "White" }
            
            Write-Host "$($timestamp.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray -NoNewline
            Write-Host " | " -ForegroundColor Gray -NoNewline
            Write-Host "$($logEvent.message)" -ForegroundColor $level
        }
    }        # Follow logs if requested
        if ($Follow) {
            Write-Host "`n👀 Following logs (Ctrl+C to stop)..." -ForegroundColor Cyan
            $lastTimestamp = if ($result.events.Count -gt 0) { $result.events[-1].timestamp } else { $endTimeMs }
            
            while ($true) {
                Start-Sleep 5
                $newCmd = "aws logs filter-log-events --log-group-name `"$LogGroup`" --start-time $lastTimestamp"
                if ($FilterPattern) {
                    $newCmd += " --filter-pattern `"$FilterPattern`""
                }
                $newCmd += " --output json"
                
                $newResult = Invoke-Expression $newCmd | ConvertFrom-Json
                if ($newResult.events.Count -gt 0) {
                    foreach ($logEvent in $newResult.events) {
                        if ($logEvent.timestamp -gt $lastTimestamp) {
                            $timestamp = [datetime]::FromFileTimeUtc($logEvent.timestamp * 10000 + 116444736000000000)
                            Write-Host "$($timestamp.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray -NoNewline
                            Write-Host " | " -ForegroundColor Gray -NoNewline
                            Write-Host "$($logEvent.message)" -ForegroundColor White
                            $lastTimestamp = $logEvent.timestamp
                        }
                    }
                }
            }
        }
    
} catch {
    Write-Host "❌ Failed to retrieve logs: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running with -ListGroups to see available log groups" -ForegroundColor Yellow
}

Write-Host "`n📋 Usage Examples:" -ForegroundColor Cyan
Write-Host "   ./aws-log-viewer.ps1 -ListGroups" -ForegroundColor White
Write-Host "   ./aws-log-viewer.ps1 -LogGroup '/aws/lambda/your-function' -Hours 2" -ForegroundColor White
Write-Host "   ./aws-log-viewer.ps1 -FilterPattern 'ERROR' -Follow" -ForegroundColor White
