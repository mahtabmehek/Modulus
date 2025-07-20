# Kali Desktop Integration - Technical Reference

## Overview
Complete Kali Linux desktop integration with noVNC browser access, Docker containerization, and 3GB memory limits.

## Architecture

### Components
1. **Frontend**: `src/components/views/desktop-view.tsx`
2. **Backend API**: `backend/routes/desktop.js`
3. **Service Layer**: `backend/services/KaliDesktopService.js`
4. **Container**: `kasmweb/kali-rolling-desktop:1.14.0`

### Flow
```
User → Desktop View → API Call → Docker Container → noVNC → Browser Display
```

## Implementation Details

### Docker Container Configuration
```bash
docker run -d \
  --name kali-user-${userId}-${timestamp} \
  -p ${port}:6901 \
  -e VNC_PW=kali-123 \
  --cap-add=NET_ADMIN \
  --cap-add=SYS_ADMIN \
  --memory=3g \
  --memory-swap=3g \
  kasmweb/kali-rolling-desktop:1.14.0
```

### API Endpoints
- `GET /api/desktop/session` - Check existing session
- `POST /api/desktop/create` - Create new session
- `DELETE /api/desktop/terminate` - Terminate session

### Authentication
- JWT token verification
- User ID extraction for container naming
- Fallback secret for development

## Current Status
- ✅ Code implementation complete
- ✅ Memory limits (3GB) applied
- ✅ Docker Desktop operational
- ✅ Authentication working
- ✅ Servers running (ports 3000/3001)
- 🔄 Ready for user testing

## Testing
Access: `http://localhost:3000/?view=desktop`
Expected: Automatic Kali desktop session in browser

## File Sizes
Total Kali setup: ~0.12 MB in project folder
Runtime: ~2-3GB Docker image (stored in Docker system location)
