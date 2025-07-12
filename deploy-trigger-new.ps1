#!/usr/bin/env pwsh
<#
.SYNOPSIS
    One-click deployment trigger for Modulus LMS
    
.DESCRIPTION
    This script provides options to deploy via GitHub Actions or local deployment
#>

param(
    [ValidateSet("github", "local", "check")]
    [string]$Method = "local",
    [string]$Region = "eu-west-2"
)

$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "Cyan" }
    }
    Write-Host "[$Status] $Message" -ForegroundColor $color
}

Write-Host "🚀 Modulus LMS Deployment Trigger" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

switch ($Method) {
    "github" {
        Write-Status "Triggering GitHub Actions deployment..." "INFO"
        
        # Check if we're in a git repository
        if (-not (Test-Path ".git")) {
            Write-Status "Not in a git repository. Please run from the project root." "ERROR"
            exit 1
        }
        
        # Check if GitHub CLI is available
        try {
            gh --version | Out-Null
            Write-Status "GitHub CLI found" "SUCCESS"
        }
        catch {
            Write-Status "GitHub CLI not found. Installing..." "WARNING"
            Write-Status "Please install GitHub CLI from: https://cli.github.com/" "INFO"
            Write-Status "Alternatively, you can trigger workflows manually from GitHub web interface" "INFO"
            exit 1
        }
        
        # Trigger full deployment workflow
        try {
            Write-Status "Triggering full deployment workflow..." "INFO"
            gh workflow run "full-deployment.yml" --field deploy_backend=true --field deploy_frontend=true --field test_seed=true
            
            Write-Status "✅ GitHub Actions workflow triggered!" "SUCCESS"
            Write-Status "Check progress at: https://github.com/{owner}/{repo}/actions" "INFO"
            
            # Show recent workflow runs
            Write-Status "Recent workflow runs:" "INFO"
            gh run list --limit 5 --workflow="full-deployment.yml"
        }
        catch {
            Write-Status "Failed to trigger GitHub Actions: $_" "ERROR"
            Write-Status "You can manually trigger workflows from the GitHub web interface" "INFO"
        }
    }
    
    "local" {
        Write-Status "Starting local deployment..." "INFO"
        
        if (-not (Test-Path "deploy-comprehensive.ps1")) {
            Write-Status "deploy-comprehensive.ps1 not found. Creating it..." "WARNING"
            Write-Status "Please run this script again after the comprehensive deployment script is created." "INFO"
            exit 1
        }
        
        Write-Status "Executing comprehensive local deployment..." "INFO"
        & ".\deploy-comprehensive.ps1" -DeployBackend $true -DeployFrontend $true -TestEndpoints $true -Region $Region
    }
    
    "check" {
        Write-Status "Checking deployment status..." "INFO"
        
        if (-not (Test-Path "check-deployment-status.ps1")) {
            Write-Status "check-deployment-status.ps1 not found. Creating it..." "WARNING"
            Write-Status "Please run this script again after the status check script is created." "INFO"
            exit 1
        }
        
        & ".\check-deployment-status.ps1" -Region $Region
    }
}

Write-Host "" -ForegroundColor White
Write-Host "Available Commands:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Local deployment:    .\deploy-trigger-new.ps1 -Method local" -ForegroundColor White
Write-Host "GitHub Actions:      .\deploy-trigger-new.ps1 -Method github" -ForegroundColor White
Write-Host "Check status:        .\deploy-trigger-new.ps1 -Method check" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Manual GitHub Actions:" -ForegroundColor Cyan
Write-Host "- Visit: https://github.com/{owner}/{repo}/actions" -ForegroundColor White
Write-Host "- Click 'Run workflow' on 'Full Stack Deployment'" -ForegroundColor White
Write-Host "" -ForegroundColor White
