# VNC Kali Linux Implementation Recommendation

## Recommended Solution: Ultra-Cheap Shared EC2 (Option 4)

**Why this is the best option for your LMS:**

### Cost Benefits
- **Ultra-low cost**: <$0.01 per user per hour
- **Predictable pricing**: Fixed EC2 Spot instance cost
- **High density**: 20-30 users per instance
- **Minimal overhead**: Docker containers vs. full VMs

### Educational Benefits
- **Isolated environments**: Each user gets their own Kali container
- **Pre-configured labs**: Easy to deploy specific lab environments
- **Web-based access**: No VNC client installation required
- **Auto-cleanup**: Prevents resource waste

## Implementation Steps

### Phase 1: Backend API Integration (Week 1)

1. **Add Desktop Session Management to Backend**
```javascript
// Add to backend/routes/desktop.js
const express = require('express');
const CheapDesktopManager = require('../services/DesktopManager');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const desktopManager = new CheapDesktopManager();

// Create desktop session
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { labId } = req.body;
    const userId = req.user.id;
    
    const session = await desktopManager.createUserSession(userId, labId);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current session
router.get('/session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = desktopManager.getUserSession(userId);
    
    if (!session) {
      return res.status(404).json({ error: 'No active session' });
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Terminate session
router.delete('/terminate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await desktopManager.terminateUserSession(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

2. **Database Schema Updates**
```sql
-- Add to schema.sql
CREATE TABLE IF NOT EXISTS desktop_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    lab_id INTEGER,
    container_id VARCHAR(255) UNIQUE,
    vnc_port INTEGER,
    web_port INTEGER,
    status VARCHAR(50) DEFAULT 'running',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    terminated_at TIMESTAMP
);

CREATE INDEX idx_desktop_sessions_user_id ON desktop_sessions(user_id);
CREATE INDEX idx_desktop_sessions_status ON desktop_sessions(status);
```

### Phase 2: Frontend Integration (Week 1)

3. **Add Desktop Component to Frontend**
```typescript
// src/components/desktop/DesktopSession.tsx
import { useState, useEffect } from 'react';
import { Monitor, Power, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DesktopSessionProps {
  labId: string;
  onClose: () => void;
}

export function DesktopSession({ labId, onClose }: DesktopSessionProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createSession = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/desktop/create', { labId });
      setSession(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create desktop session');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async () => {
    try {
      await apiClient.delete('/desktop/terminate');
      setSession(null);
      onClose();
    } catch (err) {
      console.error('Failed to terminate session:', err);
    }
  };

  useEffect(() => {
    // Check for existing session
    apiClient.get('/desktop/session')
      .then(response => setSession(response.data))
      .catch(() => {
        // No existing session, will need to create one
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Creating your Kali Linux environment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={createSession}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center p-8">
        <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Kali Linux Desktop</h3>
        <p className="text-gray-600 mb-4">
          Launch a dedicated Kali Linux environment for this lab
        </p>
        <button 
          onClick={createSession}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Launch Desktop
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Monitor className="w-5 h-5 mr-2" />
          <span>Kali Linux Desktop - Lab {labId}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-green-400">● Online</span>
          <button 
            onClick={terminateSession}
            className="text-red-400 hover:text-red-300"
            title="Terminate Session"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1">
        <iframe 
          src={session.webUrl}
          className="w-full h-full border-0"
          title="Kali Linux Desktop"
        />
      </div>
    </div>
  );
}
```

### Phase 3: Infrastructure Setup (Week 2)

4. **EC2 Instance Configuration**
```bash
#!/bin/bash
# setup-kali-host.sh - Setup script for EC2 instance

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Install Nginx for proxying
apt install -y nginx

# Install monitoring tools
apt install -y htop iotop nethogs

# Configure Docker daemon for production
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker

# Build Kali container
git clone https://github.com/your-org/kali-vnc-docker.git
cd kali-vnc-docker
docker build -t modulus-kali-lite:latest .

# Setup auto-cleanup cron job
echo "0 */2 * * * /opt/cleanup-containers.sh" | crontab -

# Setup monitoring
echo "*/5 * * * * /opt/monitor-resources.sh" | crontab -

echo "Setup complete! Ready to serve Kali desktops."
```

### Phase 4: Monitoring & Optimization (Week 3)

5. **CloudWatch Integration**
```javascript
// backend/services/MonitoringService.js
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({ region: 'us-west-2' });

class MonitoringService {
  async publishMetrics(metrics) {
    const params = {
      Namespace: 'ModulusLMS/Desktop',
      MetricData: Object.entries(metrics).map(([name, value]) => ({
        MetricName: name,
        Value: value,
        Timestamp: new Date(),
        Unit: name.includes('Count') ? 'Count' : 'Percent'
      }))
    };

    try {
      await cloudwatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to publish metrics:', error);
    }
  }

  async getSystemMetrics() {
    const docker = require('dockerode')();
    const containers = await docker.listContainers();
    const kaliContainers = containers.filter(c => 
      c.Names.some(name => name.includes('kali-'))
    );

    return {
      ActiveSessions: kaliContainers.length,
      RunningContainers: containers.length,
      // Add more metrics as needed
    };
  }
}

module.exports = MonitoringService;
```

## Next Steps

1. **Choose your pricing model**:
   - Spot instances for maximum savings
   - Reserved instances for predictable usage
   - On-demand for development/testing

2. **Security considerations**:
   - Network isolation between containers
   - Resource limits to prevent abuse
   - Session timeouts
   - User activity monitoring

3. **Scaling strategy**:
   - Auto-scaling groups for peak usage
   - Container density optimization
   - Geographic distribution if needed

Would you like me to start implementing any of these phases, or do you have questions about the architecture?
