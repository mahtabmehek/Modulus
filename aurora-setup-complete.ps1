# Aurora Data API Setup Script
Write-Host "Aurora Data API Setup" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green

$REGION = "eu-west-2"
$CLUSTER_ARN = "arn:aws:rds:eu-west-2:376129881409:cluster:modulus-aurora-cluster"
$SECRET_ARN = "arn:aws:secretsmanager:eu-west-2:376129881409:secret:modulus-aurora-credentials-bvPpka"
$DATABASE = "modulus"

Write-Host "Step 1: Creating database schema..." -ForegroundColor Yellow

# Create users table
$schemaSQL = @'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'staff', 'admin')),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
'@

$schemaResult = aws rds-data execute-statement --region $REGION --resource-arn $CLUSTER_ARN --secret-arn $SECRET_ARN --database $DATABASE --sql $schemaSQL

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database schema created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create schema" -ForegroundColor Red
    Write-Host $schemaResult -ForegroundColor Red
}

Write-Host "`nStep 2: Inserting test users..." -ForegroundColor Yellow

# Insert test users
$usersSQL = @'
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES
('student@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'John Student', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('instructor@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('staff@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;
'@

$usersResult = aws rds-data execute-statement --region $REGION --resource-arn $CLUSTER_ARN --secret-arn $SECRET_ARN --database $DATABASE --sql $usersSQL

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Test users inserted successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to insert users" -ForegroundColor Red
    Write-Host $usersResult -ForegroundColor Red
}

Write-Host "`nStep 3: Verifying users..." -ForegroundColor Yellow

# Verify users were created
$verifySQL = @'
SELECT email, name, role FROM users WHERE email LIKE '%@test.com' ORDER BY role;
'@

$verifyResult = aws rds-data execute-statement --region $REGION --resource-arn $CLUSTER_ARN --secret-arn $SECRET_ARN --database $DATABASE --sql $verifySQL

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Users verified!" -ForegroundColor Green
    $result = $verifyResult | ConvertFrom-Json
    
    Write-Host "`nCreated Users:" -ForegroundColor Cyan
    foreach ($record in $result.records) {
        $email = $record[0].stringValue
        $name = $record[1].stringValue
        $role = $record[2].stringValue
        Write-Host "  - $email ($name) - Role: $role" -ForegroundColor White
    }
} else {
    Write-Host "❌ Failed to verify users" -ForegroundColor Red
    Write-Host $verifyResult -ForegroundColor Red
}

Write-Host "`n🎉 Aurora Serverless Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

Write-Host "`nDatabase Information:" -ForegroundColor Yellow
Write-Host "  Cluster: modulus-aurora-cluster" -ForegroundColor White
Write-Host "  Endpoint: modulus-aurora-cluster.cluster-cziw68k8m79u.eu-west-2.rds.amazonaws.com" -ForegroundColor White
Write-Host "  Database: modulus" -ForegroundColor White
Write-Host "  Username: modulus_admin" -ForegroundColor White
Write-Host "  Password: ModulusAurora2025!" -ForegroundColor White

Write-Host "`nTest Users (Password: Mahtabmehek@1337):" -ForegroundColor Yellow
Write-Host "  - student@test.com (Student)" -ForegroundColor White
Write-Host "  - instructor@test.com (Instructor)" -ForegroundColor White
Write-Host "  - staff@test.com (Staff)" -ForegroundColor White
Write-Host "  - admin@test.com (Admin)" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Update Lambda environment variables with Aurora endpoint" -ForegroundColor White
Write-Host "2. Test AWS RDS Query Editor (now available!)" -ForegroundColor White
Write-Host "3. Test your API with the new database" -ForegroundColor White
Write-Host "4. Delete the old RDS instance when ready" -ForegroundColor White
