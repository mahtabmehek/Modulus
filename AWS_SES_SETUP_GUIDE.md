# AWS SES Setup Guide for Cognito Email Verification

## Overview
This guide will help you set up AWS Simple Email Service (SES) to enable email verification for your Cognito user registration process.

## Prerequisites
- [x] AWS CLI installed and configured
- [x] AWS account with appropriate permissions
- [x] Access to the email address you want to use for sending

## Quick Setup (Recommended)

### Step 1: Create IAM Permissions
```powershell
# Run this to create necessary IAM permissions
.\create-iam-policy.ps1
```

### Step 2: Setup SES and Configure Cognito
```powershell
# Run this with your email address
.\setup-ses-quick.ps1 -EmailAddress "your-email@domain.com"
```

### Step 3: Test Email Verification
1. Go to your application: http://localhost:3000
2. Click "Sign Up" tab
3. Create a new account with a test email
4. Check your email for the verification code
5. Complete the signup process

## Manual Setup (Alternative)

### 1. Verify Email Address in SES
```bash
aws ses verify-email-identity --email-address your-email@domain.com --region eu-west-2
```

### 2. Check Verification Status
```bash
aws ses list-verified-email-addresses --region eu-west-2
```

### 3. Configure Cognito User Pool
```bash
aws cognito-idp update-user-pool \
  --user-pool-id eu-west-2_4vo3VDZa5 \
  --email-configuration '{
    "EmailSendingAccount": "DEVELOPER",
    "SourceArn": "arn:aws:ses:eu-west-2:YOUR-ACCOUNT-ID:identity/your-email@domain.com",
    "ReplyToEmailAddress": "your-email@domain.com"
  }' \
  --region eu-west-2
```

## Files Created

| File | Purpose |
|------|---------|
| `setup-aws-ses.ps1` | Comprehensive SES setup with status checks |
| `setup-ses-quick.ps1` | Quick automated setup script |
| `create-iam-policy.ps1` | Creates necessary IAM permissions |
| `ses-cognito-iam-policy.json` | IAM policy document |

## Troubleshooting

### Email Not Received
1. **Check Spam/Junk Folder**: AWS emails often go to spam
2. **Verify Email Status**: Use `aws ses list-verified-email-addresses`
3. **SES Sandbox Mode**: In sandbox, can only send to verified addresses
4. **Region Mismatch**: Ensure using `eu-west-2` region consistently

### Permission Errors
1. **IAM Policies**: Ensure SES and Cognito permissions are attached
2. **User vs Role**: Check if using IAM user or role credentials
3. **AWS CLI Config**: Verify `aws configure` is properly set up

### Cognito Configuration Issues
1. **Source ARN**: Must match exactly: `arn:aws:ses:eu-west-2:ACCOUNT-ID:identity/EMAIL`
2. **User Pool ID**: Verify using correct User Pool ID: `eu-west-2_4vo3VDZa5`
3. **Region Consistency**: All commands must use `eu-west-2`

## SES Sandbox vs Production

### Sandbox Mode (Default)
- ✅ Free tier: 200 emails/day
- ❌ Can only send to verified email addresses
- ❌ Limited to 1 email/second

### Production Mode (Request Required)
- ✅ Send to any email address
- ✅ Higher sending limits
- ✅ Better deliverability features
- ❌ Requires AWS approval process

To request production access:
1. Go to AWS SES Console
2. Navigate to "Sending statistics"
3. Click "Request a sending limit increase"
4. Fill out the request form

## Testing Checklist

- [ ] AWS CLI configured and working
- [ ] IAM permissions created and attached
- [ ] Email address verified in SES
- [ ] Cognito User Pool configured with SES
- [ ] Test user registration in application
- [ ] Verification email received and working
- [ ] User can complete signup process
- [ ] User can login after verification

## Production Considerations

### Email Deliverability
- Set up SPF, DKIM, and DMARC records
- Use a custom domain for sending
- Implement bounce and complaint handling
- Monitor reputation metrics

### Custom Email Templates
- Brand verification emails with your logo
- Customize email content and styling
- Support multiple languages
- Include helpful instructions

### Security
- Use least-privilege IAM policies
- Monitor SES usage and costs
- Implement rate limiting
- Set up CloudWatch alarms

## Support

If you encounter issues:
1. Check AWS CloudTrail logs for API call errors
2. Review AWS SES sending statistics
3. Contact AWS Support for SES-specific issues
4. Check AWS documentation for latest SES features

---

**Status**: Ready for implementation  
**Region**: eu-west-2 (London)  
**Cognito User Pool**: eu-west-2_4vo3VDZa5
