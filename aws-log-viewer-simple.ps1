# AWS CloudWatch Log Viewer for Modulus LMS
param(
    [string]$LogGroup = "",
    [switch]$ListGroups
)

Write-Host "CloudWatch Log Viewer for Modulus LMS" -ForegroundColor Cyan

if ($ListGroups) {
    Write-Host "`nAvailable Log Groups:" -ForegroundColor Yellow
    try {
        $result = aws logs describe-log-groups --output json | ConvertFrom-Json
        foreach ($group in $result.logGroups) {
            if ($group.logGroupName -like "*modulus*" -or $group.logGroupName -like "*lambda*") {
                Write-Host "  $($group.logGroupName)" -ForegroundColor Green
            } else {
                Write-Host "  $($group.logGroupName)" -ForegroundColor White
            }
        }
    } catch {
        Write-Host "Failed to retrieve log groups: $($_.Exception.Message)" -ForegroundColor Red
    }
    return
}

if (-not $LogGroup) {
    Write-Host "Please specify a log group or use -ListGroups to see available groups" -ForegroundColor Yellow
    Write-Host "Usage: ./aws-log-viewer-simple.ps1 -LogGroup '/aws/lambda/function-name'" -ForegroundColor White
    Write-Host "       ./aws-log-viewer-simple.ps1 -ListGroups" -ForegroundColor White
    return
}

Write-Host "`nRetrieving logs from: $LogGroup" -ForegroundColor Cyan

# Get logs from last hour
$endTime = Get-Date
$startTime = $endTime.AddHours(-1)
$startTimeMs = [int64](($startTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)
$endTimeMs = [int64](($endTime.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds)

try {
    $result = aws logs filter-log-events --log-group-name $LogGroup --start-time $startTimeMs --end-time $endTimeMs --output json | ConvertFrom-Json
    
    if ($result.events.Count -eq 0) {
        Write-Host "No log events found in the last hour" -ForegroundColor Yellow
    } else {
        Write-Host "Found $($result.events.Count) log events:" -ForegroundColor Green
        Write-Host ("=" * 80) -ForegroundColor Gray
        
        foreach ($logEvent in $result.events) {
            $timestamp = [datetime]::FromFileTimeUtc($logEvent.timestamp * 10000 + 116444736000000000)
            $color = if ($logEvent.message -match "ERROR") { "Red" } 
                    elseif ($logEvent.message -match "WARN") { "Yellow" }
                    else { "White" }
            
            Write-Host "$($timestamp.ToString('yyyy-MM-dd HH:mm:ss')) | " -ForegroundColor Gray -NoNewline
            Write-Host "$($logEvent.message)" -ForegroundColor $color
        }
    }
} catch {
    Write-Host "Failed to retrieve logs: $($_.Exception.Message)" -ForegroundColor Red
}
