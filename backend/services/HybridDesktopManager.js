const Docker = require('dockerode');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

class HybridDesktopManager {
  constructor() {
    this.docker = new Docker();
    this.s3 = new AWS.S3({ region: process.env.AWS_REGION || 'eu-west-2' });
    this.activeSessions = new Map();
    this.portCounter = 6081; // Start from 6081 for noVNC
    this.vncPortCounter = 5902; // Start from 5902 for VNC
    this.maxContainersPerInstance = 25;
    this.s3Bucket = process.env.USER_DATA_BUCKET || 'modulus-user-data';
    
    // Cleanup interval - check for idle sessions every 30 minutes
    setInterval(() => this.cleanupIdleSessions(), 30 * 60 * 1000);
  }

  async createUserSession(userId, labId) {
    try {
      // Check if user already has active session
      if (this.activeSessions.has(userId)) {
        const existingSession = this.activeSessions.get(userId);
        if (await this.isContainerRunning(existingSession.containerId)) {
          console.log(`User ${userId} already has active session`);
          return existingSession;
        } else {
          console.log(`Cleaning up stale session for user ${userId}`);
          this.activeSessions.delete(userId);
        }
      }

      console.log(`Creating new session for user ${userId}, lab ${labId}`);

      // Get available ports
      const vncPort = this.getNextVNCPort();
      const webPort = this.getNextWebPort();
      
      // Create container with hybrid storage
      const container = await this.docker.createContainer({
        Image: 'modulus-kali-hybrid:latest',
        name: `kali-${userId}-${Date.now()}`,
        Env: [
          `USER_ID=${userId}`,
          `LAB_ID=${labId}`,
          `S3_BUCKET=${this.s3Bucket}`,
          `AWS_DEFAULT_REGION=${process.env.AWS_REGION || 'eu-west-2'}`,
          `VNC_DISPLAY=:${vncPort - 5900}`,
          `NO_VNC_PORT=${webPort}`
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
          Memory: 1073741824, // 1GB RAM limit
          CpuShares: 1024,     // Limited CPU
          PidsLimit: 150,      // Limit processes
          ReadonlyRootfs: false,
          SecurityOpt: ['no-new-privileges'],
          NetworkMode: 'bridge',
          // Mount AWS credentials for S3 access (if available)
          Binds: this.getAWSCredentialMounts()
        },
        Labels: {
          'modulus.user.id': userId.toString(),
          'modulus.lab.id': labId.toString(),
          'modulus.type': 'desktop-session',
          'modulus.persistence': 'hybrid'
        }
      });

      await container.start();
      console.log(`Container started for user ${userId}: ${container.id}`);

      // Wait for container to be ready (data restore and VNC startup)
      await this.waitForContainerReady(container.id, 180); // 3 minutes timeout

      const sessionData = {
        userId,
        labId,
        containerId: container.id,
        vncPort,
        webPort,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        persistent: 'hybrid'
      };

      this.activeSessions.set(userId, sessionData);
      
      // Set auto-cleanup timer (2 hours of inactivity)
      this.setSessionTimeout(userId, 2 * 60 * 60 * 1000);

      const publicIP = await this.getPublicIP();
      
      return {
        sessionId: container.id,
        vncUrl: `vnc://${publicIP}:${vncPort}`,
        webUrl: `https://${process.env.DOMAIN || publicIP}/vnc/${userId}`,
        status: 'running',
        labId,
        vncPort,
        webPort,
        persistenceType: 'hybrid'
      };
    } catch (error) {
      console.error('Hybrid session creation error:', error);
      throw new Error(`Failed to create desktop session: ${error.message}`);
    }
  }

  async terminateUserSession(userId) {
    const session = this.activeSessions.get(userId);
    if (!session) {
      return { status: 'not_found' };
    }

    try {
      console.log(`Terminating session for user ${userId}`);
      
      const container = this.docker.getContainer(session.containerId);
      
      // Send SIGTERM to trigger backup script
      try {
        await container.kill({ signal: 'SIGTERM' });
        
        // Give backup time to complete (30 seconds)
        await new Promise(resolve => setTimeout(resolve, 30000));
      } catch (killError) {
        console.warn('Error sending SIGTERM:', killError.message);
      }

      // Force stop if still running
      try {
        await container.stop({ t: 10 }); // Grace period
      } catch (stopError) {
        console.warn('Container may already be stopped:', stopError.message);
      }

      // Remove container
      try {
        await container.remove();
      } catch (removeError) {
        console.warn('Error removing container:', removeError.message);
      }

      this.activeSessions.delete(userId);
      this.releasePort(session.vncPort);
      this.releasePort(session.webPort);

      console.log(`Session terminated for user ${userId}`);

      return { 
        status: 'terminated', 
        dataPersisted: true,
        persistenceType: 'hybrid'
      };
    } catch (error) {
      console.error('Hybrid termination error:', error);
      throw new Error(`Failed to terminate session: ${error.message}`);
    }
  }

  async isSessionActive(userId) {
    const session = this.activeSessions.get(userId);
    if (!session) return false;

    return await this.isContainerRunning(session.containerId);
  }

  async extendUserSession(userId) {
    const session = this.activeSessions.get(userId);
    if (!session) {
      return { success: false, message: 'No active session found' };
    }

    if (await this.isContainerRunning(session.containerId)) {
      session.lastAccessed = Date.now();
      this.setSessionTimeout(userId, 2 * 60 * 60 * 1000); // Reset 2-hour timer
      return { success: true, message: 'Session extended' };
    } else {
      this.activeSessions.delete(userId);
      return { success: false, message: 'Session no longer active' };
    }
  }

  async getSystemStatus() {
    try {
      const containers = await this.docker.listContainers();
      const kaliContainers = containers.filter(c => 
        c.Labels && c.Labels['modulus.type'] === 'desktop-session'
      );

      // Get system resources
      const { stdout: memInfo } = await exec('free -m');
      const { stdout: cpuInfo } = await exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
      
      return {
        activeContainers: kaliContainers.length,
        totalContainers: containers.length,
        memoryUsage: this.parseMemoryInfo(memInfo),
        cpuUsage: parseFloat(cpuInfo.trim()) || 0,
        maxContainers: this.maxContainersPerInstance,
        availableSlots: this.maxContainersPerInstance - kaliContainers.length
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        activeContainers: this.activeSessions.size,
        error: error.message
      };
    }
  }

  async getUserSessionStatus(userId) {
    const session = this.activeSessions.get(userId);
    if (!session) {
      return { hasSession: false };
    }

    const isRunning = await this.isContainerRunning(session.containerId);
    
    return {
      hasSession: true,
      isRunning,
      sessionInfo: isRunning ? {
        sessionId: session.containerId,
        labId: session.labId,
        createdAt: new Date(session.createdAt).toISOString(),
        lastAccessed: new Date(session.lastAccessed).toISOString(),
        vncPort: session.vncPort,
        webPort: session.webPort
      } : null
    };
  }

  // User data management methods
  async listUserBackups(userId) {
    try {
      const result = await this.s3.listObjectsV2({
        Bucket: this.s3Bucket,
        Prefix: `users/${userId}/backup-`,
        MaxKeys: 20
      }).promise();

      return result.Contents.map(obj => ({
        filename: obj.Key.split('/').pop(),
        date: obj.LastModified,
        size: obj.Size,
        key: obj.Key
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async restoreUserBackup(userId, backupKey) {
    // Implementation to restore a specific backup
    try {
      // Copy backup to latest.tar.gz
      await this.s3.copyObject({
        Bucket: this.s3Bucket,
        CopySource: `${this.s3Bucket}/${backupKey}`,
        Key: `users/${userId}/latest.tar.gz`
      }).promise();

      console.log(`Restored backup ${backupKey} for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  // Helper methods
  async waitForContainerReady(containerId, timeoutSeconds) {
    const container = this.docker.getContainer(containerId);
    const startTime = Date.now();

    console.log(`Waiting for container ${containerId} to be ready...`);

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      try {
        const logs = await container.logs({
          stdout: true,
          stderr: true,
          tail: 20
        });

        const logContent = logs.toString();
        if (logContent.includes('Container ready for user') || 
            logContent.includes('VNC server started') ||
            logContent.includes('noVNC started')) {
          console.log(`Container ${containerId} is ready`);
          return true;
        }

        if (logContent.includes('ERROR') || logContent.includes('FAILED')) {
          throw new Error(`Container startup failed: ${logContent}`);
        }
      } catch (error) {
        if (error.statusCode === 404) {
          throw new Error('Container not found');
        }
        // Container might not be ready yet, continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error(`Container failed to become ready within ${timeoutSeconds} seconds`);
  }

  async isContainerRunning(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();
      return info.State.Running;
    } catch (error) {
      return false;
    }
  }

  getNextVNCPort() {
    // Simple port allocation - in production, implement proper port management
    return this.vncPortCounter++;
  }

  getNextWebPort() {
    // Simple port allocation - in production, implement proper port management  
    return this.portCounter++;
  }

  releasePort(port) {
    // In production, implement proper port management to reuse ports
    console.log(`Released port ${port}`);
  }

  setSessionTimeout(userId, timeoutMs) {
    // Clear existing timeout
    if (this.sessionTimeouts && this.sessionTimeouts.has(userId)) {
      clearTimeout(this.sessionTimeouts.get(userId));
    }

    if (!this.sessionTimeouts) {
      this.sessionTimeouts = new Map();
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      console.log(`Session timeout for user ${userId}`);
      this.terminateUserSession(userId).catch(console.error);
    }, timeoutMs);

    this.sessionTimeouts.set(userId, timeoutId);
  }

  async cleanupIdleSessions() {
    console.log('Running idle session cleanup...');
    
    for (const [userId, session] of this.activeSessions.entries()) {
      const idleTime = Date.now() - session.lastAccessed;
      const maxIdleTime = 2 * 60 * 60 * 1000; // 2 hours

      if (idleTime > maxIdleTime) {
        console.log(`Cleaning up idle session for user ${userId} (idle for ${Math.round(idleTime / 60000)} minutes)`);
        try {
          await this.terminateUserSession(userId);
        } catch (error) {
          console.error(`Error cleaning up session for user ${userId}:`, error);
        }
      }
    }
  }

  async getPublicIP() {
    try {
      const { stdout } = await exec('curl -s http://169.254.169.254/latest/meta-data/public-ipv4');
      return stdout.trim();
    } catch (error) {
      console.warn('Could not get public IP:', error.message);
      return 'localhost';
    }
  }

  getAWSCredentialMounts() {
    const mounts = [];
    
    // Try to mount AWS credentials if they exist
    try {
      const fs = require('fs');
      if (fs.existsSync('/home/ubuntu/.aws')) {
        mounts.push('/home/ubuntu/.aws:/home/student/.aws:ro');
      } else if (fs.existsSync('/root/.aws')) {
        mounts.push('/root/.aws:/home/student/.aws:ro');
      }
    } catch (error) {
      console.warn('Could not check for AWS credentials:', error.message);
    }

    return mounts;
  }

  parseMemoryInfo(memInfo) {
    try {
      const lines = memInfo.split('\n');
      const memLine = lines.find(line => line.startsWith('Mem:'));
      if (memLine) {
        const parts = memLine.split(/\s+/);
        const total = parseInt(parts[1]);
        const used = parseInt(parts[2]);
        return {
          total: total,
          used: used,
          free: total - used,
          percentage: Math.round((used / total) * 100)
        };
      }
    } catch (error) {
      console.error('Error parsing memory info:', error);
    }
    return { error: 'Unable to parse memory information' };
  }
}

module.exports = HybridDesktopManager;
