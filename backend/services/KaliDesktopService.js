const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class KaliDesktopService {
  constructor() {
    this.activeContainers = new Map(); // userId -> containerInfo
  }

  async createKaliSession(userId) {
    try {
      // Check if user already has an active container
      if (this.activeContainers.has(userId)) {
        const existing = this.activeContainers.get(userId);
        const isRunning = await this.isContainerRunning(existing.containerId);
        if (isRunning) {
          return existing;
        } else {
          // Clean up dead container reference
          this.activeContainers.delete(userId);
        }
      }

      // Generate unique container name
      const containerName = `kali-user-${userId}-${Date.now()}`;
      const port = 6900 + parseInt(userId); // Dynamic port based on user ID

      console.log(`🐉 Creating Kali container for user ${userId}...`);

      // Start Kali container with noVNC and 3GB memory limit
      const dockerCommand = `docker run -d --name ${containerName} -p ${port}:6901 -e VNC_PW=kali123 --cap-add=NET_ADMIN --cap-add=SYS_ADMIN --memory=3g --memory-swap=3g kasmweb/kali-rolling-desktop:1.14.0`;
      
      const { stdout } = await execPromise(dockerCommand);
      const containerId = stdout.trim();

      // Wait for container to be ready
      await this.waitForContainerReady(containerName);

      const session = {
        sessionId: containerId,
        containerId: containerId,
        containerName: containerName,
        userId: userId,
        vncUrl: `https://localhost:${port}`,
        webUrl: `https://localhost:${port}`,
        port: port,
        status: 'running',
        createdAt: new Date(),
        osType: 'Kali Linux',
        ipAddress: 'localhost'
      };

      this.activeContainers.set(userId, session);

      console.log(`✅ Kali container ready for user ${userId} at port ${port}`);
      return session;

    } catch (error) {
      console.error(`❌ Failed to create Kali session for user ${userId}:`, error);
      throw error;
    }
  }

  async terminateSession(userId) {
    try {
      const session = this.activeContainers.get(userId);
      if (!session) {
        return { success: false, message: 'No active session found' };
      }

      console.log(`🛑 Terminating Kali container for user ${userId}...`);

      // Stop and remove container
      await execPromise(`docker stop ${session.containerName}`);
      await execPromise(`docker rm ${session.containerName}`);

      this.activeContainers.delete(userId);

      console.log(`✅ Kali container terminated for user ${userId}`);
      return { success: true, message: 'Session terminated' };

    } catch (error) {
      console.error(`❌ Failed to terminate session for user ${userId}:`, error);
      throw error;
    }
  }

  async getSession(userId) {
    const session = this.activeContainers.get(userId);
    if (!session) {
      return null;
    }

    // Verify container is still running
    const isRunning = await this.isContainerRunning(session.containerId);
    if (!isRunning) {
      this.activeContainers.delete(userId);
      return null;
    }

    return session;
  }

  async isContainerRunning(containerId) {
    try {
      const { stdout } = await execPromise(`docker inspect --format='{{.State.Running}}' ${containerId}`);
      return stdout.trim() === 'true';
    } catch (error) {
      return false;
    }
  }

  async waitForContainerReady(containerName, maxWaitTime = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const { stdout } = await execPromise(`docker logs ${containerName} --tail 50`);
        if (stdout.includes('Desktop is ready')) {
          return true;
        }
      } catch (error) {
        // Container might not be ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Even if we don't see the ready message, assume it's ready after max wait time
    console.log(`⏰ Container ${containerName} assumed ready after ${maxWaitTime}ms`);
    return true;
  }

  async cleanupIdleSessions() {
    console.log('🧹 Cleaning up idle Kali sessions...');
    
    for (const [userId, session] of this.activeContainers.entries()) {
      const age = Date.now() - session.createdAt.getTime();
      const maxAge = 2 * 60 * 60 * 1000; // 2 hours
      
      if (age > maxAge) {
        console.log(`🕒 Session for user ${userId} exceeded max age, terminating...`);
        await this.terminateSession(userId);
      }
    }
  }

  getAllSessions() {
    return Array.from(this.activeContainers.values());
  }
}

module.exports = KaliDesktopService;
