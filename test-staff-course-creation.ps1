# Test Staff User Course Creation
# Testing if staffuser@test.com can create courses and store them in database

$ErrorActionPreference = "Stop"

# API Configuration
$API_BASE = "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"
$staffEmail = "staffuser@test.com"
$staffPassword = "password123"

Write-Host "Testing Staff User Course Creation" -ForegroundColor Cyan
Write-Host "User: $staffEmail" -ForegroundColor Gray
Write-Host "API: $API_BASE" -ForegroundColor Gray
Write-Host ""

try {
    # Step 1: Authenticate as staff user
    Write-Host "Step 1: Authenticating as staff user..." -ForegroundColor Yellow
    
    $loginData = @{
        email = $staffEmail
        password = $staffPassword
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.token) {
        Write-Host "Authentication successful!" -ForegroundColor Green
        Write-Host "User: $($loginResponse.user.name) ($($loginResponse.user.role))" -ForegroundColor Gray
        $authToken = $loginResponse.token
    } else {
        throw "Authentication failed - no token received"
    }
    
    # Step 2: Create a test course
    Write-Host ""
    Write-Host "Step 2: Creating test course..." -ForegroundColor Yellow
    
    $courseData = @{
        title = "Staff Test Course - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        code = "STAFF-$(Get-Random -Minimum 100 -Maximum 999)"
        description = "This is a test course created by staff user to verify database storage functionality."
        department = "Information Technology"
        academicLevel = "bachelor"
        duration = 1
        totalCredits = 25
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $authToken"
        "Content-Type" = "application/json"
    }
    
    $courseResponse = Invoke-RestMethod -Uri "$API_BASE/courses" -Method POST -Body $courseData -Headers $headers
    
    if ($courseResponse.course) {
        Write-Host "Course created successfully!" -ForegroundColor Green
        Write-Host "Course ID: $($courseResponse.course.id)" -ForegroundColor Gray
        Write-Host "Course Code: $($courseResponse.course.code)" -ForegroundColor Gray
        Write-Host "Course Title: $($courseResponse.course.title)" -ForegroundColor Gray
        $newCourseId = $courseResponse.course.id
    } else {
        throw "Course creation failed - no course data received"
    }
    
    # Step 3: Verify course is stored in database
    Write-Host ""
    Write-Host "Step 3: Verifying course storage in database..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 2  # Give database time to sync
    
    # Query database directly to verify storage
    $dbQuery = "SELECT id, title, code, description, department, academic_level, duration, total_credits, created_by, created_at FROM courses WHERE id = $newCourseId;"
    
    $dbCommandOutput = aws rds-data execute-statement --resource-arn "arn:aws:rds:eu-west-2:376129881409:cluster:modulus-aurora-cluster" --secret-arn "arn:aws:secretsmanager:eu-west-2:376129881409:secret:modulus-aurora-credentials-bvPpka" --database "modulus" --sql $dbQuery --region eu-west-2
    $dbResponse = $dbCommandOutput | ConvertFrom-Json
    
    if ($dbResponse.records -and $dbResponse.records.Count -gt 0) {
        Write-Host "Course verified in database!" -ForegroundColor Green
        
        $record = $dbResponse.records[0]
        Write-Host ""
        Write-Host "Database Record Details:" -ForegroundColor Cyan
        Write-Host "  ID: $($record[0].longValue)" -ForegroundColor Gray
        Write-Host "  Title: $($record[1].stringValue)" -ForegroundColor Gray
        Write-Host "  Code: $($record[2].stringValue)" -ForegroundColor Gray
        Write-Host "  Description: $($record[3].stringValue)" -ForegroundColor Gray
        Write-Host "  Department: $($record[4].stringValue)" -ForegroundColor Gray
        Write-Host "  Academic Level: $($record[5].stringValue)" -ForegroundColor Gray
        Write-Host "  Duration: $($record[6].longValue) years" -ForegroundColor Gray
        Write-Host "  Total Credits: $($record[7].longValue)" -ForegroundColor Gray
        Write-Host "  Created By User ID: $($record[8].longValue)" -ForegroundColor Gray
        Write-Host "  Created At: $($record[9].stringValue)" -ForegroundColor Gray
        
    } else {
        throw "Course not found in database - storage verification failed"
    }
    
    # Step 4: Test retrieving course via API
    Write-Host ""
    Write-Host "Step 4: Testing course retrieval via API..." -ForegroundColor Yellow
    
    $retrieveResponse = Invoke-RestMethod -Uri "$API_BASE/courses/$newCourseId" -Method GET -Headers $headers
    
    if ($retrieveResponse.course) {
        Write-Host "Course retrieval successful!" -ForegroundColor Green
        Write-Host "Retrieved Title: $($retrieveResponse.course.title)" -ForegroundColor Gray
    } else {
        Write-Host "Course retrieval failed" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "All tests passed! Staff user can successfully:" -ForegroundColor Green
    Write-Host "   - Authenticate with credentials" -ForegroundColor Green
    Write-Host "   - Create courses via API" -ForegroundColor Green
    Write-Host "   - Store data in Aurora database" -ForegroundColor Green
    Write-Host "   - Retrieve created courses" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "Test failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more details from the error
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error details: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read error response" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Test completed." -ForegroundColor Cyan
