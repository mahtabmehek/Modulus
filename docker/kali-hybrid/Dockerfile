FROM kalilinux/kali-rolling:latest

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV USER_ID=1000
ENV LAB_ID=default
ENV S3_BUCKET=modulus-user-data
ENV AWS_DEFAULT_REGION=eu-west-2

# Install essential packages
RUN apt update && apt install -y \
    # Desktop environment (lightweight)
    xfce4-session \
    xfce4-panel \
    xfce4-desktop \
    xfwm4 \
    xfce4-terminal \
    # VNC and web access
    tightvncserver \
    novnc \
    websockify \
    supervisor \
    # Browser and basic tools
    firefox-esr \
    nano \
    vim \
    curl \
    wget \
    git \
    # AWS CLI for backup/restore
    awscli \
    # File management and compression
    rsync \
    tar \
    gzip \
    jq \
    # Essential Kali tools (pre-installed for faster startup)
    nmap \
    wireshark-qt \
    burpsuite \
    sqlmap \
    dirb \
    nikto \
    hydra \
    john \
    hashcat-data \
    aircrack-ng \
    metasploit-framework \
    # Cleanup
    && apt clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Create user with specific UID/GID
RUN groupadd -g 1000 student && \
    useradd -u 1000 -g 1000 -m -s /bin/bash student && \
    echo "student:kali123" | chpasswd && \
    usermod -aG sudo student

# Setup VNC directory and permissions
RUN mkdir -p /home/student/.vnc && \
    chown -R student:student /home/student/.vnc

# Create default directories
RUN mkdir -p /home/student/{Desktop,Documents,Scripts,Projects,Labs} && \
    chown -R student:student /home/student

# Copy configuration files
COPY files/xstartup /home/student/.vnc/xstartup
COPY files/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY scripts/backup-user-data.sh /opt/backup-user-data.sh
COPY scripts/restore-user-data.sh /opt/restore-user-data.sh
COPY scripts/vnc-startup.sh /opt/vnc-startup.sh

# Set permissions
RUN chmod +x /home/student/.vnc/xstartup && \
    chmod +x /opt/*.sh && \
    chown student:student /home/student/.vnc/xstartup

# Setup default VNC password
RUN echo "kali123" | vncpasswd -f > /home/student/.vnc/passwd && \
    chmod 600 /home/student/.vnc/passwd && \
    chown student:student /home/student/.vnc/passwd

# Create welcome files
RUN echo "Welcome to Modulus LMS Kali Linux Desktop!" > /home/student/Desktop/Welcome.txt && \
    echo "Your files and settings are automatically saved to AWS S3." >> /home/student/Desktop/Welcome.txt && \
    echo "This environment includes:" >> /home/student/Desktop/Welcome.txt && \
    echo "- All essential Kali Linux penetration testing tools" >> /home/student/Desktop/Welcome.txt && \
    echo "- Firefox web browser" >> /home/student/Desktop/Welcome.txt && \
    echo "- Text editors (nano, vim)" >> /home/student/Desktop/Welcome.txt && \
    echo "- Git for version control" >> /home/student/Desktop/Welcome.txt && \
    echo "" >> /home/student/Desktop/Welcome.txt && \
    echo "Your data in ~/Documents, ~/Scripts, and ~/Projects is preserved between sessions." >> /home/student/Desktop/Welcome.txt && \
    chown student:student /home/student/Desktop/Welcome.txt

# Create lab materials directory structure
RUN mkdir -p /home/student/Labs/{nmap,burpsuite,wireshark,metasploit,web-security} && \
    chown -R student:student /home/student/Labs

# Expose VNC and noVNC ports
EXPOSE 5901 6080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:6080/ || exit 1

# Start script
CMD ["/opt/vnc-startup.sh"]
