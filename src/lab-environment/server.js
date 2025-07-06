// Web-based Lab Environment Server
// Simulated Kali Linux environment with cybersecurity tools

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Lab session management
const activeSessions = new Map();

// WebSocket connection for terminal access
wss.on('connection', (ws, req) => {
  console.log('New terminal connection');
  
  // Create new PTY process
  const shell = pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: '/home/labuser',
    env: process.env
  });

  // Store session
  const sessionId = Math.random().toString(36).substring(7);
  activeSessions.set(sessionId, { shell, ws });

  // Handle shell output
  shell.on('data', (data) => {
    ws.send(JSON.stringify({ type: 'output', data }));
  });

  // Handle WebSocket messages
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      
      if (msg.type === 'input') {
        shell.write(msg.data);
      } else if (msg.type === 'resize') {
        shell.resize(msg.cols, msg.rows);
      }
    } catch (err) {
      console.error('Message parse error:', err);
    }
  });

  // Cleanup on disconnect
  ws.on('close', () => {
    console.log('Terminal disconnected');
    shell.kill();
    activeSessions.delete(sessionId);
  });
});

// API endpoints
app.get('/api/labs', (req, res) => {
  // Return available labs
  res.json({
    labs: [
      {
        id: 'network-scanning',
        name: 'Network Scanning Basics',
        description: 'Learn nmap and basic reconnaissance',
        difficulty: 'beginner',
        estimatedTime: '30 minutes'
      },
      {
        id: 'web-security',
        name: 'Web Application Security',
        description: 'Identify common web vulnerabilities',
        difficulty: 'intermediate',
        estimatedTime: '45 minutes'
      },
      {
        id: 'password-cracking',
        name: 'Password Cracking',
        description: 'Learn password attack techniques',
        difficulty: 'intermediate',
        estimatedTime: '60 minutes'
      }
    ]
  });
});

app.post('/api/labs/:labId/start', (req, res) => {
  const { labId } = req.params;
  
  // Start lab environment
  console.log(`Starting lab: ${labId}`);
  
  res.json({
    success: true,
    sessionId: Math.random().toString(36).substring(7),
    terminalUrl: `/terminal`,
    message: `Lab ${labId} started successfully`
  });
});

app.get('/api/sessions', (req, res) => {
  res.json({
    activeSessions: activeSessions.size,
    sessions: Array.from(activeSessions.keys())
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    activeSessions: activeSessions.size
  });
});

// Serve terminal interface
app.get('/terminal', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/terminal.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🧪 Lab environment server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💻 Terminal access: http://localhost:${PORT}/terminal`);
});
