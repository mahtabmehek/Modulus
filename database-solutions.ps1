# ALTERNATIVE DATABASE POPULATION SOLUTIONS
Write-Host "AWS RDS Query Editor Not Available" -ForegroundColor Red
Write-Host "==================================" -ForegroundColor Red
Write-Host "Query Editor only works with Aurora Serverless (Data API enabled)"
Write-Host "Your database is a standard RDS PostgreSQL instance"
Write-Host ""

Write-Host "DATABASE CREDENTIALS:" -ForegroundColor Yellow
Write-Host "Endpoint: modulus-db.cziw68k8m79u.eu-west-2.rds.amazonaws.com"
Write-Host "Database: modulus"
Write-Host "Username: modulus_admin"
Write-Host "Password: [NEED TO RETRIEVE OR RESET]"
Write-Host ""

Write-Host "SOLUTION OPTIONS:" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""

Write-Host "OPTION 1: Reset Database Password" -ForegroundColor Cyan
Write-Host "1. Go to AWS RDS Console"
Write-Host "2. Select your database: modulus-db"
Write-Host "3. Click 'Modify'"
Write-Host "4. Set a new master password"
Write-Host "5. Apply immediately"
Write-Host "6. Use psql or other PostgreSQL client to connect"
Write-Host ""

Write-Host "OPTION 2: Use AWS Systems Manager Session Manager" -ForegroundColor Cyan
Write-Host "1. Launch an EC2 instance in the same VPC as your RDS"
Write-Host "2. Connect via Session Manager"
Write-Host "3. Install PostgreSQL client: sudo yum install postgresql -y"
Write-Host "4. Connect to database and run SQL commands"
Write-Host ""

Write-Host "OPTION 3: Fix the Lambda API and use /admin/seed endpoint" -ForegroundColor Cyan
Write-Host "1. Fix the Lambda routing issue we identified earlier"
Write-Host "2. Use the API endpoint: /admin/seed"
Write-Host "3. This would populate users automatically"
Write-Host ""

Write-Host "OPTION 4: Local PostgreSQL Client (if installed)" -ForegroundColor Cyan
Write-Host "1. Install PostgreSQL client locally"
Write-Host "2. Configure network access (security groups)"
Write-Host "3. Connect directly: psql -h [endpoint] -U modulus_admin -d modulus"
Write-Host ""

Write-Host "RECOMMENDED: OPTION 1 (Reset Password)" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host "This is the quickest solution:"
Write-Host "1. Reset the database password to something you know"
Write-Host "2. Install PostgreSQL client locally"
Write-Host "3. Connect and run the SQL commands"
Write-Host ""

Write-Host "AWS CLI COMMANDS TO HELP:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# Reset database password:"
Write-Host "aws rds modify-db-instance --region eu-west-2 --db-instance-identifier modulus-db --master-user-password 'YourNewPassword123!' --apply-immediately"
Write-Host ""
Write-Host "# Check modification status:"
Write-Host "aws rds describe-db-instances --region eu-west-2 --db-instance-identifier modulus-db --query 'DBInstances[0].DBInstanceStatus'"
Write-Host ""

Write-Host "AFTER RESETTING PASSWORD:" -ForegroundColor Green
Write-Host "1. Install PostgreSQL client (if not installed)"
Write-Host "2. Run: psql -h modulus-db.cziw68k8m79u.eu-west-2.rds.amazonaws.com -p 5432 -U modulus_admin -d modulus"
Write-Host "3. Enter your new password"
Write-Host "4. Copy/paste SQL from COPY-PASTE-THIS.sql"
Write-Host ""

Write-Host "Would you like me to help you reset the database password?" -ForegroundColor Cyan
