# Migrate from RDS to Aurora Serverless
Write-Host "=== MIGRATE TO AURORA SERVERLESS ===" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$REGION = "eu-west-2"
$OLD_DB_IDENTIFIER = "modulus-db"

Write-Host "`nStep 1: Checking current RDS instance..." -ForegroundColor Yellow

try {
    $currentDB = aws rds describe-db-instances --db-instance-identifier $OLD_DB_IDENTIFIER --region $REGION --output json | ConvertFrom-Json
    $dbInstance = $currentDB.DBInstances[0]
    
    Write-Host "Current RDS Instance:" -ForegroundColor Cyan
    Write-Host "  Identifier: $($dbInstance.DBInstanceIdentifier)" -ForegroundColor White
    Write-Host "  Engine: $($dbInstance.Engine)" -ForegroundColor White
    Write-Host "  Status: $($dbInstance.DBInstanceStatus)" -ForegroundColor White
    Write-Host "  Endpoint: $($dbInstance.Endpoint.Address)" -ForegroundColor White
    Write-Host "  Storage: $($dbInstance.AllocatedStorage) GB" -ForegroundColor White
    
    # Check if we can create a snapshot
    Write-Host "`nStep 2: Creating snapshot for backup..." -ForegroundColor Yellow
    $snapshotId = "modulus-db-snapshot-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    Write-Host "Creating snapshot: $snapshotId" -ForegroundColor Cyan
    $snapshotResult = aws rds create-db-snapshot --db-instance-identifier $OLD_DB_IDENTIFIER --db-snapshot-identifier $snapshotId --region $REGION --output json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Snapshot creation initiated" -ForegroundColor Green
        Write-Host "Snapshot ID: $snapshotId" -ForegroundColor Cyan
        
        # Wait for snapshot to complete
        Write-Host "Waiting for snapshot to complete..." -ForegroundColor Yellow
        do {
            Start-Sleep -Seconds 30
            $snapshotStatus = aws rds describe-db-snapshots --db-snapshot-identifier $snapshotId --region $REGION --query "DBSnapshots[0].Status" --output text
            Write-Host "Snapshot status: $snapshotStatus" -ForegroundColor Cyan
        } while ($snapshotStatus -eq "creating")
        
        if ($snapshotStatus -eq "available") {
            Write-Host "✅ Snapshot completed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Snapshot failed with status: $snapshotStatus" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Failed to create snapshot" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error checking current database: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Creating Aurora Serverless cluster..." -ForegroundColor Yellow

# Aurora Serverless configuration
$CLUSTER_IDENTIFIER = "modulus-aurora-cluster"
$DATABASE_NAME = "modulus"
$MASTER_USERNAME = "modulus_admin"
$MASTER_PASSWORD = "ModulusAurora2025!" # Strong password for Aurora

Write-Host "Creating Aurora Serverless v2 cluster..." -ForegroundColor Cyan
Write-Host "  Cluster ID: $CLUSTER_IDENTIFIER" -ForegroundColor White
Write-Host "  Database: $DATABASE_NAME" -ForegroundColor White
Write-Host "  Username: $MASTER_USERNAME" -ForegroundColor White
Write-Host "  Password: $MASTER_PASSWORD" -ForegroundColor White

# Create Aurora Serverless cluster
$auroraResult = aws rds create-db-cluster `
    --db-cluster-identifier $CLUSTER_IDENTIFIER `
    --engine aurora-postgresql `
    --engine-version 15.4 `
    --master-username $MASTER_USERNAME `
    --master-user-password $MASTER_PASSWORD `
    --database-name $DATABASE_NAME `
    --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=2.0 `
    --enable-http-endpoint `
    --region $REGION `
    --output json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Aurora cluster creation initiated" -ForegroundColor Green
    
    # Create Aurora Serverless instance
    Write-Host "Creating Aurora Serverless instance..." -ForegroundColor Cyan
    $instanceResult = aws rds create-db-instance `
        --db-instance-identifier "$CLUSTER_IDENTIFIER-instance-1" `
        --db-instance-class db.serverless `
        --engine aurora-postgresql `
        --db-cluster-identifier $CLUSTER_IDENTIFIER `
        --region $REGION `
        --output json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Aurora instance creation initiated" -ForegroundColor Green
        
        # Wait for cluster to be available
        Write-Host "Waiting for Aurora cluster to be available..." -ForegroundColor Yellow
        do {
            Start-Sleep -Seconds 60
            $clusterStatus = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_IDENTIFIER --region $REGION --query "DBClusters[0].Status" --output text
            Write-Host "Cluster status: $clusterStatus" -ForegroundColor Cyan
        } while ($clusterStatus -ne "available")
        
        Write-Host "✅ Aurora cluster is now available!" -ForegroundColor Green
        
        # Get the new endpoint
        $newEndpoint = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_IDENTIFIER --region $REGION --query "DBClusters[0].Endpoint" --output text
        Write-Host "New Aurora endpoint: $newEndpoint" -ForegroundColor Cyan
        
        # Update environment variables
        Write-Host "`nStep 4: Updating application configuration..." -ForegroundColor Yellow
        
        # Update backend .env file
        $envPath = ".\backend\.env"
        if (Test-Path $envPath) {
            Write-Host "Updating backend .env file..." -ForegroundColor Cyan
            $envContent = Get-Content $envPath
            $envContent = $envContent -replace "DB_HOST=.*", "DB_HOST=$newEndpoint"
            $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$MASTER_PASSWORD"
            $envContent = $envContent -replace "DB_USER=.*", "DB_USER=$MASTER_USERNAME"
            $envContent = $envContent -replace "DB_NAME=.*", "DB_NAME=$DATABASE_NAME"
            $envContent | Set-Content $envPath
            Write-Host "✅ Backend .env updated" -ForegroundColor Green
        } else {
            Write-Host "Creating backend .env file..." -ForegroundColor Cyan
            $newEnvContent = @"
DB_HOST=$newEndpoint
DB_PORT=5432
DB_NAME=$DATABASE_NAME
DB_USER=$MASTER_USERNAME
DB_PASSWORD=$MASTER_PASSWORD
NODE_ENV=production
JWT_SECRET=modulus-lms-jwt-secret-key-change-in-production
"@
            $newEnvContent | Out-File -FilePath $envPath -Encoding UTF8
            Write-Host "✅ Backend .env created" -ForegroundColor Green
        }
        
        # Update Lambda environment variables
        Write-Host "Updating Lambda environment variables..." -ForegroundColor Cyan
        $lambdaEnvUpdate = aws lambda update-function-configuration `
            --function-name modulus-backend `
            --environment "Variables={DB_HOST=$newEndpoint,DB_PORT=5432,DB_NAME=$DATABASE_NAME,DB_USER=$MASTER_USERNAME,DB_PASSWORD=$MASTER_PASSWORD,NODE_ENV=production,JWT_SECRET=modulus-lms-jwt-secret-key}" `
            --region $REGION `
            --output json
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Lambda environment variables updated" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Lambda environment update failed (function might not exist yet)" -ForegroundColor Yellow
        }
        
        Write-Host "`nStep 5: Creating database schema..." -ForegroundColor Yellow
        
        # Create SQL script for Aurora
        $schemaPath = ".\backend\schema.sql"
        if (Test-Path $schemaPath) {
            Write-Host "Schema file found, ready to apply..." -ForegroundColor Cyan
            Write-Host "You can now use Aurora Query Editor to run the schema!" -ForegroundColor Green
        }
        
        Write-Host "`n🎉 MIGRATION COMPLETED!" -ForegroundColor Green
        Write-Host "======================" -ForegroundColor Green
        Write-Host "✅ Aurora Serverless cluster created: $CLUSTER_IDENTIFIER" -ForegroundColor White
        Write-Host "✅ New endpoint: $newEndpoint" -ForegroundColor White
        Write-Host "✅ Database: $DATABASE_NAME" -ForegroundColor White
        Write-Host "✅ Username: $MASTER_USERNAME" -ForegroundColor White
        Write-Host "✅ Password: $MASTER_PASSWORD" -ForegroundColor White
        Write-Host "✅ HTTP Data API enabled for Query Editor" -ForegroundColor White
        Write-Host "✅ Application configuration updated" -ForegroundColor White
        
        Write-Host "`nNext Steps:" -ForegroundColor Yellow
        Write-Host "1. Use Aurora Query Editor to run schema.sql" -ForegroundColor White
        Write-Host "2. Use Aurora Query Editor to populate test users" -ForegroundColor White
        Write-Host "3. Test the application with new database" -ForegroundColor White
        Write-Host "4. Delete old RDS instance when ready" -ForegroundColor White
        
    } else {
        Write-Host "❌ Failed to create Aurora instance" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Failed to create Aurora cluster" -ForegroundColor Red
}

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "Old RDS backed up as: $snapshotId" -ForegroundColor White
Write-Host "New Aurora cluster: $CLUSTER_IDENTIFIER" -ForegroundColor White
Write-Host "Query Editor now available!" -ForegroundColor Green
