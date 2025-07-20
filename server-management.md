# Modulus LMS Server Management

## Quick Start Scripts

### 1. Restart Both Servers (Recommended)
```bash
# Windows Batch (Simple & Fast)
.\restart-servers.bat

# PowerShell (Advanced with port checking)
.\restart-servers.ps1
```

### 2. Manual Start
```bash
# Backend only
cd backend
node server.js

# Frontend only (new terminal)
npm run dev
```

### 3. Stop All Servers
```bash
# Windows
taskkill /f /im node.exe

# PowerShell
Stop-Process -Name "node" -Force
```

## Server Information

- **Frontend**: http://localhost:3000 (Next.js)
- **Backend**: http://localhost:3001 (Express.js)

## Files Created

1. `restart-servers.bat` - Simple batch file for quick restarts
2. `restart-servers.ps1` - Advanced PowerShell script with port checking
3. `server-management.md` - This guide

## Usage Notes

- The batch script is fastest and most reliable
- The PowerShell script provides more detailed feedback
- Both scripts will open separate windows for frontend and backend
- Close the server windows to stop the servers
- The scripts automatically handle port conflicts

## Troubleshooting

- If ports are in use, the scripts will attempt to wait and retry
- Check that both `package.json` (root) and `backend/server.js` exist
- Ensure Node.js and npm are installed and in PATH
