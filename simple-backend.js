const http = require('http');
const url = require('url');

const PORT = 3001;

// Test users
const users = {
  'student@test.com': { id: 'user-1', name: 'Test Student', role: 'student', password: 'student123' },
  'instructor@test.com': { id: 'user-2', name: 'Test Instructor', role: 'instructor', password: 'instructor123' },
  'admin@test.com': { id: 'user-3', name: 'Test Admin', role: 'admin', password: 'admin123' },
  // Also accept @modulus.com domain
  'student@modulus.com': { id: 'user-1', name: 'Test Student', role: 'student', password: 'student123' },
  'instructor@modulus.com': { id: 'user-2', name: 'Test Instructor', role: 'instructor', password: 'instructor123' },
  'admin@modulus.com': { id: 'user-3', name: 'Test Admin', role: 'admin', password: 'admin123' }
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  // Health check
  if (req.method === 'GET' && parsedUrl.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
    return;
  }

  // Login endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/api/auth/login') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        const user = users[email];
        
        if (user && user.password === password) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            message: 'Login successful',
            user: {
              id: user.id,
              email: email,
              name: user.name,
              role: user.role,
              isApproved: true
            },
            token: 'fake-jwt-token-for-dev'
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid email or password' }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Simple backend running on port ${PORT}`);
  console.log('✅ Test credentials: student@test.com/student123, instructor@test.com/instructor123, admin@test.com/admin123');
});
