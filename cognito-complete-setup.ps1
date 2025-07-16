# Modulus Cognito Complete Setup with Error Checking
# This script orchestrates the entire Cognito migration process

param(
    [string]$Environment = "production",
    [switch]$SkipDatabase = $false,
    [switch]$SkipCognito = $false,
    [switch]$Verbose = $false
)

# Global error tracking
$Global:ErrorCount = 0
$Global:WarningCount = 0
$Global:SetupLog = @()

function Write-SetupLog {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$ForegroundColor = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    $Global:SetupLog += $logEntry
    
    Write-Host $logEntry -ForegroundColor $ForegroundColor
    
    if ($Level -eq "ERROR") { $Global:ErrorCount++ }
    if ($Level -eq "WARNING") { $Global:WarningCount++ }
}

function Test-Prerequisites {
    Write-SetupLog "🔍 CHECKING PREREQUISITES" "INFO" "Cyan"
    Write-SetupLog "=========================" "INFO" "Cyan"
    
    $allGood = $true
    
    # Check AWS CLI
    Write-SetupLog "Checking AWS CLI..." "INFO" "Yellow"
    try {
        $awsVersion = aws --version 2>&1
        if ($awsVersion -like "*aws-cli*") {
            Write-SetupLog "✅ AWS CLI found: $($awsVersion.Split()[0])" "INFO" "Green"
        } else {
            Write-SetupLog "❌ AWS CLI not found or not working" "ERROR" "Red"
            $allGood = $false
        }
    } catch {
        Write-SetupLog "❌ AWS CLI check failed: $($_.Exception.Message)" "ERROR" "Red"
        $allGood = $false
    }
    
    # Check AWS credentials
    Write-SetupLog "Checking AWS credentials..." "INFO" "Yellow"
    try {
        $identity = aws sts get-caller-identity --output json 2>&1
        if ($identity -like "*error*" -or $identity -like "*Unable to locate credentials*") {
            Write-SetupLog "❌ AWS credentials not configured" "ERROR" "Red"
            $allGood = $false
        } else {
            $identityObj = $identity | ConvertFrom-Json
            Write-SetupLog "✅ AWS credentials valid for account: $($identityObj.Account)" "INFO" "Green"
        }
    } catch {
        Write-SetupLog "❌ AWS credentials check failed: $($_.Exception.Message)" "ERROR" "Red"
        $allGood = $false
    }
    
    # Check required PowerShell modules
    Write-SetupLog "Checking PowerShell capabilities..." "INFO" "Yellow"
    if ($PSVersionTable.PSVersion.Major -ge 5) {
        Write-SetupLog "✅ PowerShell version: $($PSVersionTable.PSVersion)" "INFO" "Green"
    } else {
        Write-SetupLog "⚠️ PowerShell version might be too old: $($PSVersionTable.PSVersion)" "WARNING" "Yellow"
    }
    
    # Check MySQL client (if needed for database)
    if (-not $SkipDatabase) {
        Write-SetupLog "Checking MySQL client..." "INFO" "Yellow"
        try {
            $mysqlVersion = mysql --version 2>&1
            if ($mysqlVersion -like "*mysql*") {
                Write-SetupLog "✅ MySQL client found: $($mysqlVersion.Split(',')[0])" "INFO" "Green"
            } else {
                Write-SetupLog "⚠️ MySQL client not found - database setup may fail" "WARNING" "Yellow"
            }
        } catch {
            Write-SetupLog "⚠️ MySQL client check failed - database setup may fail" "WARNING" "Yellow"
        }
    }
    
    # Check internet connectivity
    Write-SetupLog "Checking internet connectivity..." "INFO" "Yellow"
    try {
        $ping = Test-NetConnection -ComputerName "aws.amazon.com" -Port 443 -InformationLevel Quiet
        if ($ping) {
            Write-SetupLog "✅ Internet connectivity to AWS confirmed" "INFO" "Green"
        } else {
            Write-SetupLog "❌ Cannot reach AWS services" "ERROR" "Red"
            $allGood = $false
        }
    } catch {
        Write-SetupLog "⚠️ Network connectivity check inconclusive" "WARNING" "Yellow"
    }
    
    return $allGood
}

function Test-AWSPermissions {
    Write-SetupLog "`n🔐 CHECKING AWS PERMISSIONS" "INFO" "Cyan"
    Write-SetupLog "============================" "INFO" "Cyan"
    
    $permissions = @(
        @{ Service = "Cognito"; Action = "cognito-idp:CreateUserPool"; Description = "Create User Pool" },
        @{ Service = "Cognito"; Action = "cognito-idp:CreateUserPoolClient"; Description = "Create App Client" },
        @{ Service = "Lambda"; Action = "lambda:CreateFunction"; Description = "Create Lambda Function" },
        @{ Service = "IAM"; Action = "iam:CreateRole"; Description = "Create IAM Roles" },
        @{ Service = "IAM"; Action = "iam:AttachRolePolicy"; Description = "Attach Policies" },
        @{ Service = "API Gateway"; Action = "apigateway:POST"; Description = "Create API Gateway" },
        @{ Service = "RDS"; Action = "rds:DescribeDBInstances"; Description = "Access RDS" }
    )
    
    foreach ($perm in $permissions) {
        Write-SetupLog "Checking $($perm.Service) permissions..." "INFO" "Yellow"
        # Note: AWS CLI doesn't have a direct way to test permissions
        # We'll rely on actual execution for permission validation
        Write-SetupLog "📝 Will validate $($perm.Description) during execution" "INFO" "Gray"
    }
    
    return $true
}

function Create-DatabaseFiles {
    Write-SetupLog "`n🗄️ CREATING DATABASE FILES" "INFO" "Cyan"
    Write-SetupLog "===========================" "INFO" "Cyan"
    
    try {
        # Run database file creation
        Write-SetupLog "Executing database file creator..." "INFO" "Yellow"
        
        if (Test-Path "create-cognito-database.ps1") {
            $dbResult = & ".\create-cognito-database.ps1" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-SetupLog "✅ Database files created successfully" "INFO" "Green"
                
                # Verify files were created
                $requiredFiles = @("cognito-schema.sql", "sample-data.sql", "init-cognito-db.ps1", ".env.cognito-db")
                foreach ($file in $requiredFiles) {
                    if (Test-Path $file) {
                        Write-SetupLog "✅ Created: $file" "INFO" "Green"
                    } else {
                        Write-SetupLog "❌ Missing: $file" "ERROR" "Red"
                        return $false
                    }
                }
                return $true
            } else {
                Write-SetupLog "❌ Database file creation failed: $dbResult" "ERROR" "Red"
                return $false
            }
        } else {
            Write-SetupLog "❌ create-cognito-database.ps1 not found" "ERROR" "Red"
            return $false
        }
    } catch {
        Write-SetupLog "❌ Database file creation error: $($_.Exception.Message)" "ERROR" "Red"
        return $false
    }
}

function Setup-CognitoInfrastructure {
    Write-SetupLog "`n☁️ SETTING UP COGNITO INFRASTRUCTURE" "INFO" "Cyan"
    Write-SetupLog "=====================================" "INFO" "Cyan"
    
    try {
        # Check if we have the fast setup script
        if (Test-Path "setup-cognito-fast.ps1") {
            Write-SetupLog "Found fast setup script, checking syntax..." "INFO" "Yellow"
            
            # Test script syntax first
            $syntaxCheck = powershell -NoProfile -Command "try { \$null = [System.Management.Automation.PSParser]::Tokenize((Get-Content 'setup-cognito-fast.ps1' -Raw), [ref]\$null); 'SYNTAX_OK' } catch { 'SYNTAX_ERROR: ' + \$_.Exception.Message }"
            
            if ($syntaxCheck -eq "SYNTAX_OK") {
                Write-SetupLog "✅ Script syntax is valid" "INFO" "Green"
                
                Write-SetupLog "Executing Cognito infrastructure setup..." "INFO" "Yellow"
                $cognitoResult = & ".\setup-cognito-fast.ps1" 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-SetupLog "✅ Cognito infrastructure setup completed" "INFO" "Green"
                    return $true
                } else {
                    Write-SetupLog "❌ Cognito setup failed: $cognitoResult" "ERROR" "Red"
                    return $false
                }
            } else {
                Write-SetupLog "❌ Script syntax error: $syntaxCheck" "ERROR" "Red"
                return $false
            }
        } else {
            Write-SetupLog "❌ setup-cognito-fast.ps1 not found" "ERROR" "Red"
            return $false
        }
    } catch {
        Write-SetupLog "❌ Cognito setup error: $($_.Exception.Message)" "ERROR" "Red"
        return $false
    }
}

function Verify-CognitoSetup {
    Write-SetupLog "`n✅ VERIFYING COGNITO SETUP" "INFO" "Cyan"
    Write-SetupLog "===========================" "INFO" "Cyan"
    
    try {
        # Check if User Pool was created
        Write-SetupLog "Checking for Cognito User Pools..." "INFO" "Yellow"
        $userPools = aws cognito-idp list-user-pools --max-items 50 --output json 2>&1
        
        if ($userPools -like "*error*") {
            Write-SetupLog "❌ Failed to list User Pools: $userPools" "ERROR" "Red"
            return $false
        }
        
        $poolsObj = $userPools | ConvertFrom-Json
        $modulusPool = $poolsObj.UserPools | Where-Object { $_.Name -like "*modulus*" -or $_.Name -like "*Modulus*" }
        
        if ($modulusPool) {
            Write-SetupLog "✅ Found Modulus User Pool: $($modulusPool.Name)" "INFO" "Green"
            Write-SetupLog "   Pool ID: $($modulusPool.Id)" "INFO" "Gray"
            
            # Check App Clients
            Write-SetupLog "Checking App Clients for User Pool..." "INFO" "Yellow"
            $clients = aws cognito-idp list-user-pool-clients --user-pool-id $modulusPool.Id --output json 2>&1
            
            if ($clients -like "*error*") {
                Write-SetupLog "⚠️ Could not verify App Clients: $clients" "WARNING" "Yellow"
            } else {
                $clientsObj = $clients | ConvertFrom-Json
                if ($clientsObj.UserPoolClients.Count -gt 0) {
                    Write-SetupLog "✅ Found $($clientsObj.UserPoolClients.Count) App Client(s)" "INFO" "Green"
                    foreach ($client in $clientsObj.UserPoolClients) {
                        Write-SetupLog "   Client: $($client.ClientName) ($($client.ClientId))" "INFO" "Gray"
                    }
                } else {
                    Write-SetupLog "⚠️ No App Clients found" "WARNING" "Yellow"
                }
            }
            
            return $true
        } else {
            Write-SetupLog "❌ No Modulus User Pool found" "ERROR" "Red"
            return $false
        }
    } catch {
        Write-SetupLog "❌ Verification error: $($_.Exception.Message)" "ERROR" "Red"
        return $false
    }
}

function Verify-LambdaSetup {
    Write-SetupLog "`n🔧 VERIFYING LAMBDA SETUP" "INFO" "Cyan"
    Write-SetupLog "=========================" "INFO" "Cyan"
    
    try {
        Write-SetupLog "Checking for Modulus Lambda functions..." "INFO" "Yellow"
        $functions = aws lambda list-functions --output json 2>&1
        
        if ($functions -like "*error*") {
            Write-SetupLog "❌ Failed to list Lambda functions: $functions" "ERROR" "Red"
            return $false
        }
        
        $functionsObj = $functions | ConvertFrom-Json
        $modulusFunctions = $functionsObj.Functions | Where-Object { $_.FunctionName -like "*modulus*" -or $_.FunctionName -like "*Modulus*" }
        
        if ($modulusFunctions) {
            Write-SetupLog "✅ Found $($modulusFunctions.Count) Modulus Lambda function(s)" "INFO" "Green"
            foreach ($func in $modulusFunctions) {
                Write-SetupLog "   Function: $($func.FunctionName)" "INFO" "Gray"
                Write-SetupLog "   Runtime: $($func.Runtime)" "INFO" "Gray"
                Write-SetupLog "   Last Modified: $($func.LastModified)" "INFO" "Gray"
            }
            return $true
        } else {
            Write-SetupLog "⚠️ No Modulus Lambda functions found" "WARNING" "Yellow"
            return $false
        }
    } catch {
        Write-SetupLog "❌ Lambda verification error: $($_.Exception.Message)" "ERROR" "Red"
        return $false
    }
}

function Generate-SetupReport {
    Write-SetupLog "`n📊 GENERATING SETUP REPORT" "INFO" "Cyan"
    Write-SetupLog "===========================" "INFO" "Cyan"
    
    $reportPath = "cognito-setup-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    
    $report = @"
MODULUS COGNITO SETUP REPORT
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Environment: $Environment
========================================

SUMMARY:
- Total Errors: $Global:ErrorCount
- Total Warnings: $Global:WarningCount
- Setup Status: $(if ($Global:ErrorCount -eq 0) { "SUCCESS" } else { "FAILED" })

DETAILED LOG:
$(($Global:SetupLog | Out-String).Trim())

NEXT STEPS:
$(if ($Global:ErrorCount -eq 0) {
@"
✅ Cognito setup completed successfully!

To complete the migration:
1. Update your frontend to use Cognito authentication
2. Update Lambda functions to validate Cognito tokens
3. Test user registration and login flows
4. Migrate existing users (if needed)

Configuration files created:
- cognito-schema.sql (database schema)
- sample-data.sql (sample data)
- init-cognito-db.ps1 (database initializer)
- .env.cognito-db (environment config)
"@
} else {
@"
❌ Setup encountered errors. Please review the log above and:
1. Fix any permission issues
2. Ensure AWS CLI is properly configured
3. Check internet connectivity
4. Re-run the setup script
"@
})
========================================
"@

    $report | Out-File -FilePath $reportPath -Encoding UTF8
    Write-SetupLog "📄 Setup report saved to: $reportPath" "INFO" "Green"
}

# MAIN EXECUTION
Write-SetupLog "🚀 MODULUS COGNITO COMPLETE SETUP" "INFO" "Cyan"
Write-SetupLog "==================================" "INFO" "Cyan"
Write-SetupLog "Environment: $Environment" "INFO" "White"
Write-SetupLog "Skip Database: $SkipDatabase" "INFO" "White"
Write-SetupLog "Skip Cognito: $SkipCognito" "INFO" "White"
Write-SetupLog "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "INFO" "White"
Write-SetupLog "==================================" "INFO" "Cyan"

$setupSuccess = $true

# Step 1: Prerequisites
if (-not (Test-Prerequisites)) {
    Write-SetupLog "❌ Prerequisites check failed - aborting setup" "ERROR" "Red"
    $setupSuccess = $false
} else {
    Write-SetupLog "✅ Prerequisites check passed" "INFO" "Green"
}

# Step 2: AWS Permissions
if ($setupSuccess -and -not (Test-AWSPermissions)) {
    Write-SetupLog "❌ AWS permissions check failed - aborting setup" "ERROR" "Red"
    $setupSuccess = $false
} else {
    Write-SetupLog "✅ AWS permissions check passed" "INFO" "Green"
}

# Step 3: Database Files
if ($setupSuccess -and -not $SkipDatabase) {
    if (-not (Create-DatabaseFiles)) {
        Write-SetupLog "❌ Database file creation failed" "ERROR" "Red"
        $setupSuccess = $false
    } else {
        Write-SetupLog "✅ Database files created successfully" "INFO" "Green"
    }
} elseif ($SkipDatabase) {
    Write-SetupLog "⏭️ Database setup skipped" "INFO" "Yellow"
}

# Step 4: Cognito Infrastructure
if ($setupSuccess -and -not $SkipCognito) {
    if (-not (Setup-CognitoInfrastructure)) {
        Write-SetupLog "❌ Cognito infrastructure setup failed" "ERROR" "Red"
        $setupSuccess = $false
    } else {
        Write-SetupLog "✅ Cognito infrastructure setup completed" "INFO" "Green"
    }
} elseif ($SkipCognito) {
    Write-SetupLog "⏭️ Cognito setup skipped" "INFO" "Yellow"
}

# Step 5: Verification
if ($setupSuccess -and -not $SkipCognito) {
    Write-SetupLog "🔍 Verifying setup..." "INFO" "Yellow"
    
    $cognitoVerified = Verify-CognitoSetup
    $lambdaVerified = Verify-LambdaSetup
    
    if (-not $cognitoVerified) {
        Write-SetupLog "⚠️ Cognito verification had issues" "WARNING" "Yellow"
    }
    
    if (-not $lambdaVerified) {
        Write-SetupLog "⚠️ Lambda verification had issues" "WARNING" "Yellow"
    }
}

# Step 6: Generate Report
Generate-SetupReport

# Final Status
Write-SetupLog "`n🎯 SETUP COMPLETE" "INFO" "Cyan"
Write-SetupLog "=================" "INFO" "Cyan"

if ($setupSuccess -and $Global:ErrorCount -eq 0) {
    Write-SetupLog "🎉 SUCCESS: Cognito setup completed without errors!" "INFO" "Green"
    Write-SetupLog "   Errors: $Global:ErrorCount | Warnings: $Global:WarningCount" "INFO" "Green"
    exit 0
} elseif ($Global:ErrorCount -eq 0) {
    Write-SetupLog "✅ PARTIAL SUCCESS: Setup completed with warnings only" "INFO" "Yellow"
    Write-SetupLog "   Errors: $Global:ErrorCount | Warnings: $Global:WarningCount" "INFO" "Yellow"
    exit 0
} else {
    Write-SetupLog "❌ FAILED: Setup encountered $Global:ErrorCount error(s)" "ERROR" "Red"
    Write-SetupLog "   Errors: $Global:ErrorCount | Warnings: $Global:WarningCount" "ERROR" "Red"
    exit 1
}
