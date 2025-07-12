# Script to manually populate the database with 4 test users (one for each role)
Write-Host "Manually Populating Database with Test Users" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Configuration
$API_URL = "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"

# Test users for each role
$testUsers = @(
    @{
        name = "John Student"
        email = "student@test.com"
        password = "Mahtabmehek@1337"
        role = "student"
        description = "Test Student User"
    },
    @{
        name = "Jane Instructor"
        email = "instructor@test.com"
        password = "Mahtabmehek@1337"
        role = "instructor"
        description = "Test Instructor User"
    },
    @{
        name = "Mike Staff"
        email = "staff@test.com"
        password = "Mahtabmehek@1337"
        role = "staff"
        description = "Test Staff User"
    },
    @{
        name = "Sarah Admin"
        email = "admin@test.com"
        password = "Mahtabmehek@1337"
        role = "admin"
        description = "Test Admin User"
    }
)

# Function to register a user
function Register-User {
    param(
        [hashtable]$user
    )
    
    Write-Host "`nRegistering $($user.description)..." -ForegroundColor Yellow
    Write-Host "   Email: $($user.email)" -ForegroundColor Cyan
    Write-Host "   Role: $($user.role)" -ForegroundColor Cyan
    
    try {
        $registrationBody = @{
            name = $user.name
            email = $user.email
            password = $user.password
            role = $user.role
            accessCode = "mahtabmehek1337"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$API_URL/auth/register" -Method POST -Body $registrationBody -ContentType "application/json"
        
        Write-Host "   Registration successful" -ForegroundColor Green
        Write-Host "   User ID: $($response.user.id)" -ForegroundColor Green
        
        return $response
    }
    catch {
        Write-Host "   Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        
        # Check if it's a duplicate user error
        if ($_.Exception.Message -like "*already exists*" -or $_.Exception.Message -like "*duplicate*") {
            Write-Host "   User might already exist, attempting login..." -ForegroundColor Yellow
            return Test-UserLogin -user $user
        }
        
        return $null
    }
}

# Function to test user login
function Test-UserLogin {
    param(
        [hashtable]$user
    )
    
    Write-Host "`nTesting login for $($user.email)..." -ForegroundColor Yellow
    
    try {
        $loginBody = @{
            email = $user.email
            password = $user.password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
        
        Write-Host "   Login successful" -ForegroundColor Green
        Write-Host "   Token received: Yes" -ForegroundColor Green
        Write-Host "   User Role: $($response.user.role)" -ForegroundColor Green
        
        return $response
    }
    catch {
        Write-Host "   Login failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Function to approve a user (if needed)
function Approve-User {
    param(
        [string]$userId,
        [string]$adminToken
    )
    
    Write-Host "`nApproving user $userId..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $adminToken"
            "Content-Type" = "application/json"
        }
        
        $approvalBody = @{
            isApproved = $true
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$API_URL/admin/users/$userId/approve" -Method POST -Body $approvalBody -Headers $headers
        
        Write-Host "   User approved successfully" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "   User approval failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test API connectivity first
Write-Host "`nTesting API connectivity..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$API_URL/health" -Method GET
    Write-Host "API is accessible" -ForegroundColor Green
    Write-Host "API Status: $($healthResponse.status)" -ForegroundColor Cyan
}
catch {
    Write-Host "API not accessible: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure the backend is deployed and running." -ForegroundColor Red
    exit 1
}

# Register all users
$registeredUsers = @()
$adminToken = $null

foreach ($user in $testUsers) {
    $result = Register-User -user $user
    if ($result) {
        $registeredUsers += @{
            user = $user
            response = $result
        }
        
        # Store admin token for later use
        if ($user.role -eq "admin" -and $result.token) {
            $adminToken = $result.token
        }
    }
}

# If we have an admin token, try to approve other users
if ($adminToken) {
    Write-Host "`nAdmin token available, attempting to approve users..." -ForegroundColor Yellow
    
    foreach ($regUser in $registeredUsers) {
        if ($regUser.user.role -ne "admin" -and $regUser.response.user.id) {
            Approve-User -userId $regUser.response.user.id -adminToken $adminToken
        }
    }
}

# Test login for all registered users
Write-Host "`nTesting login for all users..." -ForegroundColor Yellow

foreach ($user in $testUsers) {
    $loginResult = Test-UserLogin -user $user
}

# Summary
Write-Host "`nUser Population Summary" -ForegroundColor Yellow
Write-Host "=========================="
Write-Host "API URL: $API_URL"
Write-Host "Access Code Used: mahtabmehek1337"
Write-Host "Default Password: Mahtabmehek@1337"
Write-Host ""
Write-Host "Created Users:" -ForegroundColor Cyan

foreach ($user in $testUsers) {
    Write-Host "  $($user.email)" -ForegroundColor White
    Write-Host "     Name: $($user.name)" -ForegroundColor Gray
    Write-Host "     Role: $($user.role)" -ForegroundColor Gray
    Write-Host "     Password: $($user.password)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Database population completed!" -ForegroundColor Green
Write-Host "You can now use these accounts to test the application." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Use admin@test.com to access admin features"
Write-Host "2. Use instructor@test.com to test instructor functionality"
Write-Host "3. Use staff@test.com to test staff features"
Write-Host "4. Use student@test.com to test student experience"
