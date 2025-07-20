# Kali Linux noVNC Setup

## Quick Start

1. **Start Kali Desktop:**
   ```bash
   docker-compose -f docker-compose.kali.yml up -d
   ```

2. **Access Kali Desktop:**
   - Open browser: `https://localhost:6901`
   - Username: `kasm_user`
   - Password: `password`

3. **Stop Kali Desktop:**
   ```bash
   docker-compose -f docker-compose.kali.yml down
   ```

## Features

- ✅ Full Kali Linux rolling release
- ✅ Web-based desktop (noVNC)
- ✅ Pre-installed penetration testing tools
- ✅ Shared folder at `/home/kasm-user/Desktop/shared`
- ✅ Persistent storage
- ✅ Internet access for tool updates

## Usage

### Update Kali tools:
```bash
# In Kali terminal:
sudo apt update && sudo apt upgrade -y
```

### Install additional tools:
```bash
# In Kali terminal:
sudo apt install [tool-name]
```

### Access shared files:
- Files in `./kali-shared/` folder are available at `/home/kasm-user/Desktop/shared`

## Tips

- Use `Ctrl+Alt+Shift` to release mouse/keyboard from browser
- Right-click desktop for terminal access
- Tools are in Applications menu
- Default VNC password is `kali123` (can be changed in docker-compose.kali.yml)
