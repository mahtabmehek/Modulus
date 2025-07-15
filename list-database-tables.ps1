# PowerShell script to list database tables in Aurora PostgreSQL
# This script connects to the Modulus Aurora cluster and lists all tables

$ErrorActionPreference = "Stop"

# Aurora cluster details
$ClusterEndpoint = "modulus-aurora-cluster.cluster-cziw68k8m79u.eu-west-2.rds.amazonaws.com"
$DatabaseName = "modulus"
$Username = "modulus_admin"

Write-Host "Connecting to Modulus Aurora PostgreSQL Database..." -ForegroundColor Cyan
Write-Host "Cluster: $ClusterEndpoint" -ForegroundColor Gray
Write-Host "Database: $DatabaseName" -ForegroundColor Gray

# Try to get database password from AWS Secrets Manager or environment
try {
    Write-Host "Listing Database Tables..." -ForegroundColor Yellow
    
    # Use psql if available, otherwise show connection info
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        Write-Host "Using psql to connect..." -ForegroundColor Green
        
        # Note: In production, password should come from AWS Secrets Manager
        Write-Host "You'll need to enter the database password when prompted" -ForegroundColor Yellow
        
        $query = @"
\dt
"@
        
        # Connect and list tables
        $query | psql -h $ClusterEndpoint -d $DatabaseName -U $Username -p 5432
        
    } else {
        Write-Host "psql not found. Install PostgreSQL client tools." -ForegroundColor Red
        Write-Host "Connection details:" -ForegroundColor Yellow
        Write-Host "Host: $ClusterEndpoint"
        Write-Host "Port: 5432"
        Write-Host "Database: $DatabaseName"
        Write-Host "Username: $Username"
        Write-Host ""
        Write-Host "To connect manually:"
        Write-Host "psql -h $ClusterEndpoint -d $DatabaseName -U $Username -p 5432"
    }
    
} catch {
    Write-Host "Error connecting to database: $($_.Exception.Message)" -ForegroundColor Red
    
    # Show AWS RDS status as fallback
    Write-Host "Aurora Cluster Status:" -ForegroundColor Yellow
    aws rds describe-db-clusters --db-cluster-identifier modulus-aurora-cluster --region eu-west-2 --query "DBClusters[0].[DBClusterIdentifier,Status,Engine,EngineVersion,DatabaseName]" --output table
}

Write-Host ""
Write-Host "Script completed" -ForegroundColor Green
