#!/bin/bash
# Backup user data to S3 storage

USER_ID=${USER_ID:-1000}
S3_BUCKET=${S3_BUCKET:-modulus-user-data}
HOME_DIR="/home/student"

echo "Starting backup for user $USER_ID..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "⚠️  AWS CLI not configured - skipping backup"
    exit 0
fi

# Create backup directory
BACKUP_DIR="/tmp/backup-$USER_ID"
mkdir -p "$BACKUP_DIR"

# Define what to backup (selective backup for efficiency)
backup_paths=(
    ".config"           # User settings and app configurations
    ".local/share"      # Application data
    ".ssh"              # SSH keys and configurations
    ".gitconfig"        # Git configuration
    ".vimrc"           # Vim configuration
    ".bashrc"          # Shell configuration
    ".profile"         # Shell profile
    ".mozilla"         # Firefox data (bookmarks, history, etc.)
    "Desktop"          # Desktop files
    "Documents"        # User documents
    "Scripts"          # Custom scripts
    "Projects"         # Project files
    ".vnc/passwd"      # VNC password
)

# Track what we actually back up
backed_up_items=()

echo "📦 Creating backup package..."

# Copy user data to backup directory
for path in "${backup_paths[@]}"; do
    if [ -e "$HOME_DIR/$path" ]; then
        # Create parent directory if needed
        parent_dir=$(dirname "$BACKUP_DIR/$path")
        mkdir -p "$parent_dir"
        
        # Copy the file or directory
        if cp -r "$HOME_DIR/$path" "$BACKUP_DIR/$path" 2>/dev/null; then
            backed_up_items+=("$path")
            size=$(du -sh "$HOME_DIR/$path" 2>/dev/null | cut -f1 || echo "unknown")
            echo "  ✅ $path ($size)"
        else
            echo "  ⚠️  Failed to backup $path"
        fi
    fi
done

# Create metadata file
cat > "$BACKUP_DIR/metadata.json" << EOF
{
    "userId": "$USER_ID",
    "backupDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "1.0",
    "contents": $(printf '%s\n' "${backed_up_items[@]}" | jq -R . | jq -s .),
    "totalItems": ${#backed_up_items[@]},
    "environment": "kali-hybrid"
}
EOF

# Compress backup
cd /tmp
echo "🗜️  Compressing backup..."
if tar -czf "user-$USER_ID-backup.tar.gz" "backup-$USER_ID" 2>/dev/null; then
    backup_size=$(du -sh "user-$USER_ID-backup.tar.gz" | cut -f1)
    echo "✅ Backup compressed successfully ($backup_size)"
else
    echo "❌ Failed to compress backup"
    rm -rf "$BACKUP_DIR"
    exit 1
fi

# Upload to S3
echo "☁️  Uploading backup to S3..."

# Upload as latest backup
if aws s3 cp "user-$USER_ID-backup.tar.gz" "s3://$S3_BUCKET/users/$USER_ID/latest.tar.gz"; then
    echo "✅ Latest backup uploaded successfully"
    
    # Also keep timestamped backup
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    if aws s3 cp "user-$USER_ID-backup.tar.gz" "s3://$S3_BUCKET/users/$USER_ID/backup-$TIMESTAMP.tar.gz"; then
        echo "✅ Timestamped backup saved: backup-$TIMESTAMP.tar.gz"
    else
        echo "⚠️  Failed to save timestamped backup"
    fi
    
    # Clean up old backups (keep last 10)
    echo "🧹 Cleaning up old backups..."
    aws s3 ls "s3://$S3_BUCKET/users/$USER_ID/" --recursive | \
        grep "backup-" | \
        sort -k1,2 | \
        head -n -10 | \
        awk '{print $4}' | \
        while read -r old_backup; do
            if [ -n "$old_backup" ]; then
                aws s3 rm "s3://$S3_BUCKET/$old_backup"
                echo "  🗑️  Removed old backup: $(basename "$old_backup")"
            fi
        done
    
else
    echo "❌ Failed to upload backup to S3"
    rm -rf "/tmp/backup-$USER_ID" "/tmp/user-$USER_ID-backup.tar.gz"
    exit 1
fi

# Cleanup local files
rm -rf "/tmp/backup-$USER_ID" "/tmp/user-$USER_ID-backup.tar.gz"

echo "📊 Backup Summary:"
echo "  📁 Items backed up: ${#backed_up_items[@]}"
echo "  📦 Backup size: $backup_size"
echo "  ☁️  S3 location: s3://$S3_BUCKET/users/$USER_ID/"
echo "✅ Backup completed successfully for user $USER_ID"
