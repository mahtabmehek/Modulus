@echo off
echo === MODULUS DEPLOYMENT CHECK ===
echo.

echo Checking Load Balancer...
aws elbv2 describe-load-balancers --region eu-west-2 --query "LoadBalancers[0].DNSName" --output text > temp_dns.txt
set /p ALB_DNS=<temp_dns.txt
del temp_dns.txt

echo ALB DNS: %ALB_DNS%
echo.

if NOT "%ALB_DNS%"=="None" (
    echo Application URL: http://%ALB_DNS%
    echo.
    echo Try this URL in your browser!
) else (
    echo No load balancer found
)

echo.
echo Checking ECS Service...
aws ecs describe-services --cluster modulus-cluster --services modulus-service --region eu-west-2 --query "services[0].runningCount" --output text > temp_count.txt
set /p RUNNING_COUNT=<temp_count.txt
del temp_count.txt

echo Running tasks: %RUNNING_COUNT%

if "%RUNNING_COUNT%"=="0" (
    echo WARNING: No tasks running - container may have failed to start
)

pause
