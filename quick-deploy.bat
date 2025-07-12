@echo off
REM Modulus LMS - Quick Deploy Script
REM This batch file provides a simple deployment interface for Windows

echo ========================================
echo   Modulus LMS - Quick Deploy Script
echo ========================================
echo.

REM Configuration
set AWS_REGION=eu-west-2
set LAMBDA_FUNCTION=modulus-backend
set S3_BUCKET=modulus-frontend-1370267358
set API_GATEWAY_NAME=modulus-api

REM Check if AWS CLI is available
aws --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: AWS CLI not found. Please install AWS CLI first.
    echo Visit: https://aws.amazon.com/cli/
    pause
    exit /b 1
)

REM Check AWS configuration
aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo ERROR: AWS CLI not configured. Please run 'aws configure' first.
    pause
    exit /b 1
)

echo AWS CLI is configured and ready.
echo.

echo Select deployment option:
echo 1. Full deployment (backend + frontend + database)
echo 2. Backend only
echo 3. Frontend only
echo 4. Database initialization
echo 5. Run tests
echo 6. Show status
echo.
set /p choice="Enter choice (1-6): "

if "%choice%"=="1" goto full_deploy
if "%choice%"=="2" goto backend_only
if "%choice%"=="3" goto frontend_only
if "%choice%"=="4" goto database_only
if "%choice%"=="5" goto test_only
if "%choice%"=="6" goto status_only
goto invalid_choice

:full_deploy
echo.
echo [FULL DEPLOYMENT - Backend + Frontend + Database]
echo ================================================
call :deploy_backend
if errorlevel 1 goto deployment_failed
call :deploy_frontend
if errorlevel 1 goto deployment_failed
call :init_database
call :run_tests
goto deployment_success

:backend_only
echo.
echo [BACKEND DEPLOYMENT]
echo ===================
call :deploy_backend
goto deployment_success

:frontend_only
echo.
echo [FRONTEND DEPLOYMENT]
echo ====================
call :deploy_frontend
goto deployment_success

:database_only
echo.
echo [DATABASE INITIALIZATION]
echo ========================
call :init_database
goto deployment_success

:test_only
echo.
echo [RUNNING TESTS]
echo ==============
call :run_tests
goto deployment_success

:status_only
echo.
echo [DEPLOYMENT STATUS]
echo ==================
call :show_status
goto end

:deploy_backend
echo Deploying backend to AWS Lambda...
echo ----------------------------------
cd backend
if not exist package.json (
    echo ERROR: package.json not found in backend directory
    cd ..
    exit /b 1
)

echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    cd ..
    exit /b 1
)

echo Creating deployment package...
if exist modulus-backend.zip del modulus-backend.zip
powershell -command "Compress-Archive -Path . -DestinationPath modulus-backend.zip -Exclude node_modules,*.zip,test,*.log -Force"
if not exist modulus-backend.zip (
    echo ERROR: Failed to create deployment package
    cd ..
    exit /b 1
)

echo Updating Lambda function...
aws lambda update-function-code --function-name %LAMBDA_FUNCTION% --zip-file fileb://modulus-backend.zip --region %AWS_REGION%
if errorlevel 1 (
    echo ERROR: Failed to update Lambda function
    cd ..
    exit /b 1
)

echo Waiting for Lambda update to complete...
aws lambda wait function-updated --function-name %LAMBDA_FUNCTION% --region %AWS_REGION%

cd ..
echo Backend deployed successfully!
echo.
exit /b 0

:deploy_frontend
echo Deploying frontend to S3...
echo ---------------------------
cd frontend
if not exist package.json (
    echo ERROR: package.json not found in frontend directory
    cd ..
    exit /b 1
)

echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    cd ..
    exit /b 1
)

echo Building React application...
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build frontend
    cd ..
    exit /b 1
)

echo Uploading to S3...
aws s3 sync dist/ s3://%S3_BUCKET%/ --region %AWS_REGION% --delete --cache-control "public, max-age=86400"
if errorlevel 1 (
    echo ERROR: Failed to upload to S3
    cd ..
    exit /b 1
)

echo Configuring S3 website hosting...
aws s3 website s3://%S3_BUCKET% --index-document index.html --error-document index.html --region %AWS_REGION%

cd ..
echo Frontend deployed successfully!
echo Frontend URL: http://%S3_BUCKET%.s3-website.%AWS_REGION%.amazonaws.com/
echo.
exit /b 0

:init_database
echo Initializing database...
echo -----------------------
echo Getting API Gateway URL...
for /f "tokens=*" %%i in ('aws apigateway get-rest-apis --region %AWS_REGION% --query "items[?name==''%API_GATEWAY_NAME%''].id" --output text') do set API_ID=%%i

if "%API_ID%"=="" (
    echo WARNING: Could not find API Gateway. Database initialization skipped.
    exit /b 0
)

set API_URL=https://%API_ID%.execute-api.%AWS_REGION%.amazonaws.com/prod

echo Using API URL: %API_URL%
echo Creating database tables...
curl -X POST "%API_URL%/api/admin/init-db" -H "Content-Type: application/json" --silent --show-error
echo.
echo Database initialization completed!
echo.
exit /b 0

:run_tests
echo Running API tests...
echo -------------------
echo Getting API Gateway URL...
for /f "tokens=*" %%i in ('aws apigateway get-rest-apis --region %AWS_REGION% --query "items[?name==''%API_GATEWAY_NAME%''].id" --output text') do set API_ID=%%i

if "%API_ID%"=="" (
    echo ERROR: Could not find API Gateway for testing
    exit /b 1
)

set API_URL=https://%API_ID%.execute-api.%AWS_REGION%.amazonaws.com/prod

echo Testing health endpoint...
curl -f "%API_URL%/api/health" --silent >nul
if errorlevel 1 (
    echo FAILED: Health check failed
) else (
    echo PASSED: Health check successful
)

echo.
echo Testing registration endpoints...
echo Testing student registration...
echo {"name":"Test Student","email":"test.student@modulus.test","password":"TestPassword123!","role":"student","accessCode":"student2025"} > temp_student.json
curl -X POST "%API_URL%/api/auth/register" -H "Content-Type: application/json" -d @temp_student.json --silent --show-error
del temp_student.json

echo.
echo All tests completed!
echo.
exit /b 0

:show_status
echo Checking deployment status...
echo ----------------------------

echo Checking Lambda function...
aws lambda get-function --function-name %LAMBDA_FUNCTION% --region %AWS_REGION% --query "Configuration.State" --output text >temp_lambda_status.txt 2>nul
if errorlevel 1 (
    echo Lambda Function: %LAMBDA_FUNCTION% - Status: ERROR
) else (
    set /p LAMBDA_STATUS=<temp_lambda_status.txt
    echo Lambda Function: %LAMBDA_FUNCTION% - Status: !LAMBDA_STATUS!
)
if exist temp_lambda_status.txt del temp_lambda_status.txt

echo Checking S3 bucket...
aws s3api head-bucket --bucket %S3_BUCKET% --region %AWS_REGION% >nul 2>&1
if errorlevel 1 (
    echo S3 Bucket: %S3_BUCKET% - Status: NOT_FOUND
) else (
    echo S3 Bucket: %S3_BUCKET% - Status: EXISTS
)

echo Checking API Gateway...
for /f "tokens=*" %%i in ('aws apigateway get-rest-apis --region %AWS_REGION% --query "items[?name==''%API_GATEWAY_NAME%''].id" --output text 2^>nul') do set API_ID=%%i
if "%API_ID%"=="" (
    echo API Gateway: %API_GATEWAY_NAME% - Status: NOT_FOUND
) else (
    echo API Gateway: %API_GATEWAY_NAME% - Status: EXISTS
    echo API URL: https://%API_ID%.execute-api.%AWS_REGION%.amazonaws.com/prod
)

echo.
exit /b 0

:deployment_failed
echo.
echo ========================================
echo   DEPLOYMENT FAILED!
echo ========================================
echo Please check the error messages above.
pause
exit /b 1

:deployment_success
echo.
echo ========================================
echo   Deployment completed successfully!
echo ========================================
call :show_status
goto end

:invalid_choice
echo Invalid choice. Please select 1-6.
pause
exit /b 1

:end
echo.
echo Press any key to exit...
pause >nul
