# Ultra-Cheap VNC Kali Linux - Shared EC2 with User Isolation

## Overview
Run multiple isolated Kali environments on shared EC2 instances using Docker and noVNC.

## Cost Analysis (Ultra-Cheap)
- **Single c5.4xlarge Spot Instance**: ~$0.15/hour (16 vCPU, 32GB RAM)
- **Can support 20-30 concurrent users**
- **Cost per user**: ~$0.005-0.008/hour (less than 1 cent per hour!)
- **Perfect for educational environments**

## Architecture

### 1. Optimized Dockerfile for Resource Efficiency
```dockerfile
FROM kalilinux/kali-rolling:latest

# Minimize image size and install only essential tools
RUN apt update && \
    apt install -y --no-install-recommends \
    xfce4-session \
    xfce4-panel \
    xfce4-desktop \
    xfwm4 \
    tightvncserver \
    novnc \
    websockify \
    supervisor \
    firefox-esr \
    gnome-terminal \
    # Core Kali tools only
    nmap \
    wireshark-qt \
    burpsuite \
    sqlmap \
    dirb \
    && apt clean && rm -rf /var/lib/apt/lists/*

# Create isolated user environment
RUN useradd -m -s /bin/bash student && \
    echo "student:student123" | chpasswd && \
    mkdir -p /home/student/.vnc /home/student/Desktop && \
    echo -e "#!/bin/bash\nstartxfce4 &" > /home/student/.vnc/xstartup && \
    chmod +x /home/student/.vnc/xstartup && \
    chown -R student:student /home/student

# Create lab materials directory
RUN mkdir -p /home/student/Labs && \
    chown -R student:student /home/student/Labs

# Resource limits for isolation
COPY --chown=student:student lab-materials/ /home/student/Labs/
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Use specific ports for each container
ENV VNC_DISPLAY=:1
ENV NO_VNC_PORT=6080

EXPOSE 5901 6080

USER student
WORKDIR /home/student

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

### 2. Container Orchestrator for User Sessions
```javascript
// backend/services/DesktopManager.js
const Docker = require('dockerode');
const docker = new Docker();

class CheapDesktopManager {
  constructor() {
    this.activeSessions = new Map();
    this.portCounter = 6081; // Start from 6081 for noVNC
    this.vncPortCounter = 5902; // Start from 5902 for VNC
    this.maxContainersPerInstance = 25;
  }

  async createUserSession(userId, labId) {
    try {
      // Check if user already has active session
      if (this.activeSessions.has(userId)) {
        const existingSession = this.activeSessions.get(userId);
        if (await this.isContainerRunning(existingSession.containerId)) {
          return existingSession;
        } else {
          this.activeSessions.delete(userId);
        }
      }

      // Get available ports
      const vncPort = this.getNextVNCPort();
      const webPort = this.getNextWebPort();
      
      // Create container with resource limits
      const container = await docker.createContainer({
        Image: 'modulus-kali-lite:latest',
        name: `kali-${userId}-${Date.now()}`,
        Env: [
          `VNC_DISPLAY=:${vncPort - 5900}`,
          `NO_VNC_PORT=${webPort}`,
          `USER_ID=${userId}`,
          `LAB_ID=${labId}`
        ],
        ExposedPorts: {
          [`${vncPort}/tcp`]: {},
          [`${webPort}/tcp`]: {}
        },
        HostConfig: {
          PortBindings: {
            [`${vncPort}/tcp`]: [{ HostPort: vncPort.toString() }],
            [`${webPort}/tcp`]: [{ HostPort: webPort.toString() }]
          },
          // Resource limits to prevent abuse
          Memory: 536870912, // 512MB RAM limit
          CpuShares: 512,     // Limited CPU
          PidsLimit: 100,     // Limit processes
          ReadonlyRootfs: false,
          SecurityOpt: ['no-new-privileges'],
          // Network isolation
          NetworkMode: 'bridge'
        }
      });

      await container.start();
      
      const sessionData = {
        userId,
        labId,
        containerId: container.id,
        vncPort,
        webPort,
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };

      this.activeSessions.set(userId, sessionData);
      
      // Store in database
      await this.saveSessionToDatabase(sessionData);
      
      // Set auto-cleanup timer (2 hours)
      setTimeout(() => this.cleanupIdleSession(userId), 2 * 60 * 60 * 1000);

      return {
        sessionId: container.id,
        vncUrl: `vnc://your-ec2-ip:${vncPort}`,
        webUrl: `https://your-domain/vnc/${userId}`, // Proxy through nginx
        status: 'running',
        labId
      };
    } catch (error) {
      console.error('Desktop creation error:', error);
      throw new Error('Failed to create desktop session');
    }
  }

  async terminateUserSession(userId) {
    const session = this.activeSessions.get(userId);
    if (!session) return { status: 'not_found' };

    try {
      const container = docker.getContainer(session.containerId);
      await container.stop({ t: 10 }); // Grace period
      await container.remove();
      
      this.activeSessions.delete(userId);
      this.releasePort(session.vncPort);
      this.releasePort(session.webPort);
      
      await this.updateSessionInDatabase(session.containerId, 'terminated');
      
      return { status: 'terminated' };
    } catch (error) {
      console.error('Termination error:', error);
      throw error;
    }
  }

  getNextVNCPort() {
    return this.vncPortCounter++;
  }

  getNextWebPort() {
    return this.portCounter++;
  }

  releasePort(port) {
    // In production, implement proper port management
    console.log(`Released port ${port}`);
  }

  async cleanupIdleSession(userId) {
    const session = this.activeSessions.get(userId);
    if (session && Date.now() - session.lastAccessed > 2 * 60 * 60 * 1000) {
      console.log(`Cleaning up idle session for user ${userId}`);
      await this.terminateUserSession(userId);
    }
  }

  async isContainerRunning(containerId) {
    try {
      const container = docker.getContainer(containerId);
      const info = await container.inspect();
      return info.State.Running;
    } catch (error) {
      return false;
    }
  }

  async saveSessionToDatabase(session) {
    // Implementation depends on your database
    console.log('Saving session to database:', session);
  }

  async updateSessionInDatabase(containerId, status) {
    // Implementation depends on your database
    console.log(`Updating session ${containerId} to ${status}`);
  }
}

module.exports = CheapDesktopManager;
```

### 3. Nginx Proxy Configuration for Web Access
```nginx
# /etc/nginx/sites-available/kali-proxy
upstream kali_backend {
    least_conn;
    server 127.0.0.1:6081;
    server 127.0.0.1:6082;
    server 127.0.0.1:6083;
    # Add more as needed
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    # VNC web access with user-specific routing
    location ~ ^/vnc/(\d+)$ {
        set $user_id $1;
        set $port 6080;
        
        # Calculate port based on user ID (implement your logic)
        access_by_lua_block {
            local user_id = tonumber(ngx.var.user_id)
            ngx.var.port = 6080 + (user_id % 100)  -- Simple port assignment
        }
        
        proxy_pass http://127.0.0.1:$port;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://your-backend-api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Cost Optimization Script
```bash
#!/bin/bash
# cost-optimization.sh - Auto-scaling script for EC2 instances

INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
CLOUDWATCH_NAMESPACE="ModulusLMS/Desktop"

# Monitor container count and resource usage
CONTAINER_COUNT=$(docker ps | grep kali- | wc -l)
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')

# Send metrics to CloudWatch
aws cloudwatch put-metric-data \
    --namespace $CLOUDWATCH_NAMESPACE \
    --metric-data \
    MetricName=ActiveContainers,Value=$CONTAINER_COUNT,Unit=Count \
    MetricName=CPUUtilization,Value=$CPU_USAGE,Unit=Percent \
    MetricName=MemoryUtilization,Value=$MEMORY_USAGE,Unit=Percent

# Auto-scale logic
if [ $CONTAINER_COUNT -gt 20 ] && [ $(echo "$CPU_USAGE > 80" | bc) -eq 1 ]; then
    echo "High load detected, triggering scale-out"
    # Trigger another instance launch
    aws autoscaling set-desired-capacity \
        --auto-scaling-group-name kali-desktop-asg \
        --desired-capacity $(($(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names kali-desktop-asg --query 'AutoScalingGroups[0].DesiredCapacity') + 1))
fi

# Clean up idle containers
docker ps --format "table {{.Names}}\t{{.Status}}" | grep "kali-" | while read line; do
    CONTAINER_NAME=$(echo $line | awk '{print $1}')
    STATUS=$(echo $line | awk '{print $2}')
    
    if [[ $STATUS == *"hours"* ]]; then
        echo "Cleaning up idle container: $CONTAINER_NAME"
        docker stop $CONTAINER_NAME
        docker rm $CONTAINER_NAME
    fi
done
```
