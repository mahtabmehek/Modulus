# GitHub Secrets Setup for AWS Free Tier

Simple setup for AWS Free Tier deployment.

## Required Secrets (Only 3!)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_BUCKET` | S3 bucket name from setup | `modulus-deploy-1234567890` |

## How to Add Secrets

1. **Go to your GitHub repo**
2. **Click Settings** → **Secrets and variables** → **Actions**  
3. **Click "New repository secret"**
4. **Add each secret** from the table above

## Getting AWS Credentials

### Quick Method (5 minutes):

1. **Go to AWS Console** → **IAM** → **Users**
2. **Click "Create user"**
   - Username: `github-actions`
   - Access type: ✅ Programmatic access
3. **Attach policies**:
   - `AmazonEC2FullAccess`
   - `AmazonS3FullAccess`  
   - `AmazonSSMFullAccess`
4. **Download credentials**
   - Access Key ID → Use as `AWS_ACCESS_KEY_ID`
   - Secret Access Key → Use as `AWS_SECRET_ACCESS_KEY`

### Security Note
These permissions are for the free tier setup. For production, use more restrictive policies.

## Verification

After adding secrets, push to master branch:
```bash
git push origin master
```

Check GitHub Actions tab to see if deployment starts successfully.
