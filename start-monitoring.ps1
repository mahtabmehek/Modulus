# Start Modulus Monitoring
# Place this in your Windows Startup folder to auto-start monitoring

Write-Host "Starting Modulus LMS Monitoring..." -ForegroundColor Green

# Change to the correct directory
Set-Location "C:\Users\mahta\Desktop\Modulus\Main"

# Start the monitor in a new window
Start-Process PowerShell -ArgumentList "-WindowStyle Minimized -ExecutionPolicy Bypass -File `".\modulus-monitor-simple.ps1`""

Write-Host "Monitor started in background window" -ForegroundColor Green
Write-Host "Check modulus-alerts.log for any issues" -ForegroundColor Yellow

# Keep this window open for 3 seconds then close
Start-Sleep 3
