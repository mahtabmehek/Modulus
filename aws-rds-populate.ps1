# AWS CLI Database Population Script
# This script connects to AWS RDS and inserts the test users directly

Write-Host "AWS RDS Database Population Script" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Configuration - Update these values for your RDS instance
$RDS_ENDPOINT = "your-rds-endpoint.region.rds.amazonaws.com"
$DB_NAME = "modulus"
$DB_USER = "postgres"
$REGION = "eu-west-2"

Write-Host "`nDetecting RDS instances in region $REGION..." -ForegroundColor Yellow

# Get RDS instances
try {
    $rdsInstances = aws rds describe-db-instances --region $REGION --query "DBInstances[*].[DBInstanceIdentifier,Endpoint.Address,DBName,MasterUsername,Engine]" --output table
    Write-Host "Available RDS instances:" -ForegroundColor Cyan
    Write-Host $rdsInstances
} catch {
    Write-Host "❌ Error getting RDS instances: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure AWS CLI is configured and you have RDS permissions" -ForegroundColor Yellow
}

# Auto-detect RDS endpoint
try {
    $rdsEndpoint = aws rds describe-db-instances --region $REGION --query "DBInstances[0].Endpoint.Address" --output text
    $dbName = aws rds describe-db-instances --region $REGION --query "DBInstances[0].DBName" --output text
    $masterUser = aws rds describe-db-instances --region $REGION --query "DBInstances[0].MasterUsername" --output text
    
    if ($rdsEndpoint -and $rdsEndpoint -ne "None") {
        Write-Host "`n✅ Auto-detected RDS instance:" -ForegroundColor Green
        Write-Host "   Endpoint: $rdsEndpoint" -ForegroundColor Cyan
        Write-Host "   Database: $dbName" -ForegroundColor Cyan
        Write-Host "   User: $masterUser" -ForegroundColor Cyan
        
        $RDS_ENDPOINT = $rdsEndpoint
        $DB_NAME = $dbName
        $DB_USER = $masterUser
    }
} catch {
    Write-Host "⚠️ Could not auto-detect RDS instance. Using default values." -ForegroundColor Yellow
}

# Create the SQL file
$sqlContent = @"
-- Insert 4 test users (one for each role) with proper bcrypt password hash
-- Password for all users: Mahtabmehek@1337

INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES
('student@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'John Student', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('instructor@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('staff@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Verify users were created
SELECT id, email, name, role, is_approved, created_at FROM users 
WHERE email IN ('student@test.com', 'instructor@test.com', 'staff@test.com', 'admin@test.com')
ORDER BY role, name;
"@

$sqlFile = "aws-insert-users.sql"
$sqlContent | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "`n📝 Created SQL file: $sqlFile" -ForegroundColor Green

# Option 1: Use AWS RDS Data API (if available)
Write-Host "`n🔄 Attempting to use AWS RDS Data API..." -ForegroundColor Yellow

try {
    # Check if RDS Data API is available for this instance
    $dataApiEnabled = aws rds describe-db-clusters --region $REGION --query "DBClusters[0].EnabledCloudwatchLogsExports" --output text 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "ℹ️ RDS Data API might be available (Aurora cluster detected)" -ForegroundColor Cyan
        Write-Host "You can use the RDS Data API for serverless database operations" -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️ RDS Data API not available (standard RDS instance)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ℹ️ Could not determine RDS Data API availability" -ForegroundColor Gray
}

# Option 2: Use AWS Systems Manager Session Manager + psql
Write-Host "`n🔄 Option 2: Using AWS Systems Manager..." -ForegroundColor Yellow

Write-Host "This requires an EC2 instance with Session Manager access." -ForegroundColor Cyan
Write-Host "We'll create a command to run via Session Manager." -ForegroundColor Cyan

# Create a session manager command
$sessionCommand = @"
# Commands to run via AWS Systems Manager Session Manager
# 1. Connect to an EC2 instance that has network access to RDS
# 2. Install psql if not available: sudo yum install postgresql -y
# 3. Run the following commands:

export PGPASSWORD="your-db-password"
psql -h $RDS_ENDPOINT -p 5432 -U $DB_USER -d $DB_NAME -c "
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES
('student@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'John Student', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('instructor@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('staff@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;
"

# Verify
psql -h $RDS_ENDPOINT -p 5432 -U $DB_USER -d $DB_NAME -c "SELECT id, email, name, role FROM users WHERE email LIKE '%@test.com' ORDER BY role;"
"@

$sessionCommand | Out-File -FilePath "session-manager-commands.sh" -Encoding UTF8

Write-Host "`n📝 Created session manager commands: session-manager-commands.sh" -ForegroundColor Green

# Option 3: Direct execution via AWS Lambda (create a temp Lambda)
Write-Host "`n🔄 Option 3: Creating temporary Lambda function for database population..." -ForegroundColor Yellow

$lambdaCode = @"
const { Client } = require('pg');

exports.handler = async (event) => {
    const client = new Client({
        host: '$RDS_ENDPOINT',
        port: 5432,
        database: '$DB_NAME',
        user: '$DB_USER',
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        
        const insertQuery = ``
        INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES
        ('student@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'John Student', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('instructor@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('staff@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('admin@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO NOTHING;
        ``;
        
        const result = await client.query(insertQuery);
        
        const verifyQuery = ``SELECT id, email, name, role FROM users WHERE email LIKE '%@test.com' ORDER BY role;``;
        const users = await client.query(verifyQuery);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Users inserted successfully',
                users: users.rows
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    } finally {
        await client.end();
    }
};
"@

$lambdaCode | Out-File -FilePath "temp-db-populate-lambda.js" -Encoding UTF8

Write-Host "`n📝 Created Lambda function code: temp-db-populate-lambda.js" -ForegroundColor Green

# Summary
Write-Host "`n📊 Summary of Available Options:" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow
Write-Host "1. 📁 SQL File: aws-insert-users.sql (ready to copy-paste)"
Write-Host "2. 🖥️ Session Manager: session-manager-commands.sh" 
Write-Host "3. ⚡ Lambda Function: temp-db-populate-lambda.js"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Choose your preferred method based on your AWS setup"
Write-Host "2. Ensure you have the database password"
Write-Host "3. Execute the commands"
Write-Host "4. Verify users were created"
Write-Host ""
Write-Host "Test User Credentials (all users):" -ForegroundColor Cyan
Write-Host "Password: Mahtabmehek@1337"
Write-Host "Emails: student@test.com, instructor@test.com, staff@test.com, admin@test.com"
