try {
    $registerData = @{
        name = "Test Admin"
        email = "admin@test.com"
        password = "Mahtabmehek@1337"
        role = "admin"
        accessCode = "mahtabmehek1337"
    } | ConvertTo-Json
    
    Write-Host "Sending registration data: $registerData"
    
    $response = Invoke-WebRequest -Uri "https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/api/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "SUCCESS: $($response.StatusCode)"
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
