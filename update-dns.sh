#!/bin/bash

# DNS Update Script for Modulus LMS
# Updates Route 53 records to point to load balancers

ALB_DNS=$1
LABS_ALB_DNS=$2
DOMAIN_NAME="mahtabmehek.tech"
APP_SUBDOMAIN="modulus"
LABS_SUBDOMAIN="labs"

# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name $DOMAIN_NAME --query 'HostedZones[0].Id' --output text | cut -d'/' -f3)

echo "🌐 Updating DNS records for $DOMAIN_NAME..."

# Create main app DNS record
cat > dns-main.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$APP_SUBDOMAIN.$DOMAIN_NAME",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "$ALB_DNS"
          }
        ]
      }
    }
  ]
}
EOF

# Create labs DNS record
cat > dns-labs.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$LABS_SUBDOMAIN.$DOMAIN_NAME",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "$LABS_ALB_DNS"
          }
        ]
      }
    }
  ]
}
EOF

# Update DNS records
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file://dns-main.json
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file://dns-labs.json

# Cleanup
rm -f dns-main.json dns-labs.json

echo "✅ DNS records updated successfully!"
echo "   - $APP_SUBDOMAIN.$DOMAIN_NAME → $ALB_DNS"
echo "   - $LABS_SUBDOMAIN.$DOMAIN_NAME → $LABS_ALB_DNS"
