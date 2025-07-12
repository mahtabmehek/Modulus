# Database Population Summary - Manual User Creation
Write-Host "Database Population Summary" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

Write-Host "`nSince the API endpoints are having routing issues, here's how to manually populate your database:" -ForegroundColor Yellow
Write-Host ""

Write-Host "OPTION 1: Use the SQL file directly" -ForegroundColor Cyan
Write-Host "1. Connect to your PostgreSQL database"
Write-Host "2. Run the SQL commands from: insert-test-users-final.sql"
Write-Host ""

Write-Host "OPTION 2: Use psql command line" -ForegroundColor Cyan
Write-Host "psql -h [your-db-host] -p 5432 -U [your-db-user] -d [your-db-name] -f insert-test-users-final.sql"
Write-Host ""

Write-Host "OPTION 3: Use AWS RDS Query Editor (if using AWS RDS)" -ForegroundColor Cyan
Write-Host "1. Go to AWS RDS Console"
Write-Host "2. Select your database"
Write-Host "3. Click 'Query Editor'"
Write-Host "4. Copy and paste the SQL commands from insert-test-users-final.sql"
Write-Host ""

Write-Host "TEST USERS THAT WILL BE CREATED:" -ForegroundColor Yellow
Write-Host "================================"
Write-Host "1. Student User:"
Write-Host "   Email: student@test.com"
Write-Host "   Password: Mahtabmehek@1337"
Write-Host "   Role: student"
Write-Host ""
Write-Host "2. Instructor User:"
Write-Host "   Email: instructor@test.com"
Write-Host "   Password: Mahtabmehek@1337"
Write-Host "   Role: instructor"
Write-Host ""
Write-Host "3. Staff User:"
Write-Host "   Email: staff@test.com"
Write-Host "   Password: Mahtabmehek@1337"
Write-Host "   Role: staff"
Write-Host ""
Write-Host "4. Admin User:"
Write-Host "   Email: admin@test.com"
Write-Host "   Password: Mahtabmehek@1337"
Write-Host "   Role: admin"
Write-Host ""

Write-Host "AFTER POPULATING THE DATABASE:" -ForegroundColor Green
Write-Host "=============================="
Write-Host "1. Test login with any of the accounts above"
Write-Host "2. The API URL is: https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"
Write-Host "3. Use POST /auth/login endpoint to test authentication"
Write-Host "4. All users are pre-approved (is_approved = true)"
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Fix the Lambda routing issue for the /admin/seed endpoint"
Write-Host "2. Test the frontend with these user accounts"
Write-Host "3. Verify all user roles work correctly"
Write-Host ""

Write-Host "The password hash used is:" -ForegroundColor Gray
Write-Host '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW' -ForegroundColor Gray
