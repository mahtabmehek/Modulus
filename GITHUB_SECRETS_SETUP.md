# GitHub Secrets Setup Guide

To enable GitHub Actions deployment to AWS, you need to set up the following secrets in your GitHub repository.

## How to Add GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret below

## Required Secrets

### For All Deployment Methods

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for programmatic access | AWS IAM Console → Users → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for programmatic access | AWS IAM Console → Users → Security credentials |

### For EC2 Deployment (Additional)

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `S3_BUCKET` | S3 bucket name for storing deployments | `modulus-deployments-1234567890` |
| `EC2_INSTANCE_TAG` | EC2 instance tag name | `modulus-app` |

## Getting AWS Credentials

### Option 1: Create IAM User (Recommended)

1. **Go to AWS IAM Console**
   - Navigate to: https://console.aws.amazon.com/iam/

2. **Create User**
   ```
   User name: github-actions-user
   Access type: Programmatic access
   ```

3. **Attach Policies**
   ```
   - AmazonEC2FullAccess
   - AmazonS3FullAccess
   - AmazonECS_FullAccess
   - ElasticBeanstalkFullAccess
   - IAMFullAccess
   - CloudWatchFullAccess
   ```

4. **Save Credentials**
   - Copy `Access Key ID` → Use as `AWS_ACCESS_KEY_ID`
   - Copy `Secret Access Key` → Use as `AWS_SECRET_ACCESS_KEY`

### Option 2: Use Existing User

If you already have an AWS user:

1. Go to **IAM Console** → **Users**
2. Select your user
3. Go to **Security credentials** tab
4. Click **Create access key**
5. Choose **Command Line Interface (CLI)**
6. Save the credentials

## Security Best Practices

### 🔒 IAM Policy (Least Privilege)

Instead of using full access policies, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:*",
        "ecr:*",
        "elasticbeanstalk:*",
        "ec2:*",
        "s3:*",
        "iam:PassRole",
        "logs:*",
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 🛡️ Additional Security

1. **Enable MFA** on your AWS root account
2. **Use IAM roles** when possible
3. **Rotate access keys** regularly
4. **Monitor CloudTrail** for unusual activity

## Verification

After adding secrets, you can verify they're set correctly:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see your secrets listed (values will be hidden)
3. Try a test deployment by pushing to master branch

## Troubleshooting

### Common Issues

1. **Invalid credentials**
   - Double-check access key and secret key
   - Ensure user has necessary permissions

2. **Resource access denied**
   - Check IAM policies attached to user
   - Verify user has permissions for specific AWS services

3. **Secrets not working**
   - Ensure secret names match exactly (case-sensitive)
   - Check for extra spaces in secret values

### Getting Help

- Check GitHub Actions logs for detailed error messages
- Verify AWS CloudTrail for API call failures
- Test AWS credentials locally with `aws sts get-caller-identity`
