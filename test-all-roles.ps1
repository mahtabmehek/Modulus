$tests = @(
    @{
        name = "Student Registration"
        username = "student1"
        email = "student1@test.com"
        password = "Test123!"
        role = "student"
        accessCode = "STUDENT2025"
    },
    @{
        name = "Instructor Registration"
        username = "instructor1"
        email = "instructor1@test.com"
        password = "Test123!"
        role = "instructor"
        accessCode = "INSTRUCTOR2025"
    },
    @{
        name = "Staff Registration"
        username = "staff1"
        email = "staff1@test.com"
        password = "Test123!"
        role = "staff"
        accessCode = "STAFF2025"
    }
)

foreach ($test in $tests) {
    Write-Host "`n=== Testing $($test.name) ==="
    
    $body = @{
        username = $test.username
        email = $test.email
        password = $test.password
        role = $test.role
        accessCode = $test.accessCode
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
    
    Start-Sleep 1
}
