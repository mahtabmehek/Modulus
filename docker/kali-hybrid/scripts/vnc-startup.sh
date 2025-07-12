#!/bin/bash
# VNC startup script for Kali Linux desktop with hybrid storage

set -e

# Get environment variables
USER_ID=${USER_ID:-1000}
LAB_ID=${LAB_ID:-default}
S3_BUCKET=${S3_BUCKET:-modulus-user-data}
VNC_DISPLAY=${VNC_DISPLAY:-:1}
NO_VNC_PORT=${NO_VNC_PORT:-6080}

echo "=== Modulus LMS Kali Desktop Startup ==="
echo "User ID: $USER_ID"
echo "Lab ID: $LAB_ID"
echo "S3 Bucket: $S3_BUCKET"
echo "VNC Display: $VNC_DISPLAY"
echo "noVNC Port: $NO_VNC_PORT"
echo "========================================"

# Restore user data from S3 (if available)
echo "Restoring user data..."
/opt/restore-user-data.sh

# Setup VNC server for the user
echo "Starting VNC server..."
su - student -c "vncserver $VNC_DISPLAY -geometry 1280x720 -depth 24 -localhost no -SecurityTypes VncAuth"

# Start noVNC web client
echo "Starting noVNC web client..."
su - student -c "/usr/share/novnc/utils/launch.sh --vnc localhost:590${VNC_DISPLAY#:} --listen $NO_VNC_PORT --web /usr/share/novnc" &

# Setup periodic backup (every 15 minutes)
echo "Setting up periodic backup..."
(
  while true; do
    sleep 900  # 15 minutes
    echo "Running periodic backup..."
    /opt/backup-user-data.sh
  done
) &

# Setup backup on container termination
cleanup() {
    echo "Container terminating - running final backup..."
    /opt/backup-user-data.sh
    echo "Final backup completed"
    exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for VNC server to start
echo "Waiting for VNC server to be ready..."
sleep 10

# Check if VNC is running
VNC_PORT=590${VNC_DISPLAY#:}
if netstat -ln | grep -q ":$VNC_PORT "; then
    echo "✅ VNC server is running on port $VNC_PORT"
else
    echo "❌ VNC server failed to start"
    exit 1
fi

# Check if noVNC is running
if netstat -ln | grep -q ":$NO_VNC_PORT "; then
    echo "✅ noVNC web client is running on port $NO_VNC_PORT"
else
    echo "❌ noVNC web client failed to start"
    exit 1
fi

echo "🚀 Container ready for user $USER_ID"
echo "📱 VNC URL: vnc://localhost:$VNC_PORT"
echo "🌐 Web URL: http://localhost:$NO_VNC_PORT/vnc.html"

# Keep container running and handle signals
while true; do
    sleep 30
    
    # Check if VNC is still running
    if ! netstat -ln | grep -q ":$VNC_PORT "; then
        echo "VNC server died, restarting..."
        su - student -c "vncserver $VNC_DISPLAY -geometry 1280x720 -depth 24 -localhost no -SecurityTypes VncAuth"
    fi
    
    # Update last accessed time for session management
    touch /tmp/last_accessed
done
