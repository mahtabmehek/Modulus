# Test different login combinations
$apiUrl = "https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/api/auth/login"

$testCredentials = @(
    @{ email = "admin@test.com"; password = "Mahtabmehek@1337" },
    @{ email = "admin@test.com"; password = "admin123" },
    @{ email = "test@test.com"; password = "test123" }
)

foreach ($cred in $testCredentials) {
    Write-Host "Testing login with: $($cred.email)" -ForegroundColor Yellow
    
    $body = @{
        email = $cred.email
        password = $cred.password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri $apiUrl -Method POST -Body $body -ContentType "application/json"
        Write-Host "SUCCESS: $($response.StatusCode)" -ForegroundColor Green
        Write-Host $response.Content
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
    }
    Write-Host "---" -ForegroundColor Gray
}
