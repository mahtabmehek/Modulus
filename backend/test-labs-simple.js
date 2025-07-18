// Simple test using the same modules from built-in Node.js
const http = require('http');
const https = require('https');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testLabsEndpoint() {
  try {
    console.log('🔍 Testing labs endpoint...');
    
    // First login
    const loginResult = await makeRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'student@test.com',
        password: 'Mahtabmehek@1337'
      })
    });
    
    console.log('Login result:', loginResult.status, loginResult.data);
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResult.data.token;
    
    // Test labs endpoint with module_id=7
    const labsResult = await makeRequest('http://localhost:3001/api/labs?module_id=7', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Labs API Result:', labsResult.status);
    console.log('Labs Data:', JSON.stringify(labsResult.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLabsEndpoint();
