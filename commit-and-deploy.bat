@echo off
echo Committing UK region changes...
git add .
git commit -m "Update to UK region (eu-west-2) and fix VPC limits"
git push origin master
echo Deployment triggered!
pause
