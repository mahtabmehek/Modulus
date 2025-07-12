# Direct AWS CLI Database Execution
Write-Host "Direct AWS CLI Database Execution" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$RDS_ENDPOINT = "modulus-db.cziw68k8m79u.eu-west-2.rds.amazonaws.com"
$DB_NAME = "modulus"
$DB_USER = "modulus_admin"
$REGION = "eu-west-2"

Write-Host "Target Database: $RDS_ENDPOINT" -ForegroundColor Cyan
Write-Host "Database Name: $DB_NAME" -ForegroundColor Cyan
Write-Host "User: $DB_USER" -ForegroundColor Cyan

# Method 1: Try to execute via AWS CLI with RDS Data API
Write-Host "`nAttempting RDS Data API execution..." -ForegroundColor Yellow

# Check if this is Aurora cluster
$clusterArn = ""
try {
    $clusters = aws rds describe-db-clusters --region $REGION --output json 2>$null | ConvertFrom-Json
    if ($clusters.DBClusters.Count -gt 0) {
        $clusterArn = $clusters.DBClusters[0].DBClusterArn
        Write-Host "Found Aurora cluster: $clusterArn" -ForegroundColor Green
        
        # Try single user insert to test
        Write-Host "Testing with single user insert..." -ForegroundColor Yellow
        $testSql = "INSERT INTO users (email, password_hash, name, role, is_approved) VALUES ('test@example.com', 'hash123', 'Test User', 'student', true);"
        
        $result = aws rds-data execute-statement --region $REGION --resource-arn $clusterArn --database $DB_NAME --sql $testSql 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ RDS Data API working!" -ForegroundColor Green
            # Now insert all users
            Write-Host "Inserting all test users..." -ForegroundColor Yellow
            
            $users = @(
                @{email="student@test.com"; name="John Student"; role="student"},
                @{email="instructor@test.com"; name="Jane Instructor"; role="instructor"},
                @{email="staff@test.com"; name="Mike Staff"; role="staff"},
                @{email="admin@test.com"; name="Sarah Admin"; role="admin"}
            )
            
            $hash = '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW'
            
            foreach ($user in $users) {
                $sql = "INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES ('$($user.email)', '$hash', '$($user.name)', '$($user.role)', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (email) DO NOTHING;"
                Write-Host "Inserting $($user.email)..." -ForegroundColor Cyan
                
                $insertResult = aws rds-data execute-statement --region $REGION --resource-arn $clusterArn --database $DB_NAME --sql $sql
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ $($user.email) inserted" -ForegroundColor Green
                } else {
                    Write-Host "❌ Failed to insert $($user.email)" -ForegroundColor Red
                }
            }
            
            # Verify users
            Write-Host "`nVerifying users..." -ForegroundColor Yellow
            $verifyResult = aws rds-data execute-statement --region $REGION --resource-arn $clusterArn --database $DB_NAME --sql "SELECT email, name, role FROM users WHERE email LIKE '%@test.com';"
            Write-Host "Verification result: $verifyResult" -ForegroundColor Cyan
            
        } else {
            Write-Host "❌ RDS Data API not available: $result" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ No Aurora clusters found - Data API not available" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not access RDS Data API: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 2: Create a simple Lambda to execute this
Write-Host "`nMethod 2: Creating and deploying Lambda..." -ForegroundColor Yellow

# Create package.json for Lambda
$packageJson = @'
{
  "name": "db-populate",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "pg": "^8.11.0"
  }
}
'@

$packageJson | Out-File -FilePath "lambda-package.json" -Encoding UTF8

# Create Lambda function
$lambdaCode = @'
const { Client } = require('pg');

exports.handler = async (event) => {
    const client = new Client({
        host: 'modulus-db.cziw68k8m79u.eu-west-2.rds.amazonaws.com',
        port: 5432,
        database: 'modulus',
        user: 'modulus_admin',
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        
        const users = [
            { email: 'student@test.com', name: 'John Student', role: 'student' },
            { email: 'instructor@test.com', name: 'Jane Instructor', role: 'instructor' },
            { email: 'staff@test.com', name: 'Mike Staff', role: 'staff' },
            { email: 'admin@test.com', name: 'Sarah Admin', role: 'admin' }
        ];
        
        const hash = '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW';
        
        for (const user of users) {
            const sql = `INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) 
                        VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
                        ON CONFLICT (email) DO NOTHING`;
            
            await client.query(sql, [user.email, hash, user.name, user.role]);
            console.log(`Inserted ${user.email}`);
        }
        
        const result = await client.query(`SELECT email, name, role FROM users WHERE email LIKE '%@test.com'`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Users created successfully',
                users: result.rows
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
'@

$lambdaCode | Out-File -FilePath "lambda-db-populate.js" -Encoding UTF8

Write-Host "📝 Created Lambda files:" -ForegroundColor Green
Write-Host "  - lambda-package.json" -ForegroundColor White
Write-Host "  - lambda-db-populate.js" -ForegroundColor White

Write-Host "`nTo deploy and run the Lambda manually:" -ForegroundColor Yellow
Write-Host "1. Create deployment package: npm install && zip -r function.zip ." -ForegroundColor White
Write-Host "2. Create Lambda function with RDS access" -ForegroundColor White
Write-Host "3. Set DB_PASSWORD environment variable" -ForegroundColor White
Write-Host "4. Invoke the function" -ForegroundColor White

# Method 3: Direct psql attempt if available
Write-Host "`nMethod 3: Checking for local PostgreSQL..." -ForegroundColor Yellow

try {
    $psqlCheck = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCheck) {
        Write-Host "✅ PostgreSQL client found!" -ForegroundColor Green
        Write-Host "You can execute directly with:" -ForegroundColor Cyan
        Write-Host "set PGPASSWORD=your_db_password" -ForegroundColor White
        Write-Host "psql -h $RDS_ENDPOINT -p 5432 -U $DB_USER -d $DB_NAME -c ""INSERT INTO users...""" -ForegroundColor White
    } else {
        Write-Host "❌ PostgreSQL client not found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ PostgreSQL client not available" -ForegroundColor Red
}

Write-Host "`n💡 FASTEST SOLUTION:" -ForegroundColor Green
Write-Host "Since direct CLI execution is complex, use AWS RDS Query Editor:" -ForegroundColor Yellow
Write-Host "1. Open: https://console.aws.amazon.com/rds/" -ForegroundColor White
Write-Host "2. Click: modulus-db" -ForegroundColor White
Write-Host "3. Click: Query Editor" -ForegroundColor White
Write-Host "4. Copy/paste from: aws-rds-users.sql" -ForegroundColor White
Write-Host "5. Click: Run" -ForegroundColor White

Write-Host "`nThis will populate your database with 4 test users immediately!" -ForegroundColor Green
