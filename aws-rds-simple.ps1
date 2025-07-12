# Simple AWS RDS Database Population
Write-Host "AWS RDS Database Population" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

# First, let's detect your RDS instances
Write-Host "`n🔍 Detecting RDS instances..." -ForegroundColor Yellow

try {
    $rdsOutput = aws rds describe-db-instances --region eu-west-2 --output json | ConvertFrom-Json
    
    if ($rdsOutput.DBInstances.Count -gt 0) {
        $instance = $rdsOutput.DBInstances[0]
        $endpoint = $instance.Endpoint.Address
        $dbName = $instance.DBName
        $masterUser = $instance.MasterUsername
        $engine = $instance.Engine
        
        Write-Host "✅ Found RDS instance:" -ForegroundColor Green
        Write-Host "   Identifier: $($instance.DBInstanceIdentifier)" -ForegroundColor Cyan
        Write-Host "   Endpoint: $endpoint" -ForegroundColor Cyan
        Write-Host "   Database: $dbName" -ForegroundColor Cyan
        Write-Host "   User: $masterUser" -ForegroundColor Cyan
        Write-Host "   Engine: $engine" -ForegroundColor Cyan
        
        # Create the SQL file with the commands
        $sqlCommands = @'
-- Insert test users for Modulus LMS
-- Password for all users: Mahtabmehek@1337

INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES
('student@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'John Student', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('instructor@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('staff@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Verify users were created
SELECT id, email, name, role, is_approved, created_at 
FROM users 
WHERE email IN ('student@test.com', 'instructor@test.com', 'staff@test.com', 'admin@test.com')
ORDER BY role, name;
'@
        
        $sqlCommands | Out-File -FilePath "rds-insert-users.sql" -Encoding UTF8
        Write-Host "`n📝 Created SQL file: rds-insert-users.sql" -ForegroundColor Green
        
        # Create direct psql command
        Write-Host "`n💡 To execute via psql (if you have psql installed locally):" -ForegroundColor Yellow
        Write-Host "psql -h $endpoint -p 5432 -U $masterUser -d $dbName -f rds-insert-users.sql" -ForegroundColor White
        
        # Create AWS CLI command for RDS Query Editor
        Write-Host "`n💡 To use AWS RDS Query Editor:" -ForegroundColor Yellow
        Write-Host "1. Go to AWS Console -> RDS -> Databases -> $($instance.DBInstanceIdentifier)" -ForegroundColor White
        Write-Host "2. Click 'Query Editor'" -ForegroundColor White
        Write-Host "3. Copy and paste the contents of rds-insert-users.sql" -ForegroundColor White
        
        # Try to execute using AWS CLI if possible
        Write-Host "`n🚀 Attempting direct execution via AWS CLI..." -ForegroundColor Yellow
        
        # Check if we can use RDS Data API
        Write-Host "Note: Direct SQL execution via AWS CLI requires RDS Data API (Aurora Serverless)" -ForegroundColor Cyan
        Write-Host "For standard RDS instances, use the Query Editor option above." -ForegroundColor Cyan
        
    } else {
        Write-Host "❌ No RDS instances found in region eu-west-2" -ForegroundColor Red
        Write-Host "Please check your AWS region or create an RDS instance first." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error accessing RDS: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure AWS CLI is configured and you have RDS permissions." -ForegroundColor Yellow
    
    # Create the SQL file anyway
    $sqlCommands = @'
-- Insert test users for Modulus LMS
-- Password for all users: Mahtabmehek@1337

INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES
('student@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'John Student', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('instructor@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('staff@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Verify users were created
SELECT id, email, name, role, is_approved, created_at 
FROM users 
WHERE email IN ('student@test.com', 'instructor@test.com', 'staff@test.com', 'admin@test.com')
ORDER BY role, name;
'@
    
    $sqlCommands | Out-File -FilePath "rds-insert-users.sql" -Encoding UTF8
    Write-Host "`n📝 Created SQL file anyway: rds-insert-users.sql" -ForegroundColor Green
}

Write-Host "`n📋 Summary:" -ForegroundColor Yellow
Write-Host "==========" -ForegroundColor Yellow
Write-Host "✅ SQL file created: rds-insert-users.sql"
Write-Host "✅ 4 test users ready to insert:"
Write-Host "   - student@test.com (Student)"
Write-Host "   - instructor@test.com (Instructor)"  
Write-Host "   - staff@test.com (Staff)"
Write-Host "   - admin@test.com (Admin)"
Write-Host "✅ Password for all: Mahtabmehek@1337"
Write-Host "✅ All users pre-approved"

Write-Host "`n🎯 Next Step: Use AWS RDS Query Editor to execute rds-insert-users.sql" -ForegroundColor Green
