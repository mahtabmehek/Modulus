# Option 2: NFS-Based User Persistence (Cheaper Alternative)

## How It Works
- Single large EBS volume with NFS server
- All user home directories on shared storage
- Lower cost but requires NFS management

### Cost Analysis
- **Single 500GB EBS volume**: ~$40/month
- **Supports 50+ users**: ~$0.80/month per user
- **Cheaper than individual EBS volumes**
- **Requires NFS setup and management**

### Implementation

#### 1. NFS Server Setup
```bash
#!/bin/bash
# setup-nfs-server.sh

# Create and mount large EBS volume for user data
DEVICE="/dev/xvdf"  # Adjust based on your setup
MOUNT_POINT="/nfs/userdata"

# Format and mount the volume
mkfs.ext4 $DEVICE
mkdir -p $MOUNT_POINT
mount $DEVICE $MOUNT_POINT

# Add to fstab for persistence
echo "$DEVICE $MOUNT_POINT ext4 defaults 0 2" >> /etc/fstab

# Install and configure NFS server
apt update && apt install -y nfs-kernel-server

# Configure NFS exports
cat >> /etc/exports << EOF
$MOUNT_POINT/users *(rw,sync,no_subtree_check,no_root_squash)
EOF

# Create users directory
mkdir -p $MOUNT_POINT/users
chmod 755 $MOUNT_POINT/users

# Start NFS services
systemctl enable nfs-kernel-server
systemctl start nfs-kernel-server
exportfs -a

echo "NFS server setup complete!"
```

#### 2. Container with NFS Mount
```dockerfile
FROM kalilinux/kali-rolling:latest

# Install NFS client
RUN apt update && apt install -y \
    nfs-common \
    xfce4-session xfce4-panel xfce4-desktop xfwm4 \
    tightvncserver novnc websockify supervisor \
    firefox-esr gnome-terminal \
    nmap wireshark-qt burpsuite sqlmap dirb \
    && apt clean

# Create user
RUN groupadd -g 1000 student && \
    useradd -u 1000 -g 1000 -m -s /bin/bash student

# Setup VNC
COPY vnc-startup-nfs.sh /opt/vnc-startup.sh
RUN chmod +x /opt/vnc-startup.sh

EXPOSE 5901 6080
CMD ["/opt/vnc-startup.sh"]
```

#### 3. NFS Startup Script
```bash
#!/bin/bash
# vnc-startup-nfs.sh

USER_ID=${USER_ID:-1000}
NFS_SERVER=${NFS_SERVER:-172.31.0.100}

# Mount user's NFS directory
USER_DIR="/nfs/users/user-$USER_ID"
HOME_DIR="/home/student"

# Ensure NFS mount point exists
mkdir -p /mnt/nfs

# Mount NFS
mount -t nfs $NFS_SERVER:/nfs/userdata/users /mnt/nfs

# Create user directory if it doesn't exist
if [ ! -d "/mnt/nfs/user-$USER_ID" ]; then
    mkdir -p "/mnt/nfs/user-$USER_ID"
    
    # Copy default home directory contents
    cp -r /home/student/* "/mnt/nfs/user-$USER_ID/" 2>/dev/null || true
    chown -R student:student "/mnt/nfs/user-$USER_ID"
fi

# Bind mount user directory to home
mount --bind "/mnt/nfs/user-$USER_ID" "$HOME_DIR"

# Start VNC as student user
su - student -c "vncserver :1 -geometry 1024x768 -depth 24"
su - student -c "/usr/share/novnc/utils/launch.sh --vnc localhost:5901 --listen 6080" &

# Keep container running
tail -f /dev/null
```

#### 4. Desktop Manager with NFS
```javascript
// Simplified version without EBS volume management
class NFSDesktopManager {
  async createUserSession(userId, labId) {
    const vncPort = this.getNextVNCPort();
    const webPort = this.getNextWebPort();

    const container = await this.docker.createContainer({
      Image: 'modulus-kali-nfs:latest',
      name: `kali-${userId}-${Date.now()}`,
      Env: [
        `USER_ID=${userId}`,
        `LAB_ID=${labId}`,
        `NFS_SERVER=172.31.0.100` // Your NFS server IP
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
        Privileged: true, // Required for NFS mounting
        Memory: 1073741824, // 1GB
        CpuShares: 1024
      }
    });

    await container.start();
    return this.createSessionResponse(container, userId, vncPort, webPort);
  }
}
```
