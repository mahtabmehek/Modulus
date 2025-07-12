# VNC Kali Linux - AWS ECS Fargate Approach

## Overview
Use AWS ECS Fargate to run Kali containers with automatic scaling and management.

## Cost Analysis
- **Fargate pricing**: ~$0.04048/vCPU/hour + $0.004445/GB/hour
- **1 vCPU, 2GB container**: ~$0.049/hour per container
- **Auto-scaling based on demand**
- **No server management required**

## ECS Configuration

### 1. Task Definition
```json
{
  "family": "kali-vnc-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "kali-vnc",
      "image": "your-account.dkr.ecr.region.amazonaws.com/kali-vnc:latest",
      "portMappings": [
        {
          "containerPort": 5901,
          "protocol": "tcp"
        },
        {
          "containerPort": 6080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "VNC_PASSWORD",
          "value": "changeme123"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/kali-vnc",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 2. Service Configuration
```yaml
# CloudFormation for ECS Service
KaliVNCService:
  Type: AWS::ECS::Service
  Properties:
    ServiceName: kali-vnc-service
    Cluster: !Ref ECSCluster
    TaskDefinition: !Ref KaliTaskDefinition
    DesiredCount: 0  # Scale based on demand
    LaunchType: FARGATE
    NetworkConfiguration:
      AwsvpcConfiguration:
        SecurityGroups:
          - !Ref KaliSecurityGroup
        Subnets:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
        AssignPublicIp: ENABLED
    LoadBalancers:
      - ContainerName: kali-vnc
        ContainerPort: 6080
        TargetGroupArn: !Ref KaliTargetGroup
```

### 3. Auto-Scaling Based on User Demand
```javascript
// Backend API to manage ECS tasks
const AWS = require('aws-sdk');
const ecs = new AWS.ECS({ region: 'us-west-2' });

class KaliDesktopManager {
  async createUserDesktop(userId, labId) {
    try {
      // Run new Fargate task
      const params = {
        cluster: 'kali-cluster',
        taskDefinition: 'kali-vnc-task',
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: ['subnet-12345', 'subnet-67890'],
            securityGroups: ['sg-abcdef'],
            assignPublicIp: 'ENABLED'
          }
        },
        overrides: {
          containerOverrides: [
            {
              name: 'kali-vnc',
              environment: [
                { name: 'USER_ID', value: userId },
                { name: 'LAB_ID', value: labId },
                { name: 'SESSION_TIMEOUT', value: '3600' } // 1 hour
              ]
            }
          ]
        },
        tags: [
          { key: 'UserId', value: userId },
          { key: 'LabId', value: labId },
          { key: 'Type', value: 'KaliDesktop' }
        ]
      };

      const result = await ecs.runTask(params).promise();
      const taskArn = result.tasks[0].taskArn;
      
      // Wait for task to be running
      await this.waitForTaskRunning(taskArn);
      
      // Get task details and network info
      const taskDetails = await this.getTaskDetails(taskArn);
      
      return {
        sessionId: taskArn.split('/').pop(),
        taskArn: taskArn,
        vncUrl: `vnc://${taskDetails.publicIP}:5901`,
        webUrl: `https://${taskDetails.publicIP}:6080/vnc.html`,
        status: 'running'
      };
    } catch (error) {
      console.error('Failed to create desktop:', error);
      throw error;
    }
  }

  async terminateUserDesktop(taskArn) {
    try {
      await ecs.stopTask({
        cluster: 'kali-cluster',
        task: taskArn,
        reason: 'User session ended'
      }).promise();
      
      return { status: 'terminated' };
    } catch (error) {
      console.error('Failed to terminate desktop:', error);
      throw error;
    }
  }

  async waitForTaskRunning(taskArn, maxWaitTime = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const tasks = await ecs.describeTasks({
        cluster: 'kali-cluster',
        tasks: [taskArn]
      }).promise();
      
      const task = tasks.tasks[0];
      if (task.lastStatus === 'RUNNING') {
        return task;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Task failed to start within timeout period');
  }

  async getTaskDetails(taskArn) {
    const tasks = await ecs.describeTasks({
      cluster: 'kali-cluster',
      tasks: [taskArn]
    }).promise();
    
    const task = tasks.tasks[0];
    const eniId = task.attachments[0].details.find(d => d.name === 'networkInterfaceId').value;
    
    // Get public IP from ENI
    const ec2 = new AWS.EC2({ region: 'us-west-2' });
    const enis = await ec2.describeNetworkInterfaces({
      NetworkInterfaceIds: [eniId]
    }).promise();
    
    const publicIP = enis.NetworkInterfaces[0].Association?.PublicIp;
    
    return {
      taskArn,
      publicIP,
      privateIP: enis.NetworkInterfaces[0].PrivateIpAddress
    };
  }
}

module.exports = KaliDesktopManager;
```
