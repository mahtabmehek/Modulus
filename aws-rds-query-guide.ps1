# AWS RDS Query Editor - Step-by-Step Guide
Write-Host "AWS RDS Query Editor Setup" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

Write-Host "`nSTEP-BY-STEP INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "===========================" 

Write-Host "`n1. Open AWS Console" -ForegroundColor Cyan
Write-Host "   - Go to https://aws.amazon.com/console/"
Write-Host "   - Sign in to your AWS account"

Write-Host "`n2. Navigate to RDS" -ForegroundColor Cyan
Write-Host "   - In the AWS Console, search for 'RDS'"
Write-Host "   - Click on 'RDS' service"

Write-Host "`n3. Find Your Database" -ForegroundColor Cyan
Write-Host "   - In the left sidebar, click 'Databases'"
Write-Host "   - Look for your PostgreSQL database instance"
Write-Host "   - It should be named something like 'modulus-db' or similar"

Write-Host "`n4. Open Query Editor" -ForegroundColor Cyan
Write-Host "   - Click on your database name"
Write-Host "   - In the database details page, click 'Query Editor' tab"
Write-Host "   - Or click 'Actions' -> 'Query'"

Write-Host "`n5. Connect to Database" -ForegroundColor Cyan
Write-Host "   - You'll see a connection dialog"
Write-Host "   - Select 'Connect with a username and password'"
Write-Host "   - Enter your database credentials:"
Write-Host "     * Username: [your-db-username]"
Write-Host "     * Password: [your-db-password]"
Write-Host "   - Click 'Connect'"

Write-Host "`n6. Execute SQL Commands" -ForegroundColor Yellow
Write-Host "   Copy and paste the following SQL commands into the Query Editor:"
Write-Host "   ================================================================"

# Read and display the SQL content
$sqlContent = Get-Content "insert-test-users-final.sql" -Raw
Write-Host $sqlContent -ForegroundColor White

Write-Host "`n   ================================================================"
Write-Host "   After pasting, click 'Run' to execute the commands"

Write-Host "`n7. Verify Results" -ForegroundColor Green
Write-Host "   - The query should return 4 rows showing the created users"
Write-Host "   - You should see: student, instructor, staff, and admin users"
Write-Host "   - All should have 'is_approved' = true"

Write-Host "`nUSER CREDENTIALS FOR TESTING:" -ForegroundColor Yellow
Write-Host "=============================="
Write-Host "After running the SQL, you can test login with these accounts:"
Write-Host ""
Write-Host "Student Account:"
Write-Host "  Email: student@test.com"
Write-Host "  Password: Mahtabmehek@1337"
Write-Host "  Role: student"
Write-Host ""
Write-Host "Instructor Account:"
Write-Host "  Email: instructor@test.com"
Write-Host "  Password: Mahtabmehek@1337"
Write-Host "  Role: instructor"
Write-Host ""
Write-Host "Staff Account:"
Write-Host "  Email: staff@test.com"
Write-Host "  Password: Mahtabmehek@1337"
Write-Host "  Role: staff"
Write-Host ""
Write-Host "Admin Account:"
Write-Host "  Email: admin@test.com"
Write-Host "  Password: Mahtabmehek@1337"
Write-Host "  Role: admin"

Write-Host "`nTROUBLESHOoting TIPS:" -ForegroundColor Red
Write-Host "===================="
Write-Host "- If Query Editor doesn't appear, your database might not support it"
Write-Host "- Make sure your database is in 'Available' status"
Write-Host "- Check your database security groups allow connections"
Write-Host "- If you get permission errors, verify your IAM permissions"
Write-Host "- Alternative: Use psql or any PostgreSQL client to connect directly"

Write-Host "`nNEXT STEPS AFTER POPULATION:" -ForegroundColor Green
Write-Host "============================="
Write-Host "1. Test the login endpoint: POST /api/auth/login"
Write-Host "2. Use any of the 4 accounts above"
Write-Host "3. API Base URL: https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api"
Write-Host "4. Verify JWT tokens are returned successfully"

Write-Host "`nDatabase population ready! Follow the steps above to complete the setup." -ForegroundColor Green
