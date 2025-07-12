# Create Aurora Serverless Database
Write-Host "Creating Aurora Serverless Database" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

$REGION = "eu-west-2"
$CLUSTER_ID = "modulus-aurora"
$DB_NAME = "modulus"
$USERNAME = "modulus_admin"
$PASSWORD = "ModulusAurora2025!"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Cluster: $CLUSTER_ID"
Write-Host "  Database: $DB_NAME"
Write-Host "  Username: $USERNAME"
Write-Host "  Password: $PASSWORD"
Write-Host "  Region: $REGION"
Write-Host ""

Write-Host "Step 1: Creating Aurora Serverless cluster..." -ForegroundColor Yellow

# Create Aurora cluster
aws rds create-db-cluster --db-cluster-identifier $CLUSTER_ID --engine aurora-postgresql --engine-version 15.4 --master-username $USERNAME --master-user-password $PASSWORD --database-name $DB_NAME --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=2.0 --enable-http-endpoint --region $REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cluster creation started" -ForegroundColor Green
    
    Write-Host "Step 2: Creating Aurora instance..." -ForegroundColor Yellow
    
    # Create instance
    aws rds create-db-instance --db-instance-identifier "$CLUSTER_ID-instance" --db-instance-class db.serverless --engine aurora-postgresql --db-cluster-identifier $CLUSTER_ID --region $REGION
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Instance creation started" -ForegroundColor Green
        
        Write-Host "Step 3: Waiting for cluster to be ready..." -ForegroundColor Yellow
        Write-Host "(This takes 5-10 minutes - please wait)" -ForegroundColor Cyan
        
        # Wait for cluster
        $ready = $false
        $attempts = 0
        while (-not $ready -and $attempts -lt 30) {
            Start-Sleep -Seconds 30
            $attempts++
            
            $status = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $REGION --query "DBClusters[0].Status" --output text
            Write-Host "[$attempts/30] Status: $status" -ForegroundColor Gray
            
            if ($status -eq "available") {
                $ready = $true
            }
        }
        
        if ($ready) {
            Write-Host "✅ Aurora cluster is ready!" -ForegroundColor Green
            
            # Get endpoint
            $endpoint = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $REGION --query "DBClusters[0].Endpoint" --output text
            $clusterArn = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $REGION --query "DBClusters[0].DBClusterArn" --output text
            
            Write-Host ""
            Write-Host "🎉 SUCCESS!" -ForegroundColor Green
            Write-Host "==========" -ForegroundColor Green
            Write-Host "Cluster: $CLUSTER_ID"
            Write-Host "Endpoint: $endpoint"
            Write-Host "Database: $DB_NAME"
            Write-Host "Username: $USERNAME"
            Write-Host "Password: $PASSWORD"
            Write-Host "ARN: $clusterArn"
            Write-Host "Query Editor: ✅ Available"
            Write-Host ""
            
            # Update backend .env
            Write-Host "Updating backend configuration..." -ForegroundColor Yellow
            
            $envContent = @"
DB_HOST=$endpoint
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$USERNAME
DB_PASSWORD=$PASSWORD
NODE_ENV=production
JWT_SECRET=modulus-lms-jwt-secret-key
AWS_REGION=$REGION
DB_CLUSTER_ARN=$clusterArn
"@
            
            $envContent | Out-File -FilePath ".\backend\.env" -Encoding UTF8
            Write-Host "✅ Backend .env updated" -ForegroundColor Green
            
            Write-Host ""
            Write-Host "NEXT STEPS:" -ForegroundColor Yellow
            Write-Host "1. Go to: https://console.aws.amazon.com/rds/"
            Write-Host "2. Click: $CLUSTER_ID"
            Write-Host "3. Click: Query Editor"
            Write-Host "4. Run schema and populate users"
            Write-Host ""
            
        } else {
            Write-Host "❌ Cluster creation timed out" -ForegroundColor Red
            Write-Host "Check AWS Console for status" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Instance creation failed" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Cluster creation failed" -ForegroundColor Red
}
