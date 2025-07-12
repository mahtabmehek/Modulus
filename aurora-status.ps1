# Aurora Status Monitor
Write-Host "Aurora Serverless Status Monitor" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

$REGION = "eu-west-2"
$CLUSTER_ID = "modulus-aurora-cluster"

Write-Host "Monitoring Aurora cluster creation..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes..." -ForegroundColor Cyan
Write-Host ""

$maxAttempts = 30
$attempt = 0

do {
    $attempt++
    Write-Host "[$attempt/$maxAttempts] Checking status..." -ForegroundColor Cyan
    
    try {
        $status = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $REGION --query "DBClusters[0].Status" --output text
        $endpoint = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $REGION --query "DBClusters[0].Endpoint" --output text
        
        Write-Host "Cluster Status: $status" -ForegroundColor White
        if ($endpoint -and $endpoint -ne "None") {
            Write-Host "Endpoint: $endpoint" -ForegroundColor White
        }
        
        if ($status -eq "available") {
            Write-Host "✅ Aurora cluster is ready!" -ForegroundColor Green
            break
        }
        
        Write-Host "Waiting 20 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 20
        
    } catch {
        Write-Host "Error checking status: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds 10
    }
    
} while ($attempt -lt $maxAttempts)

if ($status -eq "available") {
    Write-Host "`n🎉 Aurora Serverless is ready!" -ForegroundColor Green
    
    # Get cluster details
    $clusterArn = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $REGION --query "DBClusters[0].DBClusterArn" --output text
    $endpoint = aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $REGION --query "DBClusters[0].Endpoint" --output text
    
    Write-Host "`nCluster Details:" -ForegroundColor Yellow
    Write-Host "  Identifier: $CLUSTER_ID" -ForegroundColor White
    Write-Host "  Endpoint: $endpoint" -ForegroundColor White
    Write-Host "  ARN: $clusterArn" -ForegroundColor White
    Write-Host "  Database: modulus" -ForegroundColor White
    Write-Host "  Username: modulus_admin" -ForegroundColor White
    Write-Host "  Password: ModulusAurora2025!" -ForegroundColor White
    
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "1. Create database schema" -ForegroundColor White
    Write-Host "2. Populate test users using Data API" -ForegroundColor White
    Write-Host "3. Update backend configuration" -ForegroundColor White
    Write-Host "4. Test Query Editor functionality" -ForegroundColor White
    
} else {
    Write-Host "❌ Aurora cluster creation timed out or failed" -ForegroundColor Red
    Write-Host "Current status: $status" -ForegroundColor Red
    Write-Host "Please check the AWS Console for more details" -ForegroundColor Yellow
}
