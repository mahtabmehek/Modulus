# Option 3: Hybrid Approach - Selective Persistence

## How It Works
- Save only important user data (not full system)
- Store user settings, custom scripts, and project files
- Use S3 for backup, local SSD for session storage
- Fresh Kali environment each time with user data restored

### What Gets Persisted
✅ User settings and preferences  
✅ Custom scripts and tools  
✅ Project files and documents  
✅ Browser bookmarks and history  
✅ SSH keys and configurations  
❌ System modifications  
❌ Installed packages (except via script)  
❌ Full filesystem state  

### Cost Analysis
- **S3 storage**: $0.023/GB/month
- **5GB per user**: ~$0.12/month per user
- **Ultra-cheap for most use cases**
- **Fast session startup**

### Implementation

#### 1. Smart Backup Container
```dockerfile
FROM kalilinux/kali-rolling:latest

# Install base system + backup tools
RUN apt update && apt install -y \
    xfce4-session xfce4-panel xfce4-desktop xfwm4 \
    tightvncserver novnc websockify supervisor \
    firefox-esr gnome-terminal \
    nmap wireshark-qt burpsuite sqlmap dirb \
    # Backup tools
    awscli rsync jq \
    && apt clean

# Create user
RUN groupadd -g 1000 student && \
    useradd -u 1000 -g 1000 -m -s /bin/bash student

# Setup backup/restore scripts
COPY backup-user-data.sh /opt/backup-user-data.sh
COPY restore-user-data.sh /opt/restore-user-data.sh
COPY vnc-startup-hybrid.sh /opt/vnc-startup.sh
RUN chmod +x /opt/*.sh

EXPOSE 5901 6080
CMD ["/opt/vnc-startup.sh"]
```

#### 2. User Data Backup Script
```bash
#!/bin/bash
# backup-user-data.sh

USER_ID=${USER_ID:-1000}
S3_BUCKET=${S3_BUCKET:-modulus-user-data}
HOME_DIR="/home/student"

echo "Starting backup for user $USER_ID..."

# Create backup directory
BACKUP_DIR="/tmp/backup-$USER_ID"
mkdir -p "$BACKUP_DIR"

# Backup specific directories and files
backup_paths=(
    ".config"           # User settings
    ".local/share"      # Application data
    ".ssh"              # SSH keys
    ".gitconfig"        # Git config
    ".vimrc"           # Vim config
    ".bashrc"          # Shell config
    ".profile"         # Profile
    "Desktop"          # Desktop files
    "Documents"        # User documents
    "Scripts"          # Custom scripts
    "Projects"         # Project files
    ".mozilla"         # Firefox data
)

# Copy user data to backup directory
for path in "${backup_paths[@]}"; do
    if [ -e "$HOME_DIR/$path" ]; then
        cp -r "$HOME_DIR/$path" "$BACKUP_DIR/" 2>/dev/null || true
    fi
done

# Create metadata file
cat > "$BACKUP_DIR/metadata.json" << EOF
{
    "userId": "$USER_ID",
    "backupDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "1.0",
    "contents": $(printf '%s\n' "${backup_paths[@]}" | jq -R . | jq -s .)
}
EOF

# Compress backup
cd /tmp
tar -czf "user-$USER_ID-backup.tar.gz" "backup-$USER_ID"

# Upload to S3
aws s3 cp "user-$USER_ID-backup.tar.gz" "s3://$S3_BUCKET/users/$USER_ID/latest.tar.gz"

# Keep timestamped backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
aws s3 cp "user-$USER_ID-backup.tar.gz" "s3://$S3_BUCKET/users/$USER_ID/backup-$TIMESTAMP.tar.gz"

# Cleanup
rm -rf "/tmp/backup-$USER_ID" "/tmp/user-$USER_ID-backup.tar.gz"

echo "Backup completed for user $USER_ID"
```

#### 3. User Data Restore Script
```bash
#!/bin/bash
# restore-user-data.sh

USER_ID=${USER_ID:-1000}
S3_BUCKET=${S3_BUCKET:-modulus-user-data}
HOME_DIR="/home/student"

echo "Restoring data for user $USER_ID..."

# Check if backup exists
if aws s3 ls "s3://$S3_BUCKET/users/$USER_ID/latest.tar.gz" >/dev/null 2>&1; then
    echo "Found existing backup, restoring..."
    
    # Download backup
    aws s3 cp "s3://$S3_BUCKET/users/$USER_ID/latest.tar.gz" "/tmp/restore-$USER_ID.tar.gz"
    
    # Extract backup
    cd /tmp
    tar -xzf "restore-$USER_ID.tar.gz"
    
    # Restore files
    if [ -d "backup-$USER_ID" ]; then
        cp -r backup-$USER_ID/* "$HOME_DIR/" 2>/dev/null || true
        chown -R student:student "$HOME_DIR"
        
        echo "User data restored successfully"
    fi
    
    # Cleanup
    rm -rf "/tmp/restore-$USER_ID.tar.gz" "/tmp/backup-$USER_ID"
else
    echo "No existing backup found for user $USER_ID, starting fresh"
    
    # Create default directories
    mkdir -p "$HOME_DIR"/{Desktop,Documents,Scripts,Projects}
    chown -R student:student "$HOME_DIR"
fi
```

#### 4. Container Startup with Restore
```bash
#!/bin/bash
# vnc-startup-hybrid.sh

USER_ID=${USER_ID:-1000}

echo "Starting Kali container for user $USER_ID..."

# Restore user data from S3
/opt/restore-user-data.sh

# Start VNC server
su - student -c "vncserver :1 -geometry 1024x768 -depth 24 -localhost no"

# Start noVNC
su - student -c "/usr/share/novnc/utils/launch.sh --vnc localhost:5901 --listen 6080" &

# Setup periodic backup (every 30 minutes)
(
  while true; do
    sleep 1800  # 30 minutes
    /opt/backup-user-data.sh
  done
) &

# Setup backup on container termination
trap '/opt/backup-user-data.sh; exit 0' SIGTERM SIGINT

echo "Container ready for user $USER_ID"

# Keep container running
tail -f /dev/null
```

#### 5. Desktop Manager with Hybrid Storage
```javascript
// backend/services/HybridDesktopManager.js
class HybridDesktopManager {
  constructor() {
    this.docker = new Docker();
    this.s3 = new AWS.S3({ region: process.env.AWS_REGION });
    this.activeSessions = new Map();
  }

  async createUserSession(userId, labId) {
    try {
      const vncPort = this.getNextVNCPort();
      const webPort = this.getNextWebPort();

      const container = await this.docker.createContainer({
        Image: 'modulus-kali-hybrid:latest',
        name: `kali-${userId}-${Date.now()}`,
        Env: [
          `USER_ID=${userId}`,
          `LAB_ID=${labId}`,
          `S3_BUCKET=modulus-user-data`,
          `AWS_DEFAULT_REGION=${process.env.AWS_REGION}`
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
          Memory: 1073741824, // 1GB
          CpuShares: 1024,
          // Mount AWS credentials for S3 access
          Binds: [
            '/home/ubuntu/.aws:/home/student/.aws:ro'
          ]
        }
      });

      await container.start();

      // Wait for restore to complete (check every 5 seconds for up to 2 minutes)
      await this.waitForContainerReady(container.id, 120);

      const sessionData = {
        userId,
        labId,
        containerId: container.id,
        vncPort,
        webPort,
        createdAt: Date.now(),
        persistent: 'hybrid'
      };

      this.activeSessions.set(userId, sessionData);

      return {
        sessionId: container.id,
        vncUrl: `vnc://your-ec2-ip:${vncPort}`,
        webUrl: `https://your-domain/vnc/${userId}`,
        status: 'running',
        persistenceType: 'hybrid'
      };
    } catch (error) {
      console.error('Hybrid session creation error:', error);
      throw error;
    }
  }

  async terminateUserSession(userId) {
    const session = this.activeSessions.get(userId);
    if (!session) return { status: 'not_found' };

    try {
      const container = this.docker.getContainer(session.containerId);
      
      // Trigger final backup before termination
      await container.exec({
        Cmd: ['/opt/backup-user-data.sh'],
        AttachStdout: true,
        AttachStderr: true
      });

      // Give backup time to complete
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Stop container
      await container.stop();
      await container.remove();

      this.activeSessions.delete(userId);

      return { 
        status: 'terminated', 
        dataPersisted: true,
        persistenceType: 'hybrid'
      };
    } catch (error) {
      console.error('Hybrid termination error:', error);
      throw error;
    }
  }

  async waitForContainerReady(containerId, timeoutSeconds) {
    const container = this.docker.getContainer(containerId);
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      try {
        const logs = await container.logs({
          stdout: true,
          stderr: true,
          tail: 10
        });

        if (logs.toString().includes('Container ready for user')) {
          return true;
        }
      } catch (error) {
        // Container might not be ready yet
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Container failed to become ready within timeout');
  }

  // User data management methods
  async listUserBackups(userId) {
    try {
      const result = await this.s3.listObjectsV2({
        Bucket: 'modulus-user-data',
        Prefix: `users/${userId}/backup-`,
        MaxKeys: 10
      }).promise();

      return result.Contents.map(obj => ({
        filename: obj.Key.split('/').pop(),
        date: obj.LastModified,
        size: obj.Size
      }));
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async restoreUserBackup(userId, backupFilename) {
    // Implementation to restore a specific backup
    console.log(`Restoring backup ${backupFilename} for user ${userId}`);
  }
}

module.exports = HybridDesktopManager;
```

## Summary of Persistence Options

### Option 1: EBS Volumes (Full Persistence)
- **Pros**: Complete user environment persistence, can install software
- **Cons**: Higher storage cost (~$0.80/user/month)
- **Best for**: Advanced users, long-term projects

### Option 2: NFS (Shared Persistence)  
- **Pros**: Lower cost, centralized management
- **Cons**: Single point of failure, NFS complexity
- **Best for**: Budget-conscious deployments

### Option 3: Hybrid S3 (Selective Persistence)
- **Pros**: Ultra-low cost (~$0.12/user/month), fast startup
- **Cons**: Limited to user data only, can't persist installed software
- **Best for**: Educational labs, standardized environments

## Recommendation for Your LMS

For a cybersecurity education platform, I recommend **Option 3 (Hybrid)** because:

1. **Students typically don't need to install custom software** - Kali comes pre-configured
2. **Lab exercises are usually standardized** - fresh environment is often preferred  
3. **User scripts and projects are most important** - these get preserved
4. **Ultra-low storage costs** scale well for many students
5. **Fast session startup** since no large volume mounting needed

Would you like me to implement the hybrid persistence approach for your LMS?
