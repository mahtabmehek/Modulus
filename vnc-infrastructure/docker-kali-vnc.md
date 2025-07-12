# VNC Kali Linux - Docker Container Approach

## Overview
Use Docker containers running Kali Linux with VNC on a few larger EC2 instances.

## Cost Analysis
- **Single c5.2xlarge instance**: ~$0.34/hour (8 vCPU, 16GB RAM)
- **Can run 8-12 concurrent Kali containers**
- **Cost per user**: ~$0.03-0.05/hour
- **Most cost-effective for high usage**

## Docker Setup

### 1. Kali VNC Dockerfile
```dockerfile
FROM kalilinux/kali-rolling

# Install desktop environment and VNC
RUN apt update && apt upgrade -y && \
    apt install -y \
    xfce4 \
    xfce4-goodies \
    tightvncserver \
    novnc \
    websockify \
    supervisor \
    firefox-esr \
    # Essential Kali tools
    nmap \
    wireshark \
    metasploit-framework \
    burpsuite \
    sqlmap \
    nikto \
    dirb \
    hydra \
    john \
    hashcat \
    aircrack-ng \
    && apt clean

# Create user
RUN useradd -m -s /bin/bash kaliuser && \
    echo "kaliuser:password" | chpasswd && \
    mkdir -p /home/kaliuser/.vnc

# Setup VNC
RUN echo "#!/bin/bash\nxrdb $HOME/.Xresources\nstartxfce4 &" > /home/kaliuser/.vnc/xstartup && \
    chmod +x /home/kaliuser/.vnc/xstartup && \
    chown -R kaliuser:kaliuser /home/kaliuser

# Setup supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose VNC and noVNC ports
EXPOSE 5901 6080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

### 2. Supervisor Configuration
```ini
[supervisord]
nodaemon=true
user=root

[program:vnc]
command=/usr/bin/vncserver :1 -geometry 1024x768 -depth 24 -localhost no
user=kaliuser
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

[program:novnc]
command=/usr/share/novnc/utils/launch.sh --vnc localhost:5901 --listen 6080
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
```

### 3. Container Management API
```javascript
// Add to backend/routes/desktop.js
const express = require('express');
const Docker = require('dockerode');
const router = express.Router();
const docker = new Docker();

// Create new Kali container for user
router.post('/create/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionId = `kali-${userId}-${Date.now()}`;
    
    const container = await docker.createContainer({
      Image: 'modulus-kali:latest',
      name: sessionId,
      ExposedPorts: {
        '5901/tcp': {},
        '6080/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '5901/tcp': [{ HostPort: '0' }], // Random port
          '6080/tcp': [{ HostPort: '0' }]  // Random port
        },
        Memory: 2147483648, // 2GB RAM limit
        CpuShares: 1024     // Fair CPU sharing
      },
      Env: [
        `USER_ID=${userId}`,
        `SESSION_ID=${sessionId}`
      ]
    });

    await container.start();
    const containerInfo = await container.inspect();
    
    const vncPort = containerInfo.NetworkSettings.Ports['5901/tcp'][0].HostPort;
    const webPort = containerInfo.NetworkSettings.Ports['6080/tcp'][0].HostPort;
    
    // Store session in database
    await req.app.locals.db.query(
      'INSERT INTO desktop_sessions (user_id, session_id, container_id, vnc_port, web_port, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, sessionId, container.id, vncPort, webPort, 'running']
    );

    res.json({
      sessionId,
      vncUrl: `vnc://your-server:${vncPort}`,
      webUrl: `https://your-server:${webPort}/vnc.html`,
      status: 'running'
    });
  } catch (error) {
    console.error('Container creation error:', error);
    res.status(500).json({ error: 'Failed to create desktop session' });
  }
});

// Terminate container
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const container = docker.getContainer(sessionId);
    await container.stop();
    await container.remove();
    
    // Update database
    await req.app.locals.db.query(
      'UPDATE desktop_sessions SET status = $1, ended_at = NOW() WHERE session_id = $2',
      ['terminated', sessionId]
    );

    res.json({ status: 'terminated' });
  } catch (error) {
    console.error('Container termination error:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

module.exports = router;
```
