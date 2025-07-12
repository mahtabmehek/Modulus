# User Data Persistence for VNC Kali Linux

## Option 1: EBS Volume-Based Persistence (Recommended)

### How It Works
- Each user gets a dedicated EBS volume (mounted as `/home/student`)
- User settings, files, and custom installations persist across sessions
- Volumes are attached/detached dynamically based on user sessions

### Cost Analysis
- **EBS GP3 Volume**: $0.08/GB/month
- **10GB per user**: ~$0.80/month per user
- **100 users**: ~$80/month for storage
- **Very reasonable for persistent data**

### Implementation

#### 1. Enhanced Docker Container with Volume Support
```dockerfile
FROM kalilinux/kali-rolling:latest

# Install base system
RUN apt update && apt install -y \
    xfce4-session xfce4-panel xfce4-desktop xfwm4 \
    tightvncserver novnc websockify supervisor \
    firefox-esr gnome-terminal \
    # Core Kali tools
    nmap wireshark-qt burpsuite sqlmap dirb \
    # Development tools users might install
    git vim nano curl wget \
    && apt clean && rm -rf /var/lib/apt/lists/*

# Create user with specific UID/GID for volume permissions
RUN groupadd -g 1000 student && \
    useradd -u 1000 -g 1000 -m -s /bin/bash student && \
    echo "student:student123" | chpasswd

# Setup VNC configuration template
COPY vnc-startup.sh /opt/vnc-startup.sh
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN chmod +x /opt/vnc-startup.sh

# Volume mount point for user data
VOLUME ["/home/student"]

EXPOSE 5901 6080
CMD ["/opt/vnc-startup.sh"]
```

#### 2. Enhanced Desktop Manager with EBS Volume Management
```javascript
// backend/services/PersistentDesktopManager.js
const AWS = require('aws-sdk');
const Docker = require('dockerode');

class PersistentDesktopManager {
  constructor() {
    this.ec2 = new AWS.EC2({ region: process.env.AWS_REGION });
    this.docker = new Docker();
    this.activeSessions = new Map();
    this.userVolumes = new Map(); // Cache volume info
  }

  async createUserSession(userId, labId) {
    try {
      // 1. Get or create user's EBS volume
      const volumeId = await this.getOrCreateUserVolume(userId);
      
      // 2. Attach volume to current EC2 instance
      const deviceName = await this.attachVolumeToInstance(volumeId);
      
      // 3. Wait for volume to be available
      await this.waitForVolumeAttachment(deviceName);
      
      // 4. Format volume if it's new
      await this.ensureVolumeFormatted(deviceName, userId);
      
      // 5. Create container with volume mounted
      const session = await this.createContainerWithVolume(userId, labId, deviceName);
      
      return session;
    } catch (error) {
      console.error('Persistent session creation error:', error);
      throw error;
    }
  }

  async getOrCreateUserVolume(userId) {
    // Check if user already has a volume
    const existingVolumes = await this.ec2.describeVolumes({
      Filters: [
        { Name: 'tag:UserId', Values: [userId.toString()] },
        { Name: 'tag:Type', Values: ['UserData'] },
        { Name: 'state', Values: ['available', 'in-use'] }
      ]
    }).promise();

    if (existingVolumes.Volumes.length > 0) {
      return existingVolumes.Volumes[0].VolumeId;
    }

    // Create new volume for user
    console.log(`Creating new EBS volume for user ${userId}`);
    const volume = await this.ec2.createVolume({
      Size: 10, // 10GB
      VolumeType: 'gp3',
      AvailabilityZone: await this.getCurrentAZ(),
      TagSpecifications: [
        {
          ResourceType: 'volume',
          Tags: [
            { Key: 'UserId', Value: userId.toString() },
            { Key: 'Type', Value: 'UserData' },
            { Key: 'Project', Value: 'ModulusLMS' },
            { Key: 'Name', Value: `modulus-user-${userId}` }
          ]
        }
      ]
    }).promise();

    // Wait for volume to be available
    await this.ec2.waitFor('volumeAvailable', {
      VolumeIds: [volume.VolumeId]
    }).promise();

    return volume.VolumeId;
  }

  async attachVolumeToInstance(volumeId) {
    const instanceId = await this.getCurrentInstanceId();
    
    // Find available device name
    const deviceName = await this.getAvailableDeviceName();
    
    await this.ec2.attachVolume({
      VolumeId: volumeId,
      InstanceId: instanceId,
      Device: deviceName
    }).promise();

    return deviceName;
  }

  async ensureVolumeFormatted(deviceName, userId) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      // Check if volume is already formatted
      const { stdout } = await execAsync(`lsblk -f ${deviceName}`);
      
      if (!stdout.includes('ext4')) {
        console.log(`Formatting new volume for user ${userId}`);
        // Format with ext4
        await execAsync(`mkfs.ext4 ${deviceName}`);
      }

      // Create mount point and mount
      const mountPoint = `/mnt/user-${userId}`;
      await execAsync(`mkdir -p ${mountPoint}`);
      await execAsync(`mount ${deviceName} ${mountPoint}`);
      
      // Set proper permissions
      await execAsync(`chown 1000:1000 ${mountPoint}`);
      
      return mountPoint;
    } catch (error) {
      console.error('Volume formatting error:', error);
      throw error;
    }
  }

  async createContainerWithVolume(userId, labId, deviceName) {
    const mountPoint = `/mnt/user-${userId}`;
    const vncPort = this.getNextVNCPort();
    const webPort = this.getNextWebPort();

    const container = await this.docker.createContainer({
      Image: 'modulus-kali-persistent:latest',
      name: `kali-${userId}-${Date.now()}`,
      Env: [
        `USER_ID=${userId}`,
        `LAB_ID=${labId}`,
        `VNC_DISPLAY=:${vncPort - 5900}`
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
        Binds: [
          `${mountPoint}:/home/student:rw` // Mount user volume
        ],
        Memory: 1073741824, // 1GB RAM
        CpuShares: 1024
      }
    });

    await container.start();

    const sessionData = {
      userId,
      labId,
      containerId: container.id,
      vncPort,
      webPort,
      volumeMount: mountPoint,
      deviceName,
      createdAt: Date.now()
    };

    this.activeSessions.set(userId, sessionData);

    return {
      sessionId: container.id,
      vncUrl: `vnc://your-ec2-ip:${vncPort}`,
      webUrl: `https://your-domain/vnc/${userId}`,
      status: 'running',
      persistent: true
    };
  }

  async terminateUserSession(userId) {
    const session = this.activeSessions.get(userId);
    if (!session) return { status: 'not_found' };

    try {
      // Stop container
      const container = this.docker.getContainer(session.containerId);
      await container.stop();
      await container.remove();

      // Unmount volume
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      await execAsync(`umount ${session.volumeMount}`);
      await execAsync(`rmdir ${session.volumeMount}`);

      // Detach EBS volume
      const volumeId = await this.getVolumeIdFromDevice(session.deviceName);
      await this.ec2.detachVolume({
        VolumeId: volumeId,
        Force: false
      }).promise();

      this.activeSessions.delete(userId);

      return { status: 'terminated', dataPersisted: true };
    } catch (error) {
      console.error('Termination error:', error);
      throw error;
    }
  }

  // Helper methods
  async getCurrentInstanceId() {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync('curl -s http://169.254.169.254/latest/meta-data/instance-id');
    return stdout.trim();
  }

  async getCurrentAZ() {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync('curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone');
    return stdout.trim();
  }

  async getAvailableDeviceName() {
    // AWS Linux device naming: /dev/xvdf through /dev/xvdp
    const deviceLetters = 'fghijklmnop';
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    for (const letter of deviceLetters) {
      const deviceName = `/dev/xvd${letter}`;
      try {
        await execAsync(`lsblk ${deviceName}`);
      } catch (error) {
        // Device not in use
        return deviceName;
      }
    }
    
    throw new Error('No available device names');
  }

  getNextVNCPort() {
    // Implementation for port management
    return 5902 + this.activeSessions.size;
  }

  getNextWebPort() {
    // Implementation for port management  
    return 6080 + this.activeSessions.size;
  }
}

module.exports = PersistentDesktopManager;
```

#### 3. User Data Backup Strategy
```javascript
// backend/services/UserDataBackup.js
class UserDataBackup {
  constructor() {
    this.s3 = new AWS.S3({ region: process.env.AWS_REGION });
  }

  async createUserSnapshot(userId) {
    try {
      // Create EBS snapshot
      const volumeId = await this.getUserVolumeId(userId);
      
      const snapshot = await this.ec2.createSnapshot({
        VolumeId: volumeId,
        Description: `User ${userId} data backup - ${new Date().toISOString()}`,
        TagSpecifications: [
          {
            ResourceType: 'snapshot',
            Tags: [
              { Key: 'UserId', Value: userId.toString() },
              { Key: 'Type', Value: 'UserBackup' },
              { Key: 'Created', Value: new Date().toISOString() }
            ]
          }
        ]
      }).promise();

      return snapshot.SnapshotId;
    } catch (error) {
      console.error('Backup creation error:', error);
      throw error;
    }
  }

  async scheduleRegularBackups(userId) {
    // Create weekly snapshots automatically
    const rule = {
      Name: `modulus-user-${userId}-backup`,
      ScheduleExpression: 'rate(7 days)', // Weekly
      State: 'ENABLED',
      Targets: [
        {
          Id: '1',
          Arn: 'arn:aws:lambda:region:account:function:create-user-snapshot',
          Input: JSON.stringify({ userId })
        }
      ]
    };
    
    // Implementation would use CloudWatch Events/EventBridge
    console.log('Backup scheduled for user:', userId);
  }
}
```
