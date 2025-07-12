# Direct AWS CLI Database Population
Write-Host "Direct AWS CLI Database Population" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# RDS connection details from previous detection
$RDS_ENDPOINT = "modulus-db.cziw68k8m79u.eu-west-2.rds.amazonaws.com"
$DB_NAME = "modulus"
$DB_USER = "modulus_admin"
$REGION = "eu-west-2"

Write-Host "`nAttempting direct database population via AWS CLI..." -ForegroundColor Yellow

# Method 1: Try RDS Data API (for Aurora Serverless)
Write-Host "`n🔄 Method 1: Checking RDS Data API availability..." -ForegroundColor Cyan

try {
    # Check if this is an Aurora cluster that supports Data API
    $clusters = aws rds describe-db-clusters --region $REGION --output json 2>$null
    if ($LASTEXITCODE -eq 0) {
        $clusterData = $clusters | ConvertFrom-Json
        if ($clusterData.DBClusters.Count -gt 0) {
            $cluster = $clusterData.DBClusters[0]
            Write-Host "✅ Aurora cluster found: $($cluster.DBClusterIdentifier)" -ForegroundColor Green
            
            # Try to execute SQL via RDS Data API
            Write-Host "Attempting to execute SQL via RDS Data API..." -ForegroundColor Yellow
            
            $sqlStatement = "INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES ('student@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'John Student', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('instructor@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('staff@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('admin@test.com', '`$2b`$12`$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (email) DO NOTHING;"
            
            $dataApiResult = aws rds-data execute-statement --region $REGION --resource-arn $cluster.DBClusterArn --database $DB_NAME --sql $sqlStatement --output json 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Successfully executed via RDS Data API!" -ForegroundColor Green
                $result = $dataApiResult | ConvertFrom-Json
                Write-Host "Execution result: $($result.numberOfRecordsUpdated) records affected" -ForegroundColor Cyan
                
                # Verify users were created
                $verifyQuery = "SELECT id, email, name, role FROM users WHERE email IN ('student@test.com', 'instructor@test.com', 'staff@test.com', 'admin@test.com') ORDER BY role;"
                $verifyResult = aws rds-data execute-statement --region $REGION --resource-arn $cluster.DBClusterArn --database $DB_NAME --sql $verifyQuery --output json
                
                if ($LASTEXITCODE -eq 0) {
                    $users = ($verifyResult | ConvertFrom-Json).records
                    Write-Host "`n✅ Users created successfully:" -ForegroundColor Green
                    foreach ($user in $users) {
                        Write-Host "  - $($user[1].stringValue) ($($user[2].stringValue)) - Role: $($user[3].stringValue)" -ForegroundColor White
                    }
                }
                
                Write-Host "`n🎉 Database population completed via RDS Data API!" -ForegroundColor Green
                exit 0
            } else {
                Write-Host "❌ RDS Data API execution failed (might not be enabled)" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "ℹ️ RDS Data API not available (standard RDS instance)" -ForegroundColor Gray
}

# Method 2: Use AWS Systems Manager Session Manager + psql
Write-Host "`n🔄 Method 2: Using Systems Manager Session Manager..." -ForegroundColor Cyan

# Check for EC2 instances that could be used for Session Manager
try {
    Write-Host "Checking for EC2 instances with Session Manager..." -ForegroundColor Yellow
    $instances = aws ec2 describe-instances --region $REGION --filters "Name=state,Values=running" --query "Reservations[*].Instances[*].[InstanceId,Tags[?Key=='Name'].Value|[0]]" --output table 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $instances -notlike "*None*") {
        Write-Host "Available EC2 instances for Session Manager:" -ForegroundColor Cyan
        Write-Host $instances
        
        # Try to find the first running instance
        $instanceData = aws ec2 describe-instances --region $REGION --filters "Name=state,Values=running" --query "Reservations[0].Instances[0].InstanceId" --output text 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $instanceData -ne "None") {
            Write-Host "`nFound instance: $instanceData" -ForegroundColor Green
            Write-Host "You can manually execute via Session Manager:" -ForegroundColor Yellow
            Write-Host "aws ssm start-session --target $instanceData --region $REGION" -ForegroundColor White
            Write-Host "Then run psql commands on the instance." -ForegroundColor White
        }
    } else {
        Write-Host "❌ No running EC2 instances found for Session Manager" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not check EC2 instances" -ForegroundColor Red
}

# Method 3: Direct execution attempt (if psql is available locally)
Write-Host "`n🔄 Method 3: Direct local execution..." -ForegroundColor Cyan

# Check if psql is available locally
try {
    $psqlVersion = psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL client (psql) found locally" -ForegroundColor Green
        Write-Host "Version: $psqlVersion" -ForegroundColor Cyan
        
        # Prompt for password
        Write-Host "`nTo execute directly, you'll need the database password." -ForegroundColor Yellow
        Write-Host "Run this command with your password:" -ForegroundColor White
        Write-Host "set PGPASSWORD=your_password && psql -h $RDS_ENDPOINT -p 5432 -U $DB_USER -d $DB_NAME -f aws-rds-users.sql" -ForegroundColor Cyan
        
        # Alternative: Create a .pgpass file
        Write-Host "`nOr create a .pgpass file in your home directory with:" -ForegroundColor White
        Write-Host "$RDS_ENDPOINT`:5432:$DB_NAME`:$DB_USER`:your_password" -ForegroundColor Cyan
        Write-Host "Then run: psql -h $RDS_ENDPOINT -p 5432 -U $DB_USER -d $DB_NAME -f aws-rds-users.sql" -ForegroundColor Cyan
        
    } else {
        Write-Host "❌ PostgreSQL client (psql) not found locally" -ForegroundColor Yellow
        Write-Host "Install PostgreSQL client or use AWS RDS Query Editor" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Could not check for psql" -ForegroundColor Red
}

# Method 4: Create a Lambda function to execute the SQL
Write-Host "`n🔄 Method 4: Creating temporary Lambda function..." -ForegroundColor Cyan

$lambdaFunctionName = "temp-db-populate-$(Get-Random -Minimum 1000 -Maximum 9999)"

# Create a simple Lambda function that connects to RDS and inserts users
$lambdaCode = @'
const { Client } = require('pg');

exports.handler = async (event) => {
    const client = new Client({
        host: process.env.DB_HOST,
        port: 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log('Connected to database');
        
        const insertQuery = `
        INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES
        ('student@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'John Student', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('instructor@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('staff@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('admin@test.com', '$2b$12$uWXRD6Vkm3IQTqLeusmQs.EdYfPpNK5ajd8c4HiKNPNwFJaP3hhjW', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO NOTHING;
        `;
        
        const result = await client.query(insertQuery);
        console.log('Insert result:', result.rowCount);
        
        const verifyQuery = `SELECT id, email, name, role FROM users WHERE email IN ('student@test.com', 'instructor@test.com', 'staff@test.com', 'admin@test.com') ORDER BY role;`;
        const users = await client.query(verifyQuery);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Users inserted successfully',
                rowsAffected: result.rowCount,
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
'@

# Save Lambda code to file
$lambdaCode | Out-File -FilePath "temp-lambda-populate.js" -Encoding UTF8

Write-Host "📝 Created Lambda function code: temp-lambda-populate.js" -ForegroundColor Green
Write-Host "To deploy and execute this Lambda:" -ForegroundColor Yellow
Write-Host "1. Package the Lambda with pg dependency" -ForegroundColor White
Write-Host "2. Set environment variables: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD" -ForegroundColor White
Write-Host "3. Deploy and invoke the function" -ForegroundColor White

Write-Host "`n📋 Summary:" -ForegroundColor Yellow
Write-Host "==========" -ForegroundColor Yellow
Write-Host "❌ RDS Data API: Not available (standard RDS)" -ForegroundColor Red
Write-Host "⚠️  Session Manager: Requires EC2 instance" -ForegroundColor Yellow
Write-Host "⚠️  Local psql: Requires PostgreSQL client + password" -ForegroundColor Yellow
Write-Host "⚠️  Lambda: Requires deployment + environment variables" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 RECOMMENDED: Use AWS RDS Query Editor (browser)" -ForegroundColor Green
Write-Host "   - No additional tools required" -ForegroundColor Green
Write-Host "   - Secure connection through AWS Console" -ForegroundColor Green
Write-Host "   - Copy/paste SQL from: aws-rds-users.sql" -ForegroundColor Green
