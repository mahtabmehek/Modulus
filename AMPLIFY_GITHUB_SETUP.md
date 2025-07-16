# Connect AWS Amplify to GitHub - Step by Step Guide

## Prerequisites ✅
- GitHub repository: https://github.com/mahtabmehek/Modulus.git
- AWS account with Amplify access
- amplify.yml configuration file (already created)

## Step 1: Access AWS Amplify Console
1. Go to: https://console.aws.amazon.com/amplify/
2. Ensure you're in the correct region: **eu-west-2 (London)**

## Step 2: Create New App
1. Click **"New app"** → **"Host web app"**
2. Choose **"GitHub"** as source
3. Click **"Continue"**

## Step 3: Authorize GitHub Access
1. Click **"Authorize AWS Amplify"** (if not already authorized)
2. Select your repository: **mahtabmehek/Modulus**
3. Choose branch: **cognito-timeline**
4. Click **"Next"**

## Step 4: Configure Build Settings
1. Amplify should auto-detect your `amplify.yml` file
2. Review the build configuration:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: out
       files:
         - '**/*'
   ```
3. Click **"Next"**

## Step 5: Review and Deploy
1. Review all settings
2. Click **"Save and deploy"**
3. Wait for initial deployment (5-10 minutes)

## Step 6: Get Your Deployment URL
After deployment completes, you'll get a URL like:
- `https://cognito-timeline.xxxxxxxxxx.amplifyapp.com`

## Environment Variables (If Needed)
Add these in Amplify Console → App Settings → Environment Variables:
- `NEXT_PUBLIC_AWS_REGION`: `eu-west-2`
- `NEXT_PUBLIC_API_URL`: `https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api`

## Automatic Deployments
Once connected:
- ✅ Every push to `cognito-timeline` branch will trigger automatic deployment
- ✅ Your styling fixes will be automatically applied
- ✅ Build logs will show in Amplify console
