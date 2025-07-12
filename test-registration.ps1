$body = @{
    username = "teststudent2"
    email = "test2@student.com"
    password = "Test123!"
    role = "student"
    accessCode = "STUDENT2025"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/api/auth/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    Write-Host "SUCCESS: Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response: $responseBody"
    }
}
