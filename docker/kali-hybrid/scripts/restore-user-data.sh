#!/bin/bash
# Restore user data from S3 storage

USER_ID=${USER_ID:-1000}
S3_BUCKET=${S3_BUCKET:-modulus-user-data}
HOME_DIR="/home/student"

echo "Starting data restore for user $USER_ID..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "⚠️  AWS CLI not configured - starting with fresh environment"
    exit 0
fi

# Check if backup exists
if aws s3 ls "s3://$S3_BUCKET/users/$USER_ID/latest.tar.gz" >/dev/null 2>&1; then
    echo "📦 Found existing backup, restoring..."
    
    # Download backup
    if aws s3 cp "s3://$S3_BUCKET/users/$USER_ID/latest.tar.gz" "/tmp/restore-$USER_ID.tar.gz"; then
        echo "✅ Backup downloaded successfully"
        
        # Create temporary extraction directory
        mkdir -p "/tmp/backup-$USER_ID"
        cd "/tmp"
        
        # Extract backup
        if tar -xzf "restore-$USER_ID.tar.gz" -C "/tmp/"; then
            echo "✅ Backup extracted successfully"
            
            # Restore files to home directory
            if [ -d "/tmp/backup-$USER_ID" ]; then
                # Copy restored files, preserving existing structure
                cp -r "/tmp/backup-$USER_ID"/* "$HOME_DIR/" 2>/dev/null || true
                
                # Set proper ownership
                chown -R student:student "$HOME_DIR"
                
                # Set proper permissions
                chmod 700 "$HOME_DIR/.ssh" 2>/dev/null || true
                chmod 600 "$HOME_DIR/.ssh/"* 2>/dev/null || true
                
                echo "✅ User data restored successfully"
                
                # Show what was restored
                echo "📁 Restored directories and files:"
                find "$HOME_DIR" -maxdepth 2 -type d -not -path "$HOME_DIR" | sort
            else
                echo "⚠️  Backup extraction directory not found"
            fi
        else
            echo "❌ Failed to extract backup"
        fi
        
        # Cleanup
        rm -rf "/tmp/restore-$USER_ID.tar.gz" "/tmp/backup-$USER_ID"
    else
        echo "❌ Failed to download backup"
    fi
else
    echo "🆕 No existing backup found for user $USER_ID - starting with fresh environment"
    
    # Create default directories with some helpful content
    mkdir -p "$HOME_DIR"/{Desktop,Documents,Scripts,Projects}
    
    # Create a getting started guide
    cat > "$HOME_DIR/Documents/Getting_Started.md" << 'EOF'
# Welcome to Modulus LMS Kali Linux Desktop!

## Your Persistent Data
The following directories are automatically backed up to AWS S3:
- `~/Documents` - Your documents and notes
- `~/Scripts` - Custom scripts and tools
- `~/Projects` - Project files and code
- `~/.config` - Application settings
- `~/.ssh` - SSH keys and configurations
- `~/.gitconfig` - Git configuration

## Available Tools
This Kali Linux environment includes:
- **Network Tools**: nmap, wireshark, aircrack-ng
- **Web Security**: burpsuite, sqlmap, dirb, nikto
- **Password Tools**: john, hashcat, hydra
- **Frameworks**: metasploit-framework
- **Development**: git, vim, nano

## Tips
1. Save your work in the `Documents`, `Scripts`, or `Projects` folders
2. Your browser bookmarks and settings are preserved
3. SSH keys in `~/.ssh` are automatically backed up
4. The desktop automatically saves every 15 minutes
5. A final backup runs when you close the session

Happy hacking! 🛡️
EOF

    # Create example script
    cat > "$HOME_DIR/Scripts/example_scan.sh" << 'EOF'
#!/bin/bash
# Example nmap scan script
# Usage: ./example_scan.sh <target_ip>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <target_ip>"
    exit 1
fi

TARGET=$1
echo "Scanning $TARGET..."

# Basic port scan
nmap -sS -O "$TARGET"

echo "Scan complete!"
EOF
    chmod +x "$HOME_DIR/Scripts/example_scan.sh"
    
    # Set ownership
    chown -R student:student "$HOME_DIR"
    
    echo "✅ Fresh environment initialized with default content"
fi

echo "🏠 Home directory size: $(du -sh $HOME_DIR | cut -f1)"
echo "📂 User data restore completed"
