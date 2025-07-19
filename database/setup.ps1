# Modulus LMS Database Setup Script for Windows PowerShell
# Created: July 18, 2025

Write-Host "🗄️ Modulus LMS PostgreSQL Database Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if PostgreSQL is installed
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL first:" -ForegroundColor Yellow
    Write-Host "- Download from https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "- Make sure to add PostgreSQL bin directory to PATH" -ForegroundColor White
    exit 1
}

Write-Host "✅ PostgreSQL found at: $($psqlPath.Source)" -ForegroundColor Green

# Database configuration
$DB_NAME = "modulus"
$DB_USER = "postgres"
$DB_PASSWORD = "mahtab"

Write-Host "📋 Database Configuration:" -ForegroundColor Yellow
Write-Host "   Database: $DB_NAME" -ForegroundColor White
Write-Host "   User: $DB_USER" -ForegroundColor White
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host ""

# Set PGPASSWORD environment variable to avoid password prompt
$env:PGPASSWORD = $DB_PASSWORD

# Check if database exists
$dbExists = psql -U $DB_USER -h localhost -lqt | Select-String $DB_NAME
if ($dbExists) {
    Write-Host "⚠️  Database '$DB_NAME' already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to drop and recreate it? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "🗑️  Dropping existing database..." -ForegroundColor Yellow
        dropdb -U $DB_USER -h localhost $DB_NAME
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database dropped" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Failed to drop database" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "❌ Setup cancelled" -ForegroundColor Red
        exit 1
    }
}

# Create database
Write-Host "🏗️  Creating database '$DB_NAME'..." -ForegroundColor Yellow
createdb -U $DB_USER -h localhost $DB_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database created successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Failed to create database" -ForegroundColor Red
    Write-Host "Make sure PostgreSQL service is running and credentials are correct" -ForegroundColor Yellow
    exit 1
}

# Check if schema file exists
$schemaFile = "database\schema.sql"
if (-not (Test-Path $schemaFile)) {
    Write-Host "❌ Schema file not found: $schemaFile" -ForegroundColor Red
    Write-Host "Make sure you're running this script from the Modulus project root directory" -ForegroundColor Yellow
    exit 1
}

# Run schema script
Write-Host "📊 Creating database schema..." -ForegroundColor Yellow
psql -U $DB_USER -h localhost -d $DB_NAME -f $schemaFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema created successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Failed to create schema" -ForegroundColor Red
    exit 1
}

# Check if test data file exists
$testDataFile = "database\test_data.sql"
if (-not (Test-Path $testDataFile)) {
    Write-Host "❌ Test data file not found: $testDataFile" -ForegroundColor Red
    exit 1
}

# Run test data script
Write-Host "👥 Inserting test data..." -ForegroundColor Yellow
psql -U $DB_USER -h localhost -d $DB_NAME -f $testDataFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Test data inserted successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Failed to insert test data" -ForegroundColor Red
    exit 1
}

# Verify setup
Write-Host "🔍 Verifying database setup..." -ForegroundColor Yellow
$verificationQuery = @"
SELECT 
    'Tables created: ' || COUNT(*) as info
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 'Test users: ' || COUNT(*) FROM users
UNION ALL  
SELECT 'Courses: ' || COUNT(*) FROM courses
UNION ALL
SELECT 'Labs: ' || COUNT(*) FROM labs;
"@

psql -U $DB_USER -h localhost -d $DB_NAME -c $verificationQuery

Write-Host ""
Write-Host "🎉 Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Test Credentials:" -ForegroundColor Cyan
Write-Host "   Admin: admin@test.com / Mahtabmehek@1337" -ForegroundColor White
Write-Host "   Instructor: instructor@test.com / Mahtabmehek@1337" -ForegroundColor White
Write-Host "   Student: student@test.com / Mahtabmehek@1337" -ForegroundColor White
Write-Host "   Staff: staff@test.com / Mahtabmehek@1337" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Configure backend\.env file with database credentials" -ForegroundColor White
Write-Host "   2. Start backend server: cd backend && npm start" -ForegroundColor White
Write-Host "   3. Start frontend server: npm run dev" -ForegroundColor White
Write-Host "   4. Access application: http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: If you encounter connection issues, make sure:" -ForegroundColor Yellow
Write-Host "   - PostgreSQL service is running" -ForegroundColor White
Write-Host "   - Password 'mahtab' is set for postgres user" -ForegroundColor White
Write-Host "   - Port 5432 is accessible" -ForegroundColor White

# Clear password from environment
Remove-Item Env:PGPASSWORD
