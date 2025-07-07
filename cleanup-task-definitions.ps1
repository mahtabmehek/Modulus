# Clean up old ECS task definitions
param(
    [string]$KeepLatest = "3"
)

Write-Host "Cleaning up old ECS task definitions..." -ForegroundColor Cyan

# Get current task definition in use
$currentTaskDef = aws ecs describe-services --cluster "modulus-cluster" --services "modulus-service" --region "eu-west-2" --query 'services[0].taskDefinition' --output text
Write-Host "Current active task definition: $currentTaskDef" -ForegroundColor Green

# Get all task definition families
$families = @("modulus-task", "modulus-simple-task")

foreach ($family in $families) {
    Write-Host "`nProcessing family: $family" -ForegroundColor Yellow
    
    # Get all revisions for this family
    $revisions = aws ecs list-task-definitions --family-prefix $family --region "eu-west-2" --query 'taskDefinitionArns[*]' --output json | ConvertFrom-Json
    
    if ($revisions.Count -gt $KeepLatest) {
        # Keep only the latest N versions, deregister the rest
        $toDeregister = $revisions[0..($revisions.Count - $KeepLatest - 1)]
        
        Write-Host "  Found $($revisions.Count) revisions, keeping latest $KeepLatest, deregistering $($toDeregister.Count)" -ForegroundColor White
        
        foreach ($taskDefArn in $toDeregister) {
            # Extract task definition name from ARN
            $taskDefName = $taskDefArn.Split("/")[-1]
            
            # Don't deregister if it's currently in use
            if ($taskDefArn -eq $currentTaskDef) {
                Write-Host "    Skipping $taskDefName (currently in use)" -ForegroundColor Green
                continue
            }
            
            Write-Host "    Deregistering $taskDefName..." -ForegroundColor Gray
            try {
                aws ecs deregister-task-definition --task-definition $taskDefArn --region "eu-west-2" --query 'taskDefinition.taskDefinitionArn' --output text | Out-Null
                Write-Host "    ✅ Deregistered $taskDefName" -ForegroundColor Green
            } catch {
                Write-Host "    ❌ Failed to deregister $taskDefName" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  Only $($revisions.Count) revisions found, no cleanup needed" -ForegroundColor Green
    }
}

Write-Host "`nTask definition cleanup complete!" -ForegroundColor Cyan
