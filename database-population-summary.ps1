# Final Database Population Solution
Write-Host "=== MODULUS DATABASE POPULATION ===" -ForegroundColor Green
Write-Host ""

Write-Host "DATABASE DETECTED:" -ForegroundColor Yellow
Write-Host "  Endpoint: modulus-db.cziw68k8m79u.eu-west-2.rds.amazonaws.com"
Write-Host "  Database: modulus"
Write-Host "  User: modulus_admin"
Write-Host ""

Write-Host "SOLUTION: Copy these SQL commands and run them in AWS RDS Query Editor" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Display the exact SQL commands to copy
Write-Host "-- COPY EVERYTHING BELOW THIS LINE --" -ForegroundColor White
Write-Host ""
Write-Host "INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES"
Write-Host "('student@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'John Student', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),"
Write-Host "('instructor@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),"
Write-Host "('staff@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),"
Write-Host "('admin@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
Write-Host "ON CONFLICT (email) DO NOTHING;"
Write-Host ""
Write-Host "SELECT id, email, name, role, is_approved FROM users WHERE email LIKE '%@test.com' ORDER BY role;"
Write-Host ""
Write-Host "-- COPY EVERYTHING ABOVE THIS LINE --" -ForegroundColor White
Write-Host ""

Write-Host "STEPS TO EXECUTE:" -ForegroundColor Yellow
Write-Host "1. Go to: https://console.aws.amazon.com/rds/" -ForegroundColor White
Write-Host "2. Click on database: modulus-db" -ForegroundColor White  
Write-Host "3. Click 'Query Editor' tab" -ForegroundColor White
Write-Host "4. Connect with your database credentials" -ForegroundColor White
Write-Host "5. Copy and paste the SQL commands above" -ForegroundColor White
Write-Host "6. Click 'Run'" -ForegroundColor White
Write-Host ""

Write-Host "RESULT:" -ForegroundColor Green
Write-Host "You will have 4 test users created:" -ForegroundColor White
Write-Host "  student@test.com (password: Mahtabmehek@1337)"
Write-Host "  instructor@test.com (password: Mahtabmehek@1337)"
Write-Host "  staff@test.com (password: Mahtabmehek@1337)" 
Write-Host "  admin@test.com (password: Mahtabmehek@1337)"
Write-Host ""

Write-Host "TEST YOUR API:" -ForegroundColor Cyan
Write-Host "After populating the database, test login at:"
Write-Host "https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api/auth/login"
Write-Host ""

# Also create a clean SQL file for easy copy-paste
$cleanSql = @"
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES
('student@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'John Student', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('instructor@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('staff@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

SELECT id, email, name, role, is_approved FROM users WHERE email LIKE '%@test.com' ORDER BY role;
"@

$cleanSql | Out-File -FilePath "COPY-PASTE-THIS.sql" -Encoding UTF8

Write-Host "ALSO CREATED FILE: COPY-PASTE-THIS.sql" -ForegroundColor Green
Write-Host "You can open this file and copy the contents to paste into AWS RDS Query Editor" -ForegroundColor White
