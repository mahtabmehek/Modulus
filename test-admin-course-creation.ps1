# Test Admin User Course Creation
# Testing if admin user can create courses and store them in database

$ErrorActionPreference = "Stop"

# API Configuration  
$API_BASE = "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"
$adminEmail = "testadminfinal@test.com"
$adminPassword = "password123"

Write-Host "Testing Admin User Course Creation" -ForegroundColor Cyan
Write-Host "User: $adminEmail" -ForegroundColor Gray
Write-Host ""

try {
    # Step 1: Authenticate as admin user
    Write-Host "Step 1: Authenticating as admin user..." -ForegroundColor Yellow
    
    $loginData = @{
        email = $adminEmail
        password = $adminPassword
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
    Write-Host "Step 2: Creating test course as admin..." -ForegroundColor Yellow
    
    $courseData = @{
        title = "Admin Test Course - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        code = "ADMIN-$(Get-Random -Minimum 100 -Maximum 999)"
        description = "This is a test course created by admin user to verify database storage and permissions."
        department = "Computer Science"
        academicLevel = "master"
        duration = 2
        totalCredits = 40
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
        throw "Course creation failed"
    }
    
    # Step 3: Verify in database with user attribution
    Write-Host ""
    Write-Host "Step 3: Verifying admin course in database..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 2
    
    $dbQuery = "SELECT c.id, c.title, c.code, c.academic_level, c.total_credits, u.name as created_by_name, u.role FROM courses c JOIN users u ON c.created_by = u.id WHERE c.id = $newCourseId;"
    
    $dbCommandOutput = aws rds-data execute-statement --resource-arn "arn:aws:rds:eu-west-2:376129881409:cluster:modulus-aurora-cluster" --secret-arn "arn:aws:secretsmanager:eu-west-2:376129881409:secret:modulus-aurora-credentials-bvPpka" --database "modulus" --sql $dbQuery --region eu-west-2
    $dbResponse = $dbCommandOutput | ConvertFrom-Json
    
    if ($dbResponse.records -and $dbResponse.records.Count -gt 0) {
        Write-Host "Admin course verified in database!" -ForegroundColor Green
        
        $record = $dbResponse.records[0]
        Write-Host ""
        Write-Host "Admin Course Database Record:" -ForegroundColor Cyan
        Write-Host "  ID: $($record[0].longValue)" -ForegroundColor Gray
        Write-Host "  Title: $($record[1].stringValue)" -ForegroundColor Gray
        Write-Host "  Code: $($record[2].stringValue)" -ForegroundColor Gray
        Write-Host "  Academic Level: $($record[3].stringValue)" -ForegroundColor Gray
        Write-Host "  Total Credits: $($record[4].longValue)" -ForegroundColor Gray
        Write-Host "  Created By: $($record[5].stringValue) ($($record[6].stringValue))" -ForegroundColor Gray
        
    } else {
        throw "Admin course not found in database"
    }
    
    Write-Host ""
    Write-Host "Admin user test passed!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "Admin test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Admin test completed." -ForegroundColor Cyan
