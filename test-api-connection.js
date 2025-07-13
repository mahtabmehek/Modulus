const https = require('https');

// Test API connection similar to how the frontend would do it
const API_URL = 'https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/api';

function testApiConnection() {
  console.log('Testing API connection...');
  console.log('API URL:', API_URL);
  
  // Test health endpoint
  const healthUrl = `${API_URL}/health`;
  
  https.get(healthUrl, (res) => {
    console.log('\n✅ Health Check:');
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      
      // Test login endpoint
      testLogin();
    });
  }).on('error', (err) => {
    console.error('❌ Health check failed:', err.message);
  });
}

function testLogin() {
  console.log('\n🔐 Testing Login...');
  
  const loginData = JSON.stringify({
    email: 'admin@test.com',
    password: 'Mahtabmehek@1337'
  });
  
  const options = {
    hostname: '2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  const req = https.request(options, (res) => {
    console.log('Login Status Code:', res.statusCode);
    console.log('Login Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Login Response:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Login test successful!');
      } else {
        console.log('❌ Login test failed');
      }
    });
  });
  
  req.on('error', (err) => {
    console.error('❌ Login request failed:', err.message);
  });
  
  req.write(loginData);
  req.end();
}

// Run the test
testApiConnection();
