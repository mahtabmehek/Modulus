const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use('/labs', express.static(path.join(__dirname, '../../public/labs')));

// Simple command simulation for web terminal
const simulateCommand = (command) => {
    const cmd = command.trim().toLowerCase();
    
    switch(cmd) {
        case 'ls':
            return 'Desktop  Documents  Downloads  Pictures  lab-files\n';
        case 'pwd':
            return '/home/kali\n';
        case 'whoami':
            return 'kali\n';
        case 'date':
            return new Date().toString() + '\n';
        case 'help':
            return 'Available commands: ls, pwd, whoami, date, nmap, help, clear\n';
        case 'nmap':
            return 'Starting Nmap scan...\nHost 192.168.1.1 is up\nPORT   STATE SERVICE\n22/tcp open  ssh\n80/tcp open  http\n';
        default:
            return `Command not found: ${command}\n`;
    }
};

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New terminal connection established');
    
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Welcome to Modulus Lab Terminal\nKali Linux Environment Ready\n'
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'command') {
                const output = simulateCommand(data.command);
                ws.send(JSON.stringify({
                    type: 'output',
                    data: output
                }));
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        console.log('Terminal connection closed');
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'modulus-labs' });
});

// Default route
app.get('/', (req, res) => {
    res.redirect('/labs/web-terminal.html');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🧪 Modulus Labs server running on port ${PORT}`);
    console.log(`🖥️  Terminal available at http://localhost:${PORT}/labs/web-terminal.html`);
});
