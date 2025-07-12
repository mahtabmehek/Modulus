# Simple Aurora Serverless Creation (without migration)
Write-Host "=== CREATE AURORA SERVERLESS DATABASE ===" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$REGION = "eu-west-2"
$CLUSTER_IDENTIFIER = "modulus-aurora-cluster"
$DATABASE_NAME = "modulus"
$MASTER_USERNAME = "modulus_admin"
$MASTER_PASSWORD = "ModulusAurora2025!"

Write-Host "Creating Aurora Serverless cluster..." -ForegroundColor Yellow
Write-Host "  Cluster ID: $CLUSTER_IDENTIFIER" -ForegroundColor Cyan
Write-Host "  Database: $DATABASE_NAME" -ForegroundColor Cyan
Write-Host "  Username: $MASTER_USERNAME" -ForegroundColor Cyan
Write-Host "  Password: $MASTER_PASSWORD" -ForegroundColor Cyan
Write-Host "  Region: $REGION" -ForegroundColor Cyan

# Create Aurora Serverless v2 cluster with HTTP endpoint enabled
Write-Host "`nCreating cluster..." -ForegroundColor Yellow

$clusterCommand = @"
aws rds create-db-cluster \
    --db-cluster-identifier $CLUSTER_IDENTIFIER \
    --engine aurora-postgresql \
    --engine-version 15.4 \
    --master-username $MASTER_USERNAME \
    --master-user-password $MASTER_PASSWORD \
    --database-name $DATABASE_NAME \
    --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=2.0 \
    --enable-http-endpoint \
    --region $REGION \
    --output json
"@

Write-Host "Executing: $clusterCommand" -ForegroundColor Gray

$result = Invoke-Expression $clusterCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Aurora cluster creation initiated" -ForegroundColor Green
    
    # Create instance
    Write-Host "`nCreating Aurora instance..." -ForegroundColor Yellow
    
    $instanceCommand = @"
aws rds create-db-instance \
    --db-instance-identifier "$CLUSTER_IDENTIFIER-instance-1" \
    --db-instance-class db.serverless \
    --engine aurora-postgresql \
    --db-cluster-identifier $CLUSTER_IDENTIFIER \
    --region $REGION \
    --output json
"@
    
    $instanceResult = Invoke-Expression $instanceCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Aurora instance creation initiated" -ForegroundColor Green
        
        Write-Host "`nWaiting for cluster to become available..." -ForegroundColor Yellow
        Write-Host "(This may take 5-10 minutes)" -ForegroundColor Cyan
        
        $attempts = 0
        $maxAttempts = 20
        
        do {
            Start-Sleep -Seconds 30
            $attempts++
            
            try {
                $status = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_IDENTIFIER --region $REGION --query "DBClusters[0].Status" --output text
                Write-Host "[$attempts/$maxAttempts] Cluster status: $status" -ForegroundColor Cyan
                
                if ($status -eq "available") {
                    break
                }
            } catch {
                Write-Host "Checking status..." -ForegroundColor Gray
            }
            
        } while ($attempts -lt $maxAttempts)
        
        if ($attempts -ge $maxAttempts) {
            Write-Host "⚠️ Cluster creation taking longer than expected" -ForegroundColor Yellow
            Write-Host "Check AWS Console for status: https://console.aws.amazon.com/rds/" -ForegroundColor White
        } else {
            Write-Host "✅ Aurora cluster is available!" -ForegroundColor Green
            
            # Get cluster details
            $clusterInfo = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_IDENTIFIER --region $REGION --output json | ConvertFrom-Json
            $cluster = $clusterInfo.DBClusters[0]
            
            Write-Host "`n🎉 AURORA SERVERLESS CREATED!" -ForegroundColor Green
            Write-Host "=============================" -ForegroundColor Green
            Write-Host "Cluster ARN: $($cluster.DBClusterArn)" -ForegroundColor White
            Write-Host "Endpoint: $($cluster.Endpoint)" -ForegroundColor White
            Write-Host "Reader Endpoint: $($cluster.ReaderEndpoint)" -ForegroundColor White
            Write-Host "Database: $DATABASE_NAME" -ForegroundColor White
            Write-Host "Username: $MASTER_USERNAME" -ForegroundColor White
            Write-Host "Password: $MASTER_PASSWORD" -ForegroundColor White
            Write-Host "HTTP Data API: ✅ Enabled" -ForegroundColor Green
            
            # Update backend configuration
            Write-Host "`nUpdating backend configuration..." -ForegroundColor Yellow
            
            $envContent = @"
# Aurora Serverless Database Configuration
DB_HOST=$($cluster.Endpoint)
DB_PORT=5432
DB_NAME=$DATABASE_NAME
DB_USER=$MASTER_USERNAME
DB_PASSWORD=$MASTER_PASSWORD
NODE_ENV=production
JWT_SECRET=modulus-lms-jwt-secret-key-change-in-production

# Aurora Serverless specific
DB_CLUSTER_ARN=$($cluster.DBClusterArn)
DB_SECRET_ARN=
AWS_REGION=$REGION
"@
            
            $envContent | Out-File -FilePath ".\backend\.env" -Encoding UTF8
            Write-Host "✅ Backend .env file updated" -ForegroundColor Green
            
            # Create Aurora-specific connection helper
            $auroraHelper = @'
// Aurora Serverless connection helper
const { RDSDataService } = require('@aws-sdk/client-rds-data');

class AuroraConnection {
    constructor() {
        this.rdsData = new RDSDataService({ region: process.env.AWS_REGION || 'eu-west-2' });
        this.clusterArn = process.env.DB_CLUSTER_ARN;
        this.secretArn = process.env.DB_SECRET_ARN;
        this.database = process.env.DB_NAME;
    }
    
    async executeStatement(sql, parameters = []) {
        const params = {
            resourceArn: this.clusterArn,
            secretArn: this.secretArn,
            database: this.database,
            sql: sql
        };
        
        if (parameters.length > 0) {
            params.parameters = parameters;
        }
        
        return await this.rdsData.executeStatement(params);
    }
    
    async batchExecuteStatement(sql, parameterSets = []) {
        return await this.rdsData.batchExecuteStatement({
            resourceArn: this.clusterArn,
            secretArn: this.secretArn,
            database: this.database,
            sql: sql,
            parameterSets: parameterSets
        });
    }
}

module.exports = AuroraConnection;
'@
            
            $auroraHelper | Out-File -FilePath ".\backend\aurora-connection.js" -Encoding UTF8
            Write-Host "✅ Aurora connection helper created" -ForegroundColor Green
            
            Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Yellow
            Write-Host "1. Go to AWS RDS Console: https://console.aws.amazon.com/rds/" -ForegroundColor White
            Write-Host "2. Click on cluster: $CLUSTER_IDENTIFIER" -ForegroundColor White
            Write-Host "3. Click 'Query Editor' tab (now available!)" -ForegroundColor White
            Write-Host "4. Connect and run schema.sql" -ForegroundColor White
            Write-Host "5. Populate test users using Query Editor" -ForegroundColor White
            Write-Host "6. Update Lambda function environment variables" -ForegroundColor White
            
        }
        
    } else {
        Write-Host "❌ Failed to create Aurora instance" -ForegroundColor Red
        Write-Host "Error: $instanceResult" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ Failed to create Aurora cluster" -ForegroundColor Red
    Write-Host "Error: $result" -ForegroundColor Red
}
