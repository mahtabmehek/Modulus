# Check Modulus Monitoring Status
Write-Host "Modulus LMS Monitoring Status" -ForegroundColor Cyan

# Check if monitor is running
$monitorProcess = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*modulus-monitor-simple*" }

if ($monitorProcess) {
    Write-Host "Monitor Status: RUNNING" -ForegroundColor Green
    Write-Host "Process ID: $($monitorProcess.Id)" -ForegroundColor White
} else {
    Write-Host "Monitor Status: NOT RUNNING" -ForegroundColor Red
    Write-Host "To start: .\start-monitoring.ps1" -ForegroundColor Yellow
}

# Check alert log
if (Test-Path "modulus-alerts.log") {
    $alerts = Get-Content "modulus-alerts.log" -ErrorAction SilentlyContinue
    if ($alerts) {
        Write-Host "`nRecent Alerts: $($alerts.Count)" -ForegroundColor Yellow
        Write-Host "Latest alerts:" -ForegroundColor Gray
        $alerts | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    } else {
        Write-Host "`nRecent Alerts: 0" -ForegroundColor Green
        Write-Host "No issues detected!" -ForegroundColor Green
    }
} else {
    Write-Host "`nAlert Log: Not created yet" -ForegroundColor Gray
}

# Check AWS connection
Write-Host "`nAWS Connection Test:" -ForegroundColor Cyan
try {
    $result = aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/modulus" --output json 2>$null | ConvertFrom-Json
    if ($result.logGroups) {
        Write-Host "AWS Connection: OK" -ForegroundColor Green
        Write-Host "Lambda Logs: Available" -ForegroundColor Green
    } else {
        Write-Host "AWS Connection: Limited" -ForegroundColor Yellow
    }
} catch {
    Write-Host "AWS Connection: Failed" -ForegroundColor Red
}

Write-Host "`nCommands:" -ForegroundColor Cyan
Write-Host "  Start Monitor: .\start-monitoring.ps1" -ForegroundColor White
Write-Host "  View Logs: .\aws-log-viewer-simple.ps1 -LogGroup '/aws/lambda/modulus-backend'" -ForegroundColor White
Write-Host "  Check Services: .\aws-monitor-simple.ps1" -ForegroundColor White
