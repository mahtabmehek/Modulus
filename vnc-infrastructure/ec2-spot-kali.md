# VNC Kali Linux Infrastructure - EC2 Spot Instances

## Overview
Use AWS EC2 Spot Instances with auto-scaling to provide individual Kali Linux machines with VNC access for each user.

## Cost Analysis
- **Spot Instance t3.medium**: ~$0.01-0.02/hour (90% cheaper than on-demand)
- **Storage**: 20GB GP3 EBS volume ~$2/month per instance
- **Network**: Minimal cost for VNC traffic
- **Estimated cost per user session**: $0.10-0.50 per hour

## Architecture

### 1. Auto-Scaling Group with Spot Instances
```yaml
# CloudFormation template for Kali VNC infrastructure
Resources:
  KaliLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: kali-vnc-template
      LaunchTemplateData:
        ImageId: ami-0abcdef1234567890  # Custom Kali AMI
        InstanceType: t3.medium
        SecurityGroupIds:
          - !Ref KaliSecurityGroup
        UserData: !Base64 |
          #!/bin/bash
          # Setup VNC and Kali tools
          apt update && apt upgrade -y
          apt install -y xfce4 xfce4-goodies tightvncserver
          
          # Create VNC user
          useradd -m kaliuser
          echo "kaliuser:kalipass123" | chpasswd
          
          # Setup VNC
          su - kaliuser -c "vncserver :1 -geometry 1024x768 -depth 24"
          
          # Install essential Kali tools
          apt install -y nmap wireshark metasploit-framework burpsuite
          
          # Register instance with backend
          curl -X POST "YOUR_API_URL/api/desktop/register" \
            -H "Content-Type: application/json" \
            -d "{\"instanceId\":\"$(curl -s http://169.254.169.254/latest/meta-data/instance-id)\",\"vncPort\":5901}"

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref KaliLaunchTemplate
        Version: !GetAtt KaliLaunchTemplate.LatestVersionNumber
      MinSize: 0
      MaxSize: 50
      DesiredCapacity: 0
      TargetGroupARNs:
        - !Ref KaliTargetGroup
```

### 2. Security Group Configuration
```yaml
  KaliSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Kali VNC instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5901
          ToPort: 5920
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/8
        - IpProtocol: tcp
          FromPort: 6080
          ToPort: 6080
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup  # noVNC web access
```
